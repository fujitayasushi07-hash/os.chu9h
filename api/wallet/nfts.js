/**
 * Vercel Serverless Function: /api/wallet/nfts
 * 
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, nfts, status } or error
 * 
 * Retrieves NFT holdings for a wallet by querying the Chog Genesis contract directly.
 * Uses ethers.js to call ERC-721 balanceOf() and tokenOfOwnerByIndex().
 */

const { ethers } = require('ethers');

// Chog Genesis NFT contract on Monad (ERC-721)
const CHOG_GENESIS_NFT_CONTRACT = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763';

// Monad RPC endpoint (mainnet)
const MONAD_RPC = 'https://rpc.monad.xyz';

// Simple ERC-721 ABI (only methods we need)
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

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
                error: 'Missing wallet address',
                status: 'invalid_request'
            });
        }

        // Validate address format
        if (!isValidEVMAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format',
                status: 'invalid_address'
            });
        }

        // Connect to Monad RPC
        console.log('Connecting to Monad RPC:', MONAD_RPC);
        const provider = new ethers.JsonRpcProvider(MONAD_RPC);

        // Create contract instance
        const contract = new ethers.Contract(
            CHOG_GENESIS_NFT_CONTRACT,
            ERC721_ABI,
            provider
        );

        console.log('Querying Chog Genesis contract for wallet:', address);

        // Check balance of wallet
        let balance;
        try {
            balance = await contract.balanceOf(address);
            console.log('Wallet balance:', balance.toString());
        } catch (error) {
            console.error('Error calling balanceOf:', error.message);
            return res.status(200).json({
                success: false,
                network: 'Monad',
                address: address,
                nfts: [],
                status: 'provider_error',
                error: 'Failed to query contract: ' + error.message
            });
        }

        // If no NFTs, return empty list with success_no_nfts status
        if (balance === 0n) {
            console.log('Wallet owns no Chog Genesis NFTs');
            return res.status(200).json({
                success: true,
                network: 'Monad',
                address: address,
                nfts: [],
                count: 0,
                status: 'success_no_nfts'
            });
        }

        // Wallet owns NFTs - find token IDs by scanning ranges
        const nfts = [];
        const balanceNum = Number(balance);

        console.log('Wallet owns', balanceNum, 'Chog Genesis NFTs. Finding token IDs...');

        try {
            // Since Chog Genesis doesn't implement ERC721Enumerable, we need to find token IDs
            // by scanning ranges. We'll use an intelligent search that starts with common ranges
            // and expands as needed.
            
            const foundTokenIds = [];
            const MAX_TOKEN_ID = 2000; // Chog Genesis has 1969 total supply
            const BATCH_SIZE = 50; // Check 50 tokens at a time
            
            console.log('Scanning token ID ranges to find owned tokens...');
            
            // Scan in batches from 0 to MAX_TOKEN_ID
            for (let tokenId = 0; tokenId < MAX_TOKEN_ID; tokenId += BATCH_SIZE) {
                const batchPromises = [];
                
                // Create promises for checking ownerOf for a batch of token IDs
                for (let i = 0; i < BATCH_SIZE && (tokenId + i) < MAX_TOKEN_ID; i++) {
                    batchPromises.push(
                        contract.ownerOf(tokenId + i)
                            .then(owner => ({
                                tokenId: tokenId + i,
                                owner: owner,
                                owned: owner.toLowerCase() === address.toLowerCase()
                            }))
                            .catch(() => ({
                                tokenId: tokenId + i,
                                owner: null,
                                owned: false,
                                error: true
                            }))
                    );
                }
                
                // Wait for this batch
                const batchResults = await Promise.all(batchPromises);
                
                // Check if any tokens in this batch are owned by the wallet
                for (const result of batchResults) {
                    if (result.owned) {
                        console.log(`Found owned token: ${result.tokenId}`);
                        foundTokenIds.push(result.tokenId);
                    }
                }
                
                // Log progress every 200 tokens
                if ((tokenId + BATCH_SIZE) % 200 === 0) {
                    console.log(`Scanned tokens ${tokenId} to ${tokenId + BATCH_SIZE - 1}, found ${foundTokenIds.length} so far...`);
                }
                
                // If we've found all the tokens the wallet owns, we can stop early
                if (foundTokenIds.length === balanceNum) {
                    console.log(`Found all ${balanceNum} owned tokens`);
                    break;
                }
            }
            
            console.log('Found token IDs:', foundTokenIds);
            
            // Create NFT records for each found token
            for (const tokenId of foundTokenIds) {
                nfts.push({
                    contract: CHOG_GENESIS_NFT_CONTRACT,
                    contractName: 'Chog Genesis',
                    tokenId: tokenId.toString(),
                    balance: '1',
                    type: 'ERC721',
                    tokenMetadata: null,
                    tokenUrl: null,
                    supportsErc165: true,
                    supportsErc721: true,
                    supportsErc1155: false
                });
            }

        } catch (error) {
            console.error('Error finding NFT token IDs:', error.message);
            // Fall back: if token search fails, return what we have (nothing)
        }

        console.log('Total Chog Genesis NFTs found:', nfts.length);

        return res.status(200).json({
            success: true,
            network: 'Monad',
            address: address,
            nfts: nfts,
            count: nfts.length,
            status: nfts.length > 0 ? 'success_has_nfts' : 'success_no_nfts'
        });

    } catch (error) {
        console.error('Wallet NFT error:', error.message);

        return res.status(200).json({
            success: false,
            network: 'Monad',
            address: req.query.address || '',
            nfts: [],
            status: 'error',
            error: error.message
        });
    }
};

