const crypto = require('crypto');
const router = require('express').Router();
const passport = require('passport');
const env = require('../config/env');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const asyncHandler = require('../utils/asyncHandler');
const { recordLogin } = require('../services/loginHistory.service');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/mail.service');
const { evaluatePassword } = require('../utils/passwordPolicy');
const { getClientIp } = require('../utils/userAgent');
const logger = require('../utils/logger');
const { ensureGuest } = require('../middleware/auth.middleware');

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

function loginUser(req, user) {
    return new Promise((resolve, reject) => {
        req.login(user, (err) => {
            if (err) return reject(err);
            // Sessions carry the account's auth version so a password change
            // or "sign out other devices" can revoke them server-side.
            req.session.authVersion = user.authVersion || 0;
            resolve();
        });
    });
}

function syncSessionVersion(req) {
    if (req.session && req.user) {
        req.session.authVersion = req.user.authVersion || 0;
    }
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

    return res.status(201).json({ success: true, user });
}));

// email + password login
router.post('/login', asyncHandler(async (req, res) => {
    const { email = '', password = '' } = req.body || {};

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
    await loginUser(req, user);
    await recordLogin(req, {
        userId: user.id,
        email: user.email,
        method: 'password',
        success: true,
    });

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
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get(
    '/google/callback',
    passport.authenticate('google', authOptions),
    asyncHandler(async (req, res) => {
        syncSessionVersion(req);
        await recordLogin(req, {
            userId: req.user.id,
            email: req.user.email,
            method: 'google',
            success: true,
        });
        res.redirect(successRedirect);
    })
);

// facebook auth
router.get(
    '/facebook',
    ensureGuest,
    passport.authenticate('facebook', { scope: ['public_profile'] })
);

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', authOptions),
    asyncHandler(async (req, res) => {
        syncSessionVersion(req);
        await recordLogin(req, {
            userId: req.user.id,
            email: req.user.email,
            method: 'facebook',
            success: true,
        });
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
