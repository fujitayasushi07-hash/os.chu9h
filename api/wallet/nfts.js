/**
 * Vercel Serverless Function: /api/wallet/nfts
 *
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, nfts, status } or error
 *
 * Retrieves Chog Genesis NFT ownership from the hosted Envio GraphQL indexer.
 */

const { ethers } = require('ethers');

const CHOG_GENESIS_NFT_CONTRACT = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763';
const ENVIO_GRAPHQL_URL = 'https://indexer.dev.hyperindex.xyz/7d09780/v1/graphql';
const MONAD_RPC_URL = 'https://rpc.monad.xyz';
const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/'
];
const MAX_NFT_RESULTS = 500;
const REQUEST_TIMEOUT_MS = 10000;
const METADATA_CONCURRENCY = 5;
const ERC721_METADATA_ABI = [
    'function tokenURI(uint256 tokenId) view returns (string)'
];

function isValidEVMAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function getOwnedTokens(owner) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let result;

    try {
        const response = await fetch(ENVIO_GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `query OwnedChogTokens($owner: String!, $limit: Int!) {
                    ChogMint_Token(
                        where: { owner: { _eq: $owner } }
                        limit: $limit
                    ) {
                        id
                        owner
                    }
                }`,
                variables: {
                    owner,
                    limit: MAX_NFT_RESULTS
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const upstreamError = new Error(`NFT indexer request failed with HTTP ${response.status}`);
            upstreamError.statusCode = 502;
            throw upstreamError;
        }

        try {
            result = await response.json();
        } catch (error) {
            if (controller.signal.aborted) throw error;
            const responseError = new Error('NFT indexer returned an invalid response');
            responseError.statusCode = 502;
            throw responseError;
        }
    } catch (error) {
        if (error.statusCode) throw error;
        if (controller.signal.aborted) {
            const timeoutError = new Error('NFT indexer request timed out');
            timeoutError.statusCode = 504;
            throw timeoutError;
        }
        throw new Error('Unable to connect to the NFT indexer');
    } finally {
        clearTimeout(timeout);
    }

    if (result.errors && result.errors.length > 0) {
        const graphqlError = new Error('NFT indexer returned a GraphQL error');
        graphqlError.statusCode = 502;
        throw graphqlError;
    }

    const tokens = result.data && result.data.ChogMint_Token;
    if (!Array.isArray(tokens) || tokens.some(token => !token || token.id === null || token.id === undefined)) {
        const responseError = new Error('NFT indexer returned an unexpected response shape');
        responseError.statusCode = 502;
        throw responseError;
    }

    if (tokens.length === MAX_NFT_RESULTS) {
        const limitError = new Error('NFT indexer result limit reached; refusing to return potentially incomplete results');
        limitError.statusCode = 502;
        throw limitError;
    }

    return tokens;
}

function getIpfsGatewayUrls(uri) {
    const path = uri.slice('ipfs://'.length).replace(/^ipfs\//, '');
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return IPFS_GATEWAYS.map(gateway => gateway + encodedPath);
}

function resolveImageUri(uri) {
    if (typeof uri !== 'string') return uri;
    if (uri.startsWith('ipfs://')) return getIpfsGatewayUrls(uri)[0];
    return uri;
}

async function fetchMetadata(uri) {
    if (typeof uri !== 'string' || !uri) {
        throw new Error('Contract returned an invalid token URI');
    }

    const isIpfsUri = uri.startsWith('ipfs://');
    const urls = isIpfsUri
        ? getIpfsGatewayUrls(uri)
        : [uri];

    if (!urls.every(url => /^https?:\/\//i.test(url)) ||
        (isIpfsUri && !urls.every(url => url.startsWith('https://')))) {
        throw new Error('Unsupported NFT metadata URI scheme');
    }

    let lastError;
    for (const url of urls) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal
                });
                if (!response.ok) {
                    lastError = new Error(`Metadata gateway returned HTTP ${response.status}`);
                    continue;
                }

                const metadata = await response.json();
                if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
                    lastError = new Error('Metadata response is not a JSON object');
                    continue;
                }

                if (typeof metadata.image === 'string') {
                    metadata.image = resolveImageUri(metadata.image);
                }
                return metadata;
            } catch (error) {
                lastError = controller.signal.aborted
                    ? new Error('NFT metadata gateway request timed out')
                    : error;
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError || new Error('Unable to retrieve NFT metadata');
}

async function getTokenMetadata(contract, tokenId) {
    let tokenUrl = null;
    let metadata = null;

    try {
        tokenUrl = await contract.tokenURI(tokenId);
        if (typeof tokenUrl !== 'string' || !tokenUrl) {
            throw new Error('Contract returned an invalid token URI');
        }
        metadata = await fetchMetadata(tokenUrl);
    } catch (error) {
        console.error(`NFT metadata retrieval failed for token ${tokenId}:`, error.message);
    }

    return { tokenUrl, metadata };
}

async function addMetadataToTokens(tokens) {
    if (tokens.length === 0) return [];

    let provider;
    let contract;
    try {
        const request = new ethers.FetchRequest(MONAD_RPC_URL);
        request.timeout = REQUEST_TIMEOUT_MS;
        provider = new ethers.JsonRpcProvider(request);
        contract = new ethers.Contract(
            CHOG_GENESIS_NFT_CONTRACT,
            ERC721_METADATA_ABI,
            provider
        );
    } catch (error) {
        console.error('NFT metadata provider initialization failed:', error.message);
        return tokens.map(token => ({ token, tokenUrl: null, metadata: null }));
    }

    const enrichedTokens = new Array(tokens.length);
    let nextIndex = 0;

    try {
        const workerCount = Math.min(METADATA_CONCURRENCY, tokens.length);
        await Promise.all(Array.from({ length: workerCount }, async () => {
            while (nextIndex < tokens.length) {
                const index = nextIndex++;
                const token = tokens[index];
                try {
                    const { tokenUrl, metadata } = await getTokenMetadata(contract, token.id);
                    enrichedTokens[index] = { token, tokenUrl, metadata };
                } catch (error) {
                    console.error(`Unexpected NFT metadata worker error for token ${token.id}:`, error.message);
                    enrichedTokens[index] = { token, tokenUrl: null, metadata: null };
                }
            }
        }));
    } finally {
        try {
            provider.destroy();
        } catch (error) {
            console.error('NFT metadata provider cleanup failed:', error.message);
        }
    }

    return enrichedTokens;
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { address } = req.query;

    if (!address) {
        return res.status(400).json({
            success: false,
            error: 'Missing wallet address',
            status: 'invalid_request'
        });
    }

    if (!isValidEVMAddress(address)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format',
            status: 'invalid_address'
        });
    }

    try {
        const tokens = await getOwnedTokens(address.toLowerCase());
        const enrichedTokens = await addMetadataToTokens(tokens);
        const nfts = enrichedTokens.map(({ token, tokenUrl, metadata }) => ({
            contract: CHOG_GENESIS_NFT_CONTRACT,
            contractName: 'Chog Genesis',
            tokenId: String(token.id),
            owner: typeof token.owner === 'string' && token.owner ? token.owner : null,
            balance: '1',
            type: 'ERC721',
            metadata,
            tokenMetadata: metadata,
            tokenUrl,
            supportsErc165: true,
            supportsErc721: true,
            supportsErc1155: false
        }));

        return res.status(200).json({
            success: true,
            network: 'Monad',
            address,
            nfts,
            count: nfts.length,
            status: nfts.length > 0 ? 'success_has_nfts' : 'success_no_nfts'
        });
    } catch (error) {
        console.error('Wallet NFT indexer error:', error.message);

        return res.status(error.statusCode || 502).json({
            success: false,
            network: 'Monad',
            address,
            nfts: [],
            status: error.statusCode === 504 ? 'provider_timeout' : 'provider_error',
            error: error.message
        });
    }
};
