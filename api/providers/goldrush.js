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

/**
 * Fetch ERC-20 token balances for a Monad wallet address
 * @param {string} walletAddress - EVM wallet address on Monad
 * @returns {Promise<Array<{contract: string, symbol: string, name: string, balance: string, decimals: number, quote_rate: number}>>}
 */
async function getTokenBalances(walletAddress) {
    const apiKey = process.env.GOLDRUSH_API_KEY;
    
    if (!apiKey) {
        throw new Error('GoldRush API key not configured');
    }

    const endpoint = 'https://api.covalenthq.com/v1/monad-mainnet/address/' + walletAddress + '/balances_v2/?quote-currency=usd';
    
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

    if (!data.data || !data.data.items) {
        return [];
    }

    const tokens = [];
    for (const item of data.data.items) {
        if (item.contract_address === null) {
            continue;
        }

        tokens.push({
            contract: item.contract_address || '',
            symbol: item.contract_ticker_symbol || 'UNKNOWN',
            name: item.contract_name || '',
            balance: item.balance || '0',
            decimals: item.contract_decimals || 0,
            quote_rate: item.quote_rate || 0
        });
    }

    return tokens;
}

/**
 * Fetch recent Monad transactions for a wallet address
 * @param {string} walletAddress - EVM wallet address on Monad
 * @returns {Promise<Array<{hash: string, timestamp: string, from: string, to: string|null, nativeValueWei: string, successful: boolean, explorerUrl: string|null}>>}
 */
async function getRecentTransactions(walletAddress) {
    const apiKey = process.env.GOLDRUSH_API_KEY;

    if (!apiKey) {
        const error = new Error('GoldRush API key not configured');
        error.statusCode = 503;
        throw error;
    }

    const endpoint = 'https://api.covalenthq.com/v1/monad-mainnet/address/' +
        encodeURIComponent(walletAddress) + '/transactions_v3/?no-logs=true&quote-currency=USD';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    let result;

    try {
        response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        if (!response.ok) {
            const upstreamError = new Error(`GoldRush transaction request failed with HTTP ${response.status}`);
            upstreamError.statusCode = 502;
            throw upstreamError;
        }

        try {
            result = await response.json();
        } catch (error) {
            if (controller.signal.aborted) throw error;
            const responseError = new Error('GoldRush returned an invalid transaction response');
            responseError.statusCode = 502;
            throw responseError;
        }
    } catch (error) {
        if (error.statusCode) throw error;
        const requestError = new Error(
            controller.signal.aborted
                ? 'GoldRush transaction request timed out'
                : 'Unable to connect to GoldRush'
        );
        requestError.statusCode = controller.signal.aborted ? 504 : 502;
        throw requestError;
    } finally {
        clearTimeout(timeout);
    }

    const items = result && result.data && result.data.items;
    if (!Array.isArray(items)) {
        const responseError = new Error('GoldRush returned an unexpected transaction response shape');
        responseError.statusCode = 502;
        throw responseError;
    }

    return items.slice(0, 25).map(item => {
        if (!item ||
            typeof item.tx_hash !== 'string' ||
            typeof item.block_signed_at !== 'string' ||
            typeof item.from_address !== 'string' ||
            typeof item.value !== 'string' ||
            typeof item.successful !== 'boolean' ||
            (item.to_address !== undefined &&
                item.to_address !== null &&
                typeof item.to_address !== 'string')) {
            const responseError = new Error('GoldRush returned an unexpected transaction item shape');
            responseError.statusCode = 502;
            throw responseError;
        }

        let explorerUrl = null;
        if (Array.isArray(item.explorers)) {
            for (const explorer of item.explorers) {
                if (!explorer || typeof explorer.url !== 'string') continue;
                try {
                    const url = new URL(explorer.url);
                    const hasCredentialParameter = Array.from(url.searchParams.keys())
                        .some(key => /^(key|api[_-]?key|token|authorization)$/i.test(key));
                    if ((url.protocol === 'https:' || url.protocol === 'http:') &&
                        !url.username &&
                        !url.password &&
                        !hasCredentialParameter) {
                        explorerUrl = url.toString();
                        break;
                    }
                } catch (error) {
                    // Ignore malformed optional explorer URLs.
                }
            }
        }

        return {
            hash: item.tx_hash,
            timestamp: item.block_signed_at,
            from: item.from_address,
            to: item.to_address || null,
            nativeValueWei: item.value,
            successful: item.successful,
            explorerUrl
        };
    });
}

module.exports = { getNativeBalance, getTokenBalances, getRecentTransactions };
