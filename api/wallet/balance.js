/**
 * Vercel Serverless Function: /api/wallet/balance
 * 
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, network, symbol, balance } or error
 * 
 * Security:
 * - GoldRush API key is read from process.env.GOLDRUSH_API_KEY
 * - Never exposed in response or frontend
 * - Validates wallet address format before making API call
 */

const { getNativeBalance } = require('../providers/goldrush');

/**
 * Validate if string looks like an EVM wallet address
 */
function isValidEVMAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format balance from wei to human-readable MON
 */
function formatBalance(balanceInWei, decimals = 18) {
    if (!balanceInWei) return '0';
    
    // Convert from wei to MON (18 decimals)
    const divisor = Math.pow(10, decimals);
    const balanceInMON = parseFloat(balanceInWei) / divisor;
    
    // Return with max 6 decimal places
    return balanceInMON.toLocaleString('en-US', {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0
    });
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

        // Fetch balance from GoldRush
        const balanceData = await getNativeBalance(address);

        // Format for frontend
        const formattedBalance = formatBalance(balanceData.balance, balanceData.decimals);

        return res.status(200).json({
            success: true,
            network: 'Monad',
            symbol: 'MON',
            balance: formattedBalance
        });

    } catch (error) {
        // Log error server-side (won't expose to frontend)
        console.error('Wallet balance error:', error.message);

        // Return generic error to frontend
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch wallet balance'
        });
    }
};
