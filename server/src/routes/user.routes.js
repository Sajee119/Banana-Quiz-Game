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


module.exports = router;