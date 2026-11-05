const LoginEvent = require('../models/LoginEvent');
const { parseUserAgent, getClientIp, hashSessionId } = require('../utils/userAgent');
const logger = require('../utils/logger');

const MAX_EVENTS_PER_USER = 50;
const MAX_EVENTS_PER_EMAIL = 20;

function maskIp(ip = '') {
    if (!ip) return 'Unknown';
    const value = String(ip).replace(/^::ffff:/i, '');
    if (value === '::1' || value === '127.0.0.1') return 'Localhost';
    if (value.includes('.')) {
        const parts = value.split('.');
        if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
        return value;
    }
    if (value.includes(':')) {
        const parts = value.split(':').filter(Boolean);
        if (parts.length === 0) return 'Unknown';
        return `${parts.slice(0, 3).join(':')}::`;
    }
    return value;
}

/**
 * Store a sign-in attempt. Never throws: login must still succeed if history
 * logging fails. Failed attempts for unknown emails are stored without a
 * `user`, so they cannot be linked to an account.
 */
async function recordLogin(
    req,
    { userId = null, email = '', method, success = true, reason = '' }
) {
    try {
        const userAgent = req?.headers?.['user-agent'] || '';
        const info = parseUserAgent(userAgent);
        const normalizedEmail = String(email || '').trim().toLowerCase();

        const event = await LoginEvent.create({
            user: userId || null,
            email: normalizedEmail,
            method,
            success,
            reason,
            ip: getClientIp(req),
            userAgent,
            browser: info.browser,
            os: info.os,
            deviceType: info.deviceType,
            sessionKey: hashSessionId(req?.sessionID),
        });

        // Keep the collection bounded per player (or per email for failures
        // that could not be linked to an account).
        const filter = userId ? { user: userId } : { email: normalizedEmail };
        const limit = userId ? MAX_EVENTS_PER_USER : MAX_EVENTS_PER_EMAIL;
        const stale = await LoginEvent.find(filter)
            .sort({ createdAt: -1 })
            .skip(limit)
            .select('_id')
            .lean();
        if (stale.length > 0) {
            await LoginEvent.deleteMany({ _id: { $in: stale.map((doc) => doc._id) } });
        }

        return event;
    } catch (err) {
        logger.warn(`Could not record login history: ${err.message}`);
        return null;
    }
}

async function getLoginHistory(userId, sessionId) {
    const currentKey = hashSessionId(sessionId);
    const events = await LoginEvent.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

    const history = events.map((event) => ({
        id: event._id,
        email: event.email || '',
        method: event.method,
        success: event.success !== false,
        reason: event.reason || '',
        browser: event.browser,
        os: event.os,
        deviceType: event.deviceType,
        device: `${event.browser} on ${event.os}`,
        ip: maskIp(event.ip),
        current: Boolean(currentKey) && event.sessionKey === currentKey,
        at: event.createdAt,
    }));

    // Devices only come from successful sign-ins; a failed attempt is not a
    // device that is currently signed in.
    const deviceMap = new Map();
    events
        .filter((event) => event.success !== false)
        .forEach((event) => {
            const key = `${event.browser}|${event.os}|${event.deviceType}`;
            const existing = deviceMap.get(key);
            const isCurrent = Boolean(currentKey) && event.sessionKey === currentKey;

            if (!existing) {
                deviceMap.set(key, {
                    id: key,
                    device: `${event.browser} on ${event.os}`,
                    browser: event.browser,
                    os: event.os,
                    deviceType: event.deviceType,
                    firstSeenAt: event.createdAt,
                    lastSeenAt: event.createdAt,
                    logins: 1,
                    current: isCurrent,
                });
            } else {
                existing.logins += 1;
                existing.current = existing.current || isCurrent;
                if (event.createdAt < existing.firstSeenAt) existing.firstSeenAt = event.createdAt;
                if (event.createdAt > existing.lastSeenAt) existing.lastSeenAt = event.createdAt;
            }
        });

    const successful = events.filter((event) => event.success !== false);
    const failed = events.filter((event) => event.success === false);

    return {
        history,
        devices: Array.from(deviceMap.values()).sort(
            (a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt)
        ),
        summary: {
            total: events.length,
            successful: successful.length,
            failed: failed.length,
            lastSuccessAt: successful[0]?.createdAt || null,
            lastFailedAt: failed[0]?.createdAt || null,
        },
    };
}

module.exports = {
    recordLogin,
    getLoginHistory,
    maskIp,
};
