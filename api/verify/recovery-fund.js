const CHAIN_ID = 143n;
const TOKEN_ADDRESS = '0x350035555e10d9afaf1566aaebfced5ba6c27777';
const RECIPIENT_ADDRESS = '0x48a22f7683a8541292e1eed3c68110cd7e4b39be';
const RPC_URL = 'https://rpc.monad.xyz';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/token_price/monad' +
    '?contract_addresses=' + TOKEN_ADDRESS +
    '&vs_currencies=usd&include_last_updated_at=true';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TRANSFER_SELECTOR = '0xa9059cbb';
const TOKEN_DECIMALS = 18n;
const MIN_USD_CENTS = 50;
const MAX_USD_CENTS = 61400;
const QUOTE_MAX_AGE_SECONDS = 600;
const QUOTE_FUTURE_TOLERANCE_SECONDS = 60;
const INTENT_LIFETIME_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const PUBLIC_SUMMARY_RPC = 'recovery_fund_public_summary';
const RECORD_DONATION_RPC = 'record_recovery_fund_donation';

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

function sendJson(res, statusCode, payload) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(statusCode).json(payload);
}

function getRequestUrl(req) {
    try {
        return new URL(req.url, 'https://localhost');
    } catch {
        throw new HttpError(400, 'Invalid request URL');
    }
}

function getSupabaseConfiguration() {
    const projectUrl = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!projectUrl || !secretKey) {
        throw new HttpError(503, 'Recovery Fund service is not configured');
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(projectUrl);
    } catch {
        throw new HttpError(503, 'Recovery Fund service is not configured');
    }

    if (parsedUrl.protocol !== 'https:' ||
        parsedUrl.username || parsedUrl.password ||
        parsedUrl.search || parsedUrl.hash ||
        (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '')) {
        throw new HttpError(503, 'Recovery Fund service is not configured');
    }

    return {
        projectUrl: projectUrl.replace(/\/+$/, ''),
        secretKey
    };
}

async function fetchJson(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let response;
        try {
            response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } catch {
            throw new Error(controller.signal.aborted
                ? 'Upstream request timed out'
                : 'Unable to reach upstream service');
        }

        if (!response.ok) {
            throw new Error('Upstream service returned an unsuccessful response');
        }

        let responseText;
        try {
            responseText = await response.text();
        } catch {
            throw new Error('Upstream service returned invalid JSON');
        }
        if (!responseText) return null;

        try {
            return JSON.parse(responseText);
        } catch {
            throw new Error('Upstream service returned invalid JSON');
        }
    } finally {
        clearTimeout(timeout);
    }
}

function getSupabaseHeaders(configuration, extra = {}) {
    return {
        apikey: configuration.secretKey,
        Accept: 'application/json',
        ...extra
    };
}

async function supabaseRequest(configuration, path, options = {}) {
    return fetchJson(configuration.projectUrl + '/rest/v1/' + path, {
        ...options,
        headers: getSupabaseHeaders(configuration, options.headers || {})
    });
}

let rpcRequestId = 0;

async function rpcCall(method, params) {
    const response = await fetchJson(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: ++rpcRequestId,
            method,
            params
        })
    });

    if (!response || response.error ||
        !Object.prototype.hasOwnProperty.call(response, 'result')) {
        throw new Error('Monad RPC request failed');
    }
    return response.result;
}

function parseQuantity(value) {
    if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
        throw new Error('Monad RPC returned an invalid quantity');
    }
    return BigInt(value);
}

function toRpcQuantity(value) {
    return '0x' + value.toString(16);
}

function parseAddress(value, fieldName) {
    if (typeof value !== 'string' || !/^0x[0-9a-f]{40}$/i.test(value)) {
        throw new HttpError(400, `Invalid ${fieldName}`);
    }
    return value.toLowerCase();
}

function parseUsdCents(value) {
    if (!Number.isSafeInteger(value) ||
        value < MIN_USD_CENTS ||
        value > MAX_USD_CENTS) {
        throw new HttpError(
            400,
            'Donation amount must be between $0.50 and $614.00 in cents'
        );
    }
    return value;
}

function parseDecimalFraction(value) {
    const text = String(value);
    const match = text.match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
    if (!match) {
        throw new Error('Price source returned an invalid price');
    }

    const fraction = match[2] || '';
    const exponent = Number(match[3] || 0);
    if (!Number.isInteger(exponent) || Math.abs(exponent) > 100) {
        throw new Error('Price source returned an invalid price');
    }

    let numerator = BigInt(match[1] + fraction);
    let scale = fraction.length - exponent;
    let denominator = 1n;
    if (scale > 0) denominator = 10n ** BigInt(scale);
    else if (scale < 0) numerator *= 10n ** BigInt(-scale);

    if (numerator <= 0n) {
        throw new Error('Price source returned a non-positive price');
    }
    return { numerator, denominator };
}

function calculateAmountRaw(usdCents, priceUsd) {
    const { numerator, denominator } = parseDecimalFraction(priceUsd);
    const usdNumerator = BigInt(usdCents) * 10n ** 16n * denominator;
    const amountRaw = (usdNumerator + numerator - 1n) / numerator;
    if (amountRaw <= 0n || amountRaw.toString().length > 78) {
        throw new Error('Unable to calculate a valid CHOG amount');
    }
    return amountRaw.toString();
}

function formatChogAmount(amountRaw) {
    const raw = BigInt(amountRaw);
    const whole = raw / 10n ** TOKEN_DECIMALS;
    const fraction = (raw % 10n ** TOKEN_DECIMALS)
        .toString()
        .padStart(Number(TOKEN_DECIMALS), '0')
        .replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole.toString();
}

async function getPriceQuote() {
    const data = await fetchJson(COINGECKO_URL, {
        headers: { Accept: 'application/json' }
    });
    const token = data && data[TOKEN_ADDRESS];
    if (!token ||
        typeof token.usd !== 'number' ||
        !Number.isFinite(token.usd) ||
        token.usd <= 0 ||
        !Number.isSafeInteger(token.last_updated_at)) {
        throw new HttpError(503, 'A valid CHOG price quote is unavailable');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = nowSeconds - token.last_updated_at;
    if (ageSeconds > QUOTE_MAX_AGE_SECONDS ||
        ageSeconds < -QUOTE_FUTURE_TOLERANCE_SECONDS) {
        throw new HttpError(503, 'A recent CHOG price quote is unavailable');
    }

    return {
        priceUsd: String(token.usd),
        timestamp: new Date(token.last_updated_at * 1000).toISOString(),
        source: 'CoinGecko'
    };
}

async function verifyTokenConfiguration() {
    const [chainId, code, decimalsResult] = await Promise.all([
        rpcCall('eth_chainId', []),
        rpcCall('eth_getCode', [TOKEN_ADDRESS, 'finalized']),
        rpcCall('eth_call', [
            { to: TOKEN_ADDRESS, data: '0x313ce567' },
            'finalized'
        ])
    ]);

    if (parseQuantity(chainId) !== CHAIN_ID) {
        throw new Error('Monad RPC returned an unexpected chain ID');
    }
    if (typeof code !== 'string' ||
        !/^0x[0-9a-f]+$/i.test(code) ||
        code === '0x') {
        throw new Error('CHOG contract has no finalized code');
    }
    if (typeof decimalsResult !== 'string' ||
        !/^0x[0-9a-f]{64}$/i.test(decimalsResult) ||
        BigInt(decimalsResult) !== TOKEN_DECIMALS) {
        throw new Error('CHOG contract decimals verification failed');
    }
}

async function handleQuote(res) {
    const [quote] = await Promise.all([
        getPriceQuote(),
        verifyTokenConfiguration()
    ]);
    return sendJson(res, 200, { success: true, quote });
}

async function handleCreateIntent(payload, res) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new HttpError(400, 'Request body must be a JSON object');
    }

    const wallet = parseAddress(payload.wallet, 'wallet address');
    const usdAmountCents = parseUsdCents(payload.usdAmountCents);
    const configuration = getSupabaseConfiguration();
    const [quote] = await Promise.all([
        getPriceQuote(),
        verifyTokenConfiguration()
    ]);
    const amountRaw = calculateAmountRaw(usdAmountCents, quote.priceUsd);
    const now = Date.now();
    const expiresAt = new Date(now + INTENT_LIFETIME_MS).toISOString();
    const expiredIntents = new URLSearchParams({
        expires_at: 'lt.' + new Date(now).toISOString(),
        consumed_at: 'is.null'
    });
    await supabaseRequest(
        configuration,
        'recovery_fund_donation_intents?' + expiredIntents.toString(),
        { method: 'DELETE' }
    );
    const query = new URLSearchParams({
        select: 'id,wallet,amount_raw,usd_amount_cents,quote_price_usd,quote_timestamp,created_at,expires_at'
    });
    const rows = await supabaseRequest(
        configuration,
        'recovery_fund_donation_intents?' + query.toString(),
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            },
            body: JSON.stringify({
                wallet,
                usd_amount_cents: usdAmountCents,
                amount_raw: amountRaw,
                quote_price_usd: quote.priceUsd,
                quote_timestamp: quote.timestamp,
                expires_at: expiresAt
            })
        }
    );

    if (!Array.isArray(rows) || rows.length !== 1 ||
        !rows[0] || typeof rows[0].id !== 'string') {
        throw new Error('Supabase returned an invalid donation intent');
    }

    return sendJson(res, 201, {
        success: true,
        intent: {
            id: rows[0].id,
            wallet,
            usdAmountCents,
            amountRaw,
            amountChog: formatChogAmount(amountRaw),
            quotePriceUsd: quote.priceUsd,
            quoteTimestamp: quote.timestamp,
            expiresAt: rows[0].expires_at
        }
    });
}

function isAddressTopic(value, address) {
    return typeof value === 'string' &&
        /^0x[0-9a-f]{64}$/i.test(value) &&
        value.slice(2, 26) === '0'.repeat(24) &&
        value.slice(-40).toLowerCase() === address.slice(2);
}

function findMatchingTransfer(receipt, txHash, sender, amountRaw) {
    if (!Array.isArray(receipt.logs)) {
        throw new Error('Monad RPC returned an invalid transaction receipt');
    }

    const matches = receipt.logs.filter(log =>
        log &&
        typeof log.address === 'string' &&
        log.address.toLowerCase() === TOKEN_ADDRESS &&
        Array.isArray(log.topics) &&
        log.topics.length === 3 &&
        typeof log.topics[0] === 'string' &&
        log.topics[0].toLowerCase() === TRANSFER_TOPIC &&
        isAddressTopic(log.topics[1], sender) &&
        isAddressTopic(log.topics[2], RECIPIENT_ADDRESS) &&
        typeof log.data === 'string' &&
        /^0x[0-9a-f]{64}$/i.test(log.data) &&
        BigInt(log.data).toString() === amountRaw &&
        typeof log.transactionHash === 'string' &&
        log.transactionHash.toLowerCase() === txHash
    );

    if (matches.length !== 1) {
        throw new HttpError(400, 'Transaction does not contain the expected CHOG transfer');
    }
    const logIndex = parseQuantity(matches[0].logIndex);
    if (logIndex > 2147483647n) {
        throw new Error('Monad RPC returned an invalid log index');
    }
    return Number(logIndex);
}

function validateTransferCalldata(input, amountRaw) {
    if (typeof input !== 'string' ||
        !/^0xa9059cbb[0-9a-f]{128}$/i.test(input)) {
        throw new HttpError(400, 'Transaction is not a direct CHOG transfer');
    }

    const recipientWord = input.slice(10, 74).toLowerCase();
    const amountWord = input.slice(74).toLowerCase();
    const expectedRecipientWord = RECIPIENT_ADDRESS.slice(2).padStart(64, '0');
    if (recipientWord !== expectedRecipientWord ||
        BigInt('0x' + amountWord).toString() !== amountRaw) {
        throw new HttpError(400, 'Transaction recipient or amount does not match the donation');
    }
}

async function handleConfirm(payload, res) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        typeof payload.intentId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.intentId) ||
        typeof payload.transactionHash !== 'string' ||
        !/^0x[0-9a-f]{64}$/i.test(payload.transactionHash)) {
        throw new HttpError(400, 'A valid donation intent and transaction hash are required');
    }

    const configuration = getSupabaseConfiguration();
    const intentRows = await supabaseRequest(
        configuration,
        'recovery_fund_donation_intents?id=eq.' +
            encodeURIComponent(payload.intentId) +
            '&select=id,wallet,amount_raw,usd_amount_cents,expires_at,consumed_at',
        { method: 'GET' }
    );
    if (!Array.isArray(intentRows) || intentRows.length !== 1 || !intentRows[0]) {
        throw new HttpError(404, 'Donation intent was not found');
    }
    const intent = intentRows[0];
    const txHash = payload.transactionHash.toLowerCase();

    await verifyTokenConfiguration();
    const [transaction, receipt, finalizedBlock] = await Promise.all([
        rpcCall('eth_getTransactionByHash', [txHash]),
        rpcCall('eth_getTransactionReceipt', [txHash]),
        rpcCall('eth_getBlockByNumber', ['finalized', false])
    ]);

    if (!transaction || !receipt) {
        return sendJson(res, 202, {
            success: true,
            pending: true,
            message: 'Waiting for the transaction to be included on Monad'
        });
    }
    if (typeof transaction.hash !== 'string' ||
        transaction.hash.toLowerCase() !== txHash ||
        typeof transaction.chainId !== 'string' ||
        parseQuantity(transaction.chainId) !== CHAIN_ID ||
        typeof transaction.from !== 'string' ||
        transaction.from.toLowerCase() !== intent.wallet ||
        typeof transaction.to !== 'string' ||
        transaction.to.toLowerCase() !== TOKEN_ADDRESS) {
        throw new HttpError(400, 'Transaction does not match this donation intent');
    }
    validateTransferCalldata(
        transaction.input || transaction.data,
        intent.amount_raw
    );

    if (typeof receipt.status !== 'string' ||
        receipt.status.toLowerCase() !== '0x1') {
        throw new HttpError(400, 'Donation transaction did not succeed');
    }

    const receiptBlock = parseQuantity(receipt.blockNumber);
    const finalizedNumber = parseQuantity(finalizedBlock.number);
    if (receiptBlock > finalizedNumber) {
        return sendJson(res, 202, {
            success: true,
            pending: true,
            message: 'Transaction confirmed; waiting for Monad finality'
        });
    }

    const [block] = await Promise.all([
        rpcCall('eth_getBlockByNumber', [toRpcQuantity(receiptBlock), false])
    ]);
    if (!block ||
        typeof block.hash !== 'string' ||
        block.hash.toLowerCase() !== receipt.blockHash.toLowerCase() ||
        typeof block.timestamp !== 'string' ||
        receipt.transactionHash.toLowerCase() !== txHash) {
        throw new Error('Monad RPC receipt is not in the canonical block');
    }

    const logIndex = findMatchingTransfer(
        receipt,
        txHash,
        intent.wallet,
        intent.amount_raw
    );
    const blockTimestamp = new Date(
        Number(parseQuantity(block.timestamp)) * 1000
    ).toISOString();
    const recordResult = await supabaseRequest(
        configuration,
        'rpc/' + RECORD_DONATION_RPC,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                p_intent_id: intent.id,
                p_tx_hash: txHash,
                p_log_index: logIndex,
                p_sender: intent.wallet,
                p_amount_raw: intent.amount_raw,
                p_block_number: receiptBlock.toString(),
                p_block_hash: receipt.blockHash.toLowerCase(),
                p_block_timestamp: blockTimestamp
            })
        }
    );

    if (!recordResult || recordResult.recorded !== true) {
        throw new Error('Supabase did not confirm donation recording');
    }

    return sendJson(res, 200, {
        success: true,
        pending: false,
        duplicate: recordResult.duplicate === true,
        message: 'Verified donation recorded'
    });
}

function validatePublicSummary(summary) {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary) ||
        typeof summary.totalAmountRaw !== 'string' ||
        !/^\d+$/.test(summary.totalAmountRaw) ||
        typeof summary.totalUsdCents !== 'string' ||
        !/^\d+$/.test(summary.totalUsdCents) ||
        typeof summary.contributionCount !== 'string' ||
        !/^\d+$/.test(summary.contributionCount) ||
        !Array.isArray(summary.recentContributions)) {
        throw new Error('Recovery Fund summary has an invalid shape');
    }

    const recentContributions = summary.recentContributions.map(item => {
        if (!item || typeof item !== 'object' ||
            typeof item.wallet !== 'string' ||
            !/^0x[0-9a-f]{40}$/.test(item.wallet) ||
            typeof item.amountRaw !== 'string' ||
            !/^[1-9][0-9]{0,77}$/.test(item.amountRaw) ||
            !Number.isInteger(item.usdAmountCents) ||
            item.usdAmountCents < MIN_USD_CENTS ||
            item.usdAmountCents > MAX_USD_CENTS ||
            typeof item.timestamp !== 'string' ||
            Number.isNaN(Date.parse(item.timestamp)) ||
            typeof item.transactionHash !== 'string' ||
            !/^0x[0-9a-f]{64}$/.test(item.transactionHash)) {
            throw new Error('Recovery Fund summary contains an invalid contribution');
        }
        return {
            wallet: item.wallet,
            amountRaw: item.amountRaw,
            usdAmountCents: item.usdAmountCents,
            timestamp: item.timestamp,
            transactionHash: item.transactionHash
        };
    });

    return {
        totalAmountRaw: summary.totalAmountRaw,
        totalUsdCents: summary.totalUsdCents,
        contributionCount: summary.contributionCount,
        recentContributions
    };
}

async function handleSummary(res) {
    const configuration = getSupabaseConfiguration();
    const result = await supabaseRequest(
        configuration,
        'rpc/' + PUBLIC_SUMMARY_RPC,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        }
    );
    return sendJson(res, 200, {
        success: true,
        donations: validatePublicSummary(result)
    });
}

async function readRequestBody(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'object' && !Array.isArray(req.body)) {
            return req.body;
        }
        if (typeof req.body === 'string') {
            try {
                return JSON.parse(req.body);
            } catch {
                throw new HttpError(400, 'Malformed JSON request body');
            }
        }
    }
    throw new HttpError(400, 'Request body must be a JSON object');
}

module.exports = async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return sendJson(res, 405, {
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const url = getRequestUrl(req);
        if (req.method === 'GET') {
            const action = url.searchParams.get('action') || 'summary';
            if ([...url.searchParams.keys()].some(key => key !== 'action') ||
                url.searchParams.getAll('action').length > 1) {
                throw new HttpError(400, 'Invalid query parameters');
            }
            if (action === 'quote') return await handleQuote(res);
            if (action === 'summary') return await handleSummary(res);
            throw new HttpError(400, 'Unsupported Recovery Fund request');
        }

        if (url.search) {
            throw new HttpError(400, 'Query parameters are not accepted for POST');
        }
        const contentType = req.headers['content-type'];
        if (typeof contentType !== 'string' ||
            contentType.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
            throw new HttpError(415, 'Content-Type must be application/json');
        }

        const payload = await readRequestBody(req);
        if (payload.action === 'create-intent') {
            return await handleCreateIntent(payload, res);
        }
        if (payload.action === 'confirm') {
            return await handleConfirm(payload, res);
        }
        throw new HttpError(400, 'Unsupported Recovery Fund request');
    } catch (error) {
        if (error instanceof HttpError) {
            return sendJson(res, error.statusCode, {
                success: false,
                error: error.message
            });
        }

        console.error('Recovery Fund API error:', error.message);
        return sendJson(res, 502, {
            success: false,
            error: 'Recovery Fund service is unavailable'
        });
    }
};
