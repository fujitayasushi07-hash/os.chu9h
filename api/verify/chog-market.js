/**
 * Vercel Serverless Function: /api/verify/chog-market
 * 
 * Phase 2C Verification: Query CoinGecko for CHOG market data
 * 
 * Accepts: GET (no parameters needed)
 * Returns: { success, source, token, market, timestamp }
 * 
 * This endpoint retrieves CHOG market data from CoinGecko for verification
 * before Phase 3 portfolio features. CoinGecko is used for market data;
 * GoldRush remains responsible for wallet/portfolio data.
 */

const CHOG_COINGECKO_ID = 'chog';
const CHOG_CONTRACT = '0x350035555e10d9afaf1566aaebfced5ba6c27777';
const MONAD_PLATFORM_ID = 'monad';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const endpoint = 'https://api.coingecko.com/api/v3/coins/' + CHOG_COINGECKO_ID + '?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('CoinGecko API error: ' + response.status);
        }

        const data = await response.json();

        // Validate that this is the correct CHOG token
        if (!data.platforms || !data.platforms[MONAD_PLATFORM_ID]) {
            throw new Error('CHOG not found on Monad platform');
        }

        const contractAddress = data.platforms[MONAD_PLATFORM_ID];
        if (contractAddress.toLowerCase() !== CHOG_CONTRACT.toLowerCase()) {
            throw new Error('Contract address mismatch: expected ' + CHOG_CONTRACT + ', got ' + contractAddress);
        }

        // Extract market data
        if (!data.market_data) {
            throw new Error('No market data available');
        }

        const marketData = data.market_data;
        const currentPrice = marketData.current_price && marketData.current_price.usd ? marketData.current_price.usd : 0;
        const marketCap = marketData.market_cap && marketData.market_cap.usd ? marketData.market_cap.usd : 0;
        const volume24h = marketData.total_volume && marketData.total_volume.usd ? marketData.total_volume.usd : 0;
        const change24h = marketData.price_change_percentage_24h ? marketData.price_change_percentage_24h : 0;

        return res.status(200).json({
            success: true,
            source: 'coingecko',
            token: {
                symbol: data.symbol ? data.symbol.toUpperCase() : 'CHOG',
                name: data.name || 'Chog',
                contract: CHOG_CONTRACT
            },
            market: {
                priceUsd: parseFloat(currentPrice.toFixed(8)),
                change24h: parseFloat(change24h.toFixed(2)),
                marketCapUsd: marketCap,
                volume24hUsd: volume24h
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('CHOG market verification error:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch CHOG market data',
            details: error.message
        });
    }
};
