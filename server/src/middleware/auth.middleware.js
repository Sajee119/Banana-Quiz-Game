const logger = require('../utils/logger');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.isActive !== false) {
        logger.debug(`Authenticated access to ${req.method} ${req.originalUrl} by user ${req.user.id}`);
        return next();
    }
    logger.debug(`Unauthenticated access to ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ success: false, message: 'Authentication required' });
}

function ensureGuest(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        logger.debug(`Authenticated user ${req.user.id} attempted to access guest-only route ${req.method} ${req.originalUrl}`);
        return res.status(403).json({ success: false, message: 'Already authenticated' });
    }
    next();
}

function ensureRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            logger.debug(`Unauthenticated access to ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role || 'user')) {
            logger.debug(`User ${req.user.id} with role ${req.user.role} attempted to access restricted route ${req.method} ${req.originalUrl}`);
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        logger.debug(`User ${req.user.id} with role ${req.user.role} accessed restricted route ${req.method} ${req.originalUrl}`);
        next();
    };
}

module.exports = {
    ensureAuthenticated,
    ensureGuest,
    ensureRole,
};