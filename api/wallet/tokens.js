/**
 * Vercel Serverless Function: /api/wallet/tokens
 * 
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, tokens } or error
 * 
 * Security:
 * - GoldRush API key is read from process.env.GOLDRUSH_API_KEY
 * - Never exposed in response or frontend
 * - Validates wallet address format before making API call
 */

const { getTokenBalances } = require('../providers/goldrush');

/**
 * Validate if string looks like an EVM wallet address
 */
function isValidEVMAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format token balance from wei to human-readable amount
 */
function formatTokenBalance(balanceInWei, decimals = 0) {
    if (!balanceInWei || balanceInWei === '0') return '0';
    
    const divisor = Math.pow(10, decimals);
    const balanceAmount = parseFloat(balanceInWei) / divisor;
    
    return balanceAmount.toLocaleString('en-US', {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0
    });
}

/**
 * Format USD value
 */
function formatUSD(value) {
    if (!value || value === 0) return '0';
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
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

        // Fetch tokens from GoldRush
        const tokenData = await getTokenBalances(address);

        // Format tokens for frontend
        const tokens = tokenData.map(token => {
            const formattedBalance = formatTokenBalance(token.balance, token.decimals);
            const quotePrice = token.quote_rate || 0;
            const quoteValue = (parseFloat(formattedBalance) * quotePrice).toFixed(2);

            return {
                symbol: token.symbol,
                name: token.name,
                contract: token.contract,
                balance: formattedBalance,
                decimals: token.decimals,
                quote_rate: quotePrice > 0 ? quotePrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'N/A',
                quote_value: quotePrice > 0 ? formatUSD(quoteValue) : 'N/A'
            };
        });

        return res.status(200).json({
            success: true,
            tokens: tokens
        });

    } catch (error) {
        // Log error server-side (won't expose to frontend)
        console.error('Wallet tokens error:', error.message);

        // Return generic error to frontend
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch token holdings'
        });
    }
};
