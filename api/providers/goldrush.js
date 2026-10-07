/**
 * GoldRush Provider
 * 
 * Server-side module for querying Monad native MON balance via GoldRush API.
 * API key is read from process.env.GOLDRUSH_API_KEY and never exposed to frontend.
 */

/**
 * Fetch native MON balance for a Monad wallet address
 * @param {string} walletAddress - EVM wallet address on Monad
 * @returns {Promise<{balance: string, symbol: string, decimals: number}>}
 */
async function getNativeBalance(walletAddress) {
    const apiKey = process.env.GOLDRUSH_API_KEY;
    
    if (!apiKey) {
        throw new Error('GoldRush API key not configured');
    }

    const endpoint = 'https://api.covalenthq.com/v1/monad-mainnet/address/' + walletAddress + '/balances_native/';
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error('GoldRush API error: ' + response.status);
    }

    const data = await response.json();

    if (!data.data || !data.data.items || data.data.items.length === 0) {
        return {
            balance: '0',
            symbol: 'MON',
            decimals: 18
        };
    }

    const nativeBalance = data.data.items[0];

    return {
        balance: nativeBalance.balance || '0',
        symbol: 'MON',
        decimals: nativeBalance.contract_decimals || 18
    };
}

module.exports = { getNativeBalance };
