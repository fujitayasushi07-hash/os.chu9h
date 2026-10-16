const crypto = require('crypto');
const net = require('net');

const MAX_BODY_BYTES = 8192;
const SUPABASE_RPC_NAME = 'submit_messenger_message';

class RequestError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

function sendJson(res, statusCode, payload, headers = {}) {
    res.setHeader('Cache-Control', 'no-store');
    for (const [name, value] of Object.entries(headers)) {
        res.setHeader(name, value);
    }
    return res.status(statusCode).json(payload);
}

async function readJsonBody(req) {
    const contentLength = req.headers['content-length'];
    if (contentLength !== undefined) {
        if (!/^\d+$/.test(contentLength)) {
            throw new RequestError(400, 'Invalid Content-Length');
        }
        if (Number(contentLength) > MAX_BODY_BYTES) {
            throw new RequestError(413, 'Request body is too large');
        }
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_BODY_BYTES) {
            throw new RequestError(413, 'Request body is too large');
        }
        chunks.push(buffer);
    }

    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    } catch {
        throw new RequestError(400, 'Request body must be valid UTF-8 JSON');
    }

    try {
        return JSON.parse(text);
    } catch {
        throw new RequestError(400, 'Malformed JSON request body');
    }
}

function canonicalClientIp(req) {
    if (typeof req.headers['x-vercel-id'] !== 'string' ||
        !req.headers['x-vercel-id'].trim()) {
        return null;
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor !== 'string') return null;

    const address = forwardedFor.trim();
    const version = net.isIP(address);
    if (!version) return null;

    try {
        const parsed = new URL(version === 6 ? `http://[${address}]/` : `http://${address}/`);
        return version === 6
            ? parsed.hostname.slice(1, -1).toLowerCase()
            : parsed.hostname;
    } catch {
        return null;
    }
}

function logConfigFailure(reasonCode) {
    console.error('messenger config check failed: ' + reasonCode);
}

function getConfiguration() {
    const projectUrl = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    const hmacKey = process.env.CHAT_RATE_LIMIT_HMAC_KEY;

    if (!projectUrl) {
        logConfigFailure('MISSING_URL');
        return null;
    }
    if (!secretKey) {
        logConfigFailure('MISSING_SECRET');
        return null;
    }
    if (!hmacKey) {
        logConfigFailure('MISSING_HMAC_KEY');
        return null;
    }
    if (Buffer.byteLength(hmacKey, 'utf8') < 32) {
        logConfigFailure('HMAC_TOO_SHORT');
        return null;
    }

    try {
        const parsedUrl = new URL(projectUrl);
        if (parsedUrl.protocol !== 'https:') {
            logConfigFailure('URL_NOT_HTTPS');
            return null;
        }
        if (parsedUrl.username || parsedUrl.password ||
            parsedUrl.search || parsedUrl.hash) {
            logConfigFailure('URL_HAS_CREDENTIALS_QUERY_OR_HASH');
            return null;
        }
        if (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') {
            logConfigFailure('URL_HAS_PATH');
            return null;
        }
    } catch {
        logConfigFailure('INVALID_URL_FORMAT');
        return null;
    }

    return {
        projectUrl: projectUrl.replace(/\/+$/, ''),
        secretKey,
        hmacKey
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return sendJson(
            res,
            405,
            { success: false, error: 'Method not allowed' },
            { Allow: 'POST' }
        );
    }

    const contentType = req.headers['content-type'];
    if (typeof contentType !== 'string' ||
        contentType.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
        return sendJson(res, 415, {
            success: false,
            error: 'Content-Type must be application/json'
        });
    }

    let payload;
    try {
        payload = await readJsonBody(req);
    } catch (error) {
        if (error instanceof RequestError) {
            return sendJson(res, error.statusCode, {
                success: false,
                error: error.message
            });
        }
        return sendJson(res, 400, {
            success: false,
            error: 'Unable to read request body'
        });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return sendJson(res, 400, {
            success: false,
            error: 'Request body must be a JSON object'
        });
    }

    if (typeof payload.display_name !== 'string' ||
        typeof payload.body !== 'string') {
        return sendJson(res, 400, {
            success: false,
            error: 'Display name and message are required'
        });
    }

    const displayName = payload.display_name.trim();
    const messageBody = payload.body.trim();
    if (Array.from(displayName).length < 1 || Array.from(displayName).length > 24) {
        return sendJson(res, 400, {
            success: false,
            error: 'Display name must be 1 to 24 characters'
        });
    }
    if (Array.from(messageBody).length < 1 || Array.from(messageBody).length > 500) {
        return sendJson(res, 400, {
            success: false,
            error: 'Message must be 1 to 500 characters'
        });
    }

    const clientIp = canonicalClientIp(req);
    if (!clientIp) {
        return sendJson(res, 503, {
            success: false,
            error: 'Unable to determine trusted client address'
        });
    }

    const configuration = getConfiguration();
    if (!configuration) {
        return sendJson(res, 503, {
            success: false,
            error: 'Message service is not configured'
        });
    }

    const clientDigest = crypto
        .createHmac('sha256', configuration.hmacKey)
        .update(clientIp)
        .digest('hex');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        let response;
        try {
            response = await fetch(
                `${configuration.projectUrl}/rest/v1/rpc/${SUPABASE_RPC_NAME}`,
                {
                    method: 'POST',
                    headers: {
                        apikey: configuration.secretKey,
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({
                        p_client_digest: clientDigest,
                        p_display_name: displayName,
                        p_body: messageBody
                    }),
                    signal: controller.signal
                }
            );
        } catch {
            return sendJson(res, controller.signal.aborted ? 504 : 502, {
                success: false,
                error: controller.signal.aborted
                    ? 'Message service timed out'
                    : 'Unable to reach message service'
            });
        }

        if (!response.ok) {
            return sendJson(res, 503, {
                success: false,
                error: 'Message service is unavailable'
            });
        }

        let result;
        try {
            result = await response.json();
        } catch {
            if (controller.signal.aborted) {
                return sendJson(res, 504, {
                    success: false,
                    error: 'Message service timed out'
                });
            }
            return sendJson(res, 502, {
                success: false,
                error: 'Message service returned an invalid response'
            });
        }

        if (!Array.isArray(result) || result.length !== 1 ||
            !result[0] || typeof result[0] !== 'object' || Array.isArray(result[0]) ||
            typeof result[0].accepted !== 'boolean') {
            return sendJson(res, 502, {
                success: false,
                error: 'Message service returned an invalid response'
            });
        }

        if (!result[0].accepted) {
            const retryAfter = Number(result[0].retry_after_seconds);
            if (!Number.isInteger(retryAfter) || retryAfter < 1 || retryAfter > 60) {
                return sendJson(res, 502, {
                    success: false,
                    error: 'Message service returned an invalid response'
                });
            }
            return sendJson(
                res,
                429,
                { success: false, error: 'Message rate limit exceeded' },
                { 'Retry-After': String(retryAfter) }
            );
        }

        if (!result[0].message ||
            typeof result[0].message !== 'object' ||
            Array.isArray(result[0].message)) {
            return sendJson(res, 502, {
                success: false,
                error: 'Message service returned an invalid response'
            });
        }

        return sendJson(res, 201, {
            success: true,
            message: result[0].message
        });
    } finally {
        clearTimeout(timeout);
    }
};

module.exports.config = {
    api: {
        bodyParser: false
    }
};
