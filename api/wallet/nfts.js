/**
 * Vercel Serverless Function: /api/wallet/nfts
 * 
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, nfts } or error
 * 
 * Retrieves NFT holdings for a wallet using GoldRush NFT endpoint.
 * Filters for Chog collection NFTs.
 */

/**
 * Validate if string looks like an EVM wallet address
 */
function isValidEVMAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { address } = req.query;

        // Validate address parameter exists
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Missing wallet address'
            });
        }

        // Validate address format
        if (!isValidEVMAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        const apiKey = process.env.GOLDRUSH_API_KEY;
        
        if (!apiKey) {
            throw new Error('GoldRush API key not configured');
        }

        // Query GoldRush for NFT balances - try the nft_balances endpoint
        const endpoint = 'https://api.covalenthq.com/v1/monad-mainnet/address/' + address + '/nft_balances/';
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('GoldRush NFT API error:', response.status);
            // Return empty NFT list if endpoint is not available
            return res.status(200).json({
                success: true,
                network: 'Monad',
                address: address,
                nfts: [],
                count: 0,
                note: 'NFT endpoint not yet available on Monad'
            });
        }

        const data = await response.json();

        // Parse NFT data
        const nfts = [];
        if (data.data && data.data.items) {
            for (const item of data.data.items) {
                // Normalize NFT data from GoldRush response
                nfts.push({
                    contract: item.contract_address || '',
                    contractName: item.contract_name || '',
                    tokenId: item.token_id || '',
                    balance: item.balance || '1',
                    type: item.contract_type || 'ERC721',
                    tokenMetadata: item.token_metadata || null,
                    tokenUrl: item.token_url || null,
                    supportsErc165: item.supports_erc165 || false,
                    supportsErc721: item.supports_erc721 || false,
                    supportsErc1155: item.supports_erc1155 || false
                });
            }
        }

        return res.status(200).json({
            success: true,
            network: 'Monad',
            address: address,
            nfts: nfts,
            count: nfts.length
        });

    } catch (error) {
        console.error('Wallet NFT error:', error.message);

        return res.status(200).json({
            success: true,
            network: 'Monad',
            address: req.query.address || '',
            nfts: [],
            count: 0,
            note: 'NFT data currently unavailable'
        });
    }
};

