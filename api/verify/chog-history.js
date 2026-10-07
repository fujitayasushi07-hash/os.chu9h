/**
 * Vercel Serverless Function: /api/verify/chog-history
 * 
 * Phase 3: Retrieve CHOG historical price data from CoinGecko
 * 
 * Accepts: GET ?days=30 (default 90)
 * Returns: { success, source, token, history, timestamp }
 * 
 * This endpoint retrieves OHLC (Open, High, Low, Close) historical price data
 * from CoinGecko for the CHOG token on Monad. Used by Phase 3 for charting.
 */

const CHOG_COINGECKO_ID = 'chog';
const CHOG_CONTRACT = '0x350035555e10d9afaf1566aaebfced5ba6c27777';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get days parameter from query (default 90)
        let days = 90;
        if (req.query.days) {
            const requestedDays = parseInt(req.query.days);
            if (!isNaN(requestedDays) && requestedDays > 0 && requestedDays <= 365) {
                days = requestedDays;
            }
        }

        const endpoint = 'https://api.coingecko.com/api/v3/coins/' + CHOG_COINGECKO_ID + '/ohlc?vs_currency=usd&days=' + days;
        
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

        // CoinGecko returns array of [timestamp_ms, open, high, low, close]
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format from CoinGecko');
        }

        // Normalize response for frontend
        const history = data.map(item => ({
            timestamp: item[0],
            open: parseFloat(item[1].toFixed(8)),
            high: parseFloat(item[2].toFixed(8)),
            low: parseFloat(item[3].toFixed(8)),
            close: parseFloat(item[4].toFixed(8))
        }));

        return res.status(200).json({
            success: true,
            source: 'coingecko',
            token: {
                symbol: 'CHOG',
                name: 'Chog',
                contract: CHOG_CONTRACT
            },
            days: days,
            history: history,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('CHOG history error:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Failed to fetch CHOG historical data',
            details: error.message
        });
    }
};
