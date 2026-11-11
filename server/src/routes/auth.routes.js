const crypto = require('crypto');
const router = require('express').Router();
const passport = require('passport');
const env = require('../config/env');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const asyncHandler = require('../utils/asyncHandler');
const { recordLogin } = require('../services/loginHistory.service');
const {
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    sendWelcomeEmail,
    sendLoginConfirmationEmail,
} = require('../services/mail.service');
const { evaluatePassword } = require('../utils/passwordPolicy');
const { getClientIp, parseUserAgent } = require('../utils/userAgent');
const logger = require('../utils/logger');
<<<<<<< Updated upstream
const { ensureGuest } = require('../middleware/auth.middleware');
=======
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth.middleware');

const PENDING_PASSWORD_ROUNDS = 12;
const REMEMBER_MAX_AGE_MS = env.SESSION_REMEMBER_DAYS * 24 * 60 * 60 * 1000;
const OAUTH_REMEMBER_COOKIE = 'bq_oauth_remember';
>>>>>>> Stashed changes

const authOptions = {
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
    failureMessage: true,
};

// Where the player lands after a successful sign-in.
const successRedirect = `${env.CLIENT_URL}/dashboard`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
    if (typeof email !== 'string' || !email.trim()) return 'Email is required.';
    const value = email.trim();
    if (value.length > 254 || !EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
    return null;
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function applySessionLifetime(req, remember) {
    if (!req.session?.cookie) return;
    // A checked "Remember me" turns the session cookie into a persistent
    // one. Without it, the cookie is dropped when the browser closes.
    req.session.cookie.maxAge = remember ? REMEMBER_MAX_AGE_MS : null;
}

function loginUser(req, user, remember = false) {
    return new Promise((resolve, reject) => {
        req.login(user, (err) => {
            if (err) return reject(err);
            // Sessions carry the account's auth version so a password change
            // or "sign out other devices" can revoke them server-side.
            req.session.authVersion = user.authVersion || 0;
            applySessionLifetime(req, remember);
            resolve();
        });
    });
}

function wantsRememberMe(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

function readRequestCookie(req, name) {
    const header = req.headers?.cookie;
    if (!header) return null;

    for (const part of header.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return decodeURIComponent(rest.join('='));
    }
    return null;
}

// OAuth redirects leave the app, so the remember choice is parked in a
// short-lived, HTTP-only cookie and applied when the provider calls back.
function rememberOAuthChoice(req, res, next) {
    res.cookie(OAUTH_REMEMBER_COOKIE, wantsRememberMe(req.query.remember) ? '1' : '0', {
        httpOnly: true,
        sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
        secure: env.COOKIE_SECURE,
        maxAge: 10 * 60 * 1000,
        path: '/auth',
    });
    next();
}

function syncSessionVersion(req) {
    if (req.session && req.user) {
        req.session.authVersion = req.user.authVersion || 0;
    }
}

function notifySuccessfulLogin(req, user, method) {
    const device = parseUserAgent(req.headers?.['user-agent']);
    return sendLoginConfirmationEmail({
        to: user.email,
        name: user.displayName,
        loginAt: new Date(),
        ipAddress: getClientIp(req),
        device: device.label,
        method,
        dashboardUrl: successRedirect,
    }).catch((err) => {
        logger.warn(`Could not send login confirmation for ${user.email}: ${err.message}`);
    });
}

function notifyWelcome(user, provider) {
    return sendWelcomeEmail({
        to: user.email,
        name: user.displayName,
        createdAt: user.createdAt,
        provider,
        loginUrl: `${env.CLIENT_URL.replace(/\/$/, '')}/login`,
    }).catch((err) => {
        logger.warn(`Could not send welcome email for ${user.email}: ${err.message}`);
    });
}

// email + password signup
router.post('/register', asyncHandler(async (req, res) => {
    const { name = '', email = '', password = '' } = req.body || {};
    const displayName = typeof name === 'string' ? name.trim() : '';

    if (displayName.length < 2) {
        return res.status(400).json({ success: false, message: 'Please enter your name (at least 2 characters).' });
    }
    if (displayName.length > 60) {
        return res.status(400).json({ success: false, message: 'Name must be 60 characters or fewer.' });
    }

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const normalizedEmail = normalizeEmail(email);
    const policy = evaluatePassword(password, { email: normalizedEmail, name: displayName });
    if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.message });
    }

    const existing = await User.exists({ email: normalizedEmail });
    if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Try signing in.' });
    }

    const user = await User.registerLocal({ name: displayName, email: normalizedEmail, password });
    await loginUser(req, user);
    await recordLogin(req, {
        userId: user.id,
        email: user.email,
        method: 'register',
        success: true,
    });
    void notifyWelcome(user, 'email');
    void notifySuccessfulLogin(req, user, 'password');

    return res.status(201).json({ success: true, user });
}));

// email + password login
router.post('/login', asyncHandler(async (req, res) => {
    const { email = '', password = '', remember = false } = req.body || {};

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });
    if (typeof password !== 'string' || !password) {
        return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findByEmailWithPassword(normalizedEmail);

    if (!user) {
        await recordLogin(req, {
            email: normalizedEmail,
            method: 'password',
            success: false,
            reason: 'unknown_email',
        });
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.passwordHash) {
        await recordLogin(req, {
            userId: user.id,
            email: user.email,
            method: 'password',
            success: false,
            reason: 'social_only',
        });
        return res.status(409).json({
            success: false,
            message: 'This account uses social sign-in. Continue with Google or Facebook.',
        });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
        await recordLogin(req, {
            userId: user.id,
            email: user.email,
            method: 'password',
            success: false,
            reason: 'wrong_password',
        });
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date();
    await user.save();
    await loginUser(req, user, wantsRememberMe(remember));
    await recordLogin(req, {
        userId: user.id,
        email: user.email,
        method: 'password',
        success: true,
    });
    void notifySuccessfulLogin(req, user, 'password');

    return res.json({ success: true, user });
}));

/**
 * Request a password reset link. The response is always the same so an
 * attacker cannot use this endpoint to discover which emails have accounts.
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email = '' } = req.body || {};
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ success: false, message: emailError });

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail, isActive: true });

    let devResetUrl = null;

    if (user) {
        const ttlMinutes = env.PASSWORD_RESET_TTL_MINUTES;
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        // Only the newest link should work.
        await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });
        await PasswordResetToken.create({
            user: user._id,
            tokenHash: hashToken(token),
            expiresAt,
            requestedIp: getClientIp(req),
            userAgent: req.headers?.['user-agent'] || '',
        });

        const resetUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${token}`;
        const delivery = await sendPasswordResetEmail({
            to: user.email,
            name: user.displayName,
            resetUrl,
            expiresInMinutes: ttlMinutes,
        });

        if (!delivery.sent) {
            if (env.NODE_ENV !== 'production') {
                // Local development has no SMTP provider by default, so make
                // the flow usable without leaking the token in production.
                logger.warn(`Password reset link for ${user.email}: ${resetUrl}`);
            } else {
                logger.warn(`Password reset email could not be delivered for ${user.email}`);
            }
        }

        if (env.NODE_ENV !== 'production') devResetUrl = resetUrl;
    }

    res.json({
        success: true,
        message:
            'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.',
        ...(devResetUrl ? { devResetUrl } : {}),
    });
}));

// Let the reset page show a friendly error before the player types a password.
router.get('/reset-password/validate', asyncHandler(async (req, res) => {
    const token = req.query.token;
    if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) {
        return res.status(400).json({
            success: false,
            valid: false,
            message: 'This reset link is invalid or has expired.',
        });
    }

    const record = await PasswordResetToken.findOne({
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { $gt: new Date() },
    }).lean();

    if (!record) {
        return res.status(400).json({
            success: false,
            valid: false,
            message: 'This reset link is invalid or has expired.',
        });
    }

    res.json({ success: true, valid: true, expiresAt: record.expiresAt });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token = '', password = '' } = req.body || {};

    if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) {
        return res.status(400).json({
            success: false,
            message: 'This reset link is invalid or has expired.',
        });
    }

    const record = await PasswordResetToken.findOne({
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { $gt: new Date() },
    });

    if (!record) {
        return res.status(400).json({
            success: false,
            message: 'This reset link is invalid or has expired.',
        });
    }

    const user = await User.findById(record.user).select('+passwordHash');
    if (!user || user.isActive === false) {
        await PasswordResetToken.deleteMany({ user: record.user });
        return res.status(400).json({
            success: false,
            message: 'This reset link is invalid or has expired.',
        });
    }

    const policy = evaluatePassword(password, {
        email: user.email,
        name: user.displayName,
    });
    if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.message });
    }

    await user.setPassword(password);
    if (!user.providers.some((provider) => provider.name === 'local')) {
        user.providers.push({ name: 'local', providerId: user.email });
    }
    // Invalidate every existing session for this account.
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();

    record.usedAt = new Date();
    await record.save();
    await PasswordResetToken.deleteMany({ user: user._id, _id: { $ne: record._id } });

    // The notification is best-effort: the password is already changed, so a
    // slow or failed mail server must not delay the response.
    sendPasswordChangedEmail({
        to: user.email,
        name: user.displayName,
        changedAt: user.passwordChangedAt,
    }).catch(() => {});

    res.json({
        success: true,
        message: 'Your password has been reset. Sign in with your new password.',
    });
}));

// google auth
router.get(
    '/google',
    ensureGuest,
    rememberOAuthChoice,
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get(
    '/google/callback',
    passport.authenticate('google', authOptions),
    asyncHandler(async (req, res) => {
        syncSessionVersion(req);
        applySessionLifetime(req, readRequestCookie(req, OAUTH_REMEMBER_COOKIE) === '1');
        res.clearCookie(OAUTH_REMEMBER_COOKIE, { path: '/auth' });
        await recordLogin(req, {
            userId: req.user.id,
            email: req.user.email,
            method: 'google',
            success: true,
        });
        if (req.user._isNewAccount) {
            void notifyWelcome(req.user, req.user.primaryProvider);
            delete req.user._isNewAccount;
        }
        void notifySuccessfulLogin(req, req.user, 'google');
        res.redirect(successRedirect);
    })
);

// facebook auth
router.get(
    '/facebook',
    ensureGuest,
    rememberOAuthChoice,
    passport.authenticate('facebook', { scope: ['public_profile'] })
);

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', authOptions),
    asyncHandler(async (req, res) => {
        syncSessionVersion(req);
        applySessionLifetime(req, readRequestCookie(req, OAUTH_REMEMBER_COOKIE) === '1');
        res.clearCookie(OAUTH_REMEMBER_COOKIE, { path: '/auth' });
        await recordLogin(req, {
            userId: req.user.id,
            email: req.user.email,
            method: 'facebook',
            success: true,
        });
        if (req.user._isNewAccount) {
            void notifyWelcome(req.user, req.user.primaryProvider);
            delete req.user._isNewAccount;
        }
        void notifySuccessfulLogin(req, req.user, 'facebook');
        res.redirect(successRedirect);
    })
);

// logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err2) => {
        if (err2) return next(err2);
            res.clearCookie('sid', { path: '/' });
            res.json({ success: true, message: 'Logged out' });
        });
    });
});

// status
router.get('/status', (req, res) => {
    res.json({
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null,
    });
});

module.exports = router;
