/**
 * Vercel Serverless Function: /api/wallet/transactions
 *
 * Accepts: GET ?address=<wallet_address>
 * Returns: { success, network, address, transactions, count } or error
 *
 * GoldRush credentials are used server-side and never returned to the client.
 */

const { getRecentTransactions } = require('../providers/goldrush');

function isValidEVMAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
        const transactions = await getRecentTransactions(address);
        return res.status(200).json({
            success: true,
            network: 'Monad',
            address,
            transactions,
            count: transactions.length,
            status: transactions.length > 0 ? 'success_has_transactions' : 'success_no_transactions'
        });
    } catch (error) {
        console.error('Wallet transactions error:', error.message);

        const statusCode = error.statusCode || 502;
        return res.status(statusCode).json({
            success: false,
            network: 'Monad',
            address,
            transactions: [],
            status: statusCode === 504 ? 'provider_timeout' : 'provider_error',
            error: statusCode === 504
                ? 'GoldRush transaction request timed out'
                : 'Failed to fetch wallet transactions'
        });
    }
};
