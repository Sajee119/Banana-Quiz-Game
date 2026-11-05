const router = require('express').Router();
const Joi = require('joi');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth.middleware');
const gameService = require('../services/game.service');
const { evaluateAchievements } = require('../services/achievement.service');
const { getLoginHistory } = require('../services/loginHistory.service');
const { sendPasswordChangedEmail } = require('../services/mail.service');
const { evaluatePassword } = require('../utils/passwordPolicy');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_PREFERENCES = {
    reducedMotion: false,
    showOnLeaderboard: true,
};

function buildUserPayload(user) {
    const preferences = user.preferences || {};
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName,
        primaryProvider: user.primaryProvider,
        providerNames: user.providerNames,
        avatar: user.avatar || null,
        bio: user.bio || '',
        favoriteMode: user.favoriteMode || 'classic',
        preferences: {
            reducedMotion: preferences.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
            showOnLeaderboard: preferences.showOnLeaderboard ?? DEFAULT_PREFERENCES.showOnLeaderboard,
        },
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt || null,
    };
}

function buildStatsPayload(stats) {
    return {
        totalPoints: stats.totalPoints || 0,
        gamesPlayed: stats.gamesPlayed || 0,
        gamesWon: stats.gamesWon || 0,
        currentStreak: stats.currentStreak || 0,
        bestStreak: stats.bestStreak || 0,
        fastestAnswerMs: stats.fastestAnswerMs ?? null,
        lastPlayedAt: stats.lastPlayedAt || null,
    };
}

const profileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(60).messages({
        'string.min': 'Name must be at least 2 characters.',
        'string.max': 'Name must be 60 characters or fewer.',
        'string.empty': 'Name cannot be empty.',
    }),
    bio: Joi.string().allow('').max(160).messages({
        'string.max': 'Bio must be 160 characters or fewer.',
    }),
    avatar: Joi.string()
        .allow('', null)
        .max(500)
        .uri({ scheme: ['http', 'https'] })
        .messages({
            'string.uri': 'Avatar must be a valid http(s) image URL.',
            'string.max': 'Avatar URL is too long.',
        }),
    favoriteMode: Joi.string().valid('classic', 'blitz', 'zen').messages({
        'any.only': 'Choose Classic, Blitz or Zen.',
    }),
    preferences: Joi.object({
        reducedMotion: Joi.boolean(),
        showOnLeaderboard: Joi.boolean(),
    }).min(1),
}).min(1);

const passwordSchema = Joi.object({
    currentPassword: Joi.string().allow('').max(72).default(''),
    newPassword: Joi.string().min(8).max(72).required().messages({
        'string.min': 'New password must be at least 8 characters.',
        'string.max': 'New password must be 72 characters or fewer.',
        'any.required': 'New password is required.',
    }),
});

router.get('/me', ensureAuthenticated, asyncHandler(async (req, res) => {
    const stats = await gameService.getUserStats(req.user.id);

    res.json({
        success: true,
        user: buildUserPayload(req.user),
        stats: buildStatsPayload(stats),
    });
}));

router.patch('/me', ensureAuthenticated, asyncHandler(async (req, res) => {
    const { value, error } = profileSchema.validate(req.body || {}, { abortEarly: true });
    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    if (value.name !== undefined) user.setDisplayName(value.name);
    if (value.bio !== undefined) user.bio = value.bio;
    if (value.avatar !== undefined) user.avatar = value.avatar || null;
    if (value.favoriteMode !== undefined) user.favoriteMode = value.favoriteMode;
    if (value.preferences) {
        user.preferences = {
            ...DEFAULT_PREFERENCES,
            ...(user.preferences?.toObject ? user.preferences.toObject() : user.preferences || {}),
            ...value.preferences,
        };
    }

    await user.save();

    res.json({
        success: true,
        message: 'Account settings saved.',
        user: buildUserPayload(user),
    });
}));

router.patch('/me/password', ensureAuthenticated, asyncHandler(async (req, res) => {
    const { value, error } = passwordSchema.validate(req.body || {}, { abortEarly: true });
    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    const policy = evaluatePassword(value.newPassword, {
        email: user.email,
        name: user.displayName,
    });
    if (!policy.valid) {
        return res.status(400).json({ success: false, message: policy.message });
    }

    const hadPassword = Boolean(user.passwordHash);
    if (hadPassword) {
        if (!value.currentPassword) {
            return res.status(400).json({ success: false, message: 'Enter your current password.' });
        }
        const matches = await user.comparePassword(value.currentPassword);
        if (!matches) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }
        if (await user.comparePassword(value.newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Choose a password you have not used before.',
            });
        }
    }

    await user.setPassword(value.newPassword);
    if (!user.providers.some((provider) => provider.name === 'local')) {
        user.providers.push({ name: 'local', providerId: user.email });
    }
    // Revoke sessions on other devices but keep this one signed in.
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    if (req.session) req.session.authVersion = user.authVersion;

    // Best-effort notification; never hold up the password change response.
    sendPasswordChangedEmail({
        to: user.email,
        name: user.displayName,
        changedAt: user.passwordChangedAt,
    }).catch(() => {});

    res.json({
        success: true,
        message: hadPassword
            ? 'Password updated. Other devices have been signed out.'
            : 'Password added to your account.',
        user: buildUserPayload(user),
    });
}));

router.get('/me/security', ensureAuthenticated, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    const loginData = await getLoginHistory(req.user.id, req.sessionID);
    const hasPassword = user.providers.some((provider) => provider.name === 'local');
    const passwordAgeDays = user.passwordChangedAt
        ? Math.floor((Date.now() - new Date(user.passwordChangedAt).getTime()) / 86400000)
        : null;

    const checks = [
        {
            id: 'password',
            label: 'Password sign-in enabled',
            passed: hasPassword,
            hint: hasPassword
                ? 'You can sign in without a social provider.'
                : 'Add a password as a backup sign-in method.',
        },
        {
            id: 'fresh',
            label: 'Password changed in the last year',
            passed: Boolean(user.passwordChangedAt) && passwordAgeDays <= 365,
            hint: user.passwordChangedAt
                ? `Last changed ${passwordAgeDays} day${passwordAgeDays === 1 ? '' : 's'} ago.`
                : 'Set a password to start tracking this.',
        },
        {
            id: 'devices',
            label: 'Three or fewer recent devices',
            passed: loginData.devices.length <= 3,
            hint: `${loginData.devices.length} device${loginData.devices.length === 1 ? '' : 's'} seen recently.`,
        },
        {
            id: 'attempts',
            label: 'No failed sign-ins in recent history',
            passed: loginData.summary.failed === 0,
            hint: loginData.summary.failed
                ? `${loginData.summary.failed} failed attempt${loginData.summary.failed === 1 ? '' : 's'} recorded.`
                : 'No failed attempts recorded.',
        },
    ];

    const passed = checks.filter((check) => check.passed).length;
    const score = Math.round((passed / checks.length) * 100);
    const level =
        score >= 100 ? 'Excellent' : score >= 75 ? 'Good' : score >= 50 ? 'Needs attention' : 'At risk';

    res.json({
        success: true,
        security: {
            score,
            level,
            hasPassword,
            passwordChangedAt: user.passwordChangedAt || null,
            passwordAgeDays,
            activeDevices: loginData.devices.length,
            failedLogins: loginData.summary.failed,
            lastSuccessAt: loginData.summary.lastSuccessAt,
            lastFailedAt: loginData.summary.lastFailedAt,
            checks,
        },
    });
}));

router.post('/me/logout-others', ensureAuthenticated, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });

    // Every other session carries the previous version and is rejected on its
    // next request. This session is moved to the new version.
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    if (req.session) req.session.authVersion = user.authVersion;

    res.json({
        success: true,
        message: 'All other devices have been signed out.',
        user: buildUserPayload(user),
    });
}));

router.get('/me/logins', ensureAuthenticated, asyncHandler(async (req, res) => {
    const data = await getLoginHistory(req.user.id, req.sessionID);
    res.json({ success: true, ...data });
}));

router.get('/me/achievements', ensureAuthenticated, asyncHandler(async (req, res) => {
    const data = await evaluateAchievements(req.user.id);
    res.json({ success: true, ...data });
}));

router.get('/leaderboard', async (req, res, next) => {
    try {
        const Score = require('../models/Score');
        const requested = parseInt(req.query.limit, 10) || 25;
        const limit = Math.min(Math.max(requested, 1), 100);
        const currentUserId = req.user?.id ? String(req.user.id) : null;

        // Fetch the whole visible board (bounded) so ranks and the signed-in
        // player's position are consistent even when some profiles are hidden.
        const rows = await Score.find()
            .sort({ totalPoints: -1, gamesWon: -1, bestStreak: -1, updatedAt: 1 })
            .limit(500)
            .populate('user', 'firstName lastName avatar preferences');

        const mapped = rows
            .filter((score) => score.user)
            .map((score) => ({ score, user: score.user }))
            .filter(({ user }) => user.preferences?.showOnLeaderboard !== false)
            .map(({ score, user }, idx) => {
                const gamesPlayed = score.gamesPlayed || 0;
                return {
                    rank: idx + 1,
                    displayName: user.displayName || 'Anonymous counter',
                    avatar: user.avatar || null,
                    totalPoints: score.totalPoints || 0,
                    gamesPlayed,
                    gamesWon: score.gamesWon || 0,
                    bestStreak: score.bestStreak || 0,
                    winRate: gamesPlayed ? Math.round((score.gamesWon / gamesPlayed) * 100) : 0,
                    isCurrentUser: Boolean(currentUserId) && String(user._id) === currentUserId,
                };
            });

        // The current player's position, including when they have hidden
        // themselves from the public board.
        let me = null;
        if (currentUserId) {
            const visibleMe = mapped.find((entry) => entry.isCurrentUser);
            if (visibleMe) {
                me = { ...visibleMe, hidden: false };
            } else {
                const ownRow = rows.find((score) => score.user && String(score.user._id) === currentUserId);
                if (ownRow) {
                    me = {
                        rank: null,
                        displayName: ownRow.user.displayName || 'You',
                        avatar: ownRow.user.avatar || null,
                        totalPoints: ownRow.totalPoints || 0,
                        gamesPlayed: ownRow.gamesPlayed || 0,
                        gamesWon: ownRow.gamesWon || 0,
                        bestStreak: ownRow.bestStreak || 0,
                        winRate: ownRow.gamesPlayed
                            ? Math.round((ownRow.gamesWon / ownRow.gamesPlayed) * 100)
                            : 0,
                        isCurrentUser: true,
                        hidden: true,
                    };
                }
            }
        }

        res.json({
            success: true,
            data: mapped.slice(0, limit),
            me,
            total: mapped.length,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
