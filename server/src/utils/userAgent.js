const crypto = require('crypto');

/**
 * Very small user-agent parser. We only need a friendly browser/OS label and
 * a coarse device type for the login-history screen, so a full UA library
 * would be overkill.
 */
function parseUserAgent(userAgent = '') {
    const ua = String(userAgent || '');

    let browser = 'Unknown browser';
    if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua)) browser = 'Safari';
    else if (/curl\//i.test(ua)) browser = 'curl';
    else if (/PostmanRuntime/i.test(ua)) browser = 'Postman';

    let os = 'Unknown OS';
    if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
    else if (/CrOS/i.test(ua)) os = 'ChromeOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let deviceType = 'desktop';
    if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';
    else if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) deviceType = 'mobile';
    else if (!ua) deviceType = 'unknown';

    return {
        browser,
        os,
        deviceType,
        label: `${browser} on ${os}`,
    };
}

function getClientIp(req) {
    if (!req) return '';
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '';
}

function hashSessionId(sessionId) {
    if (!sessionId) return '';
    return crypto.createHash('sha256').update(String(sessionId)).digest('hex');
}

module.exports = {
    parseUserAgent,
    getClientIp,
    hashSessionId,
};
