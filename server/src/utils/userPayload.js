/**
 * Shared serializers for user-facing API responses. Keeping them in one place
 * means the register, verify, profile and password routes always return the
 * same shape to the React client.
 */

const DEFAULT_PREFERENCES = {
    reducedMotion: false,
    showOnLeaderboard: true,
    emailNotifications: true,
    loginAlerts: true,
    productUpdates: false,
    defaultMode: 'easy',
};

const VERIFIED_PROVIDERS = new Set(['google', 'facebook']);

function buildUserPayload(user) {
    const preferences = user.preferences || {};
    const providerNames = user.providerNames || [];
    const verifiedByProvider = providerNames.some((name) => VERIFIED_PROVIDERS.has(name));

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName,
        primaryProvider: user.primaryProvider,
        providerNames,
        avatar: user.avatar || null,
        bio: user.bio || '',
        favoriteMode: user.favoriteMode || 'easy',
        emailVerified: Boolean(user.emailVerified) || verifiedByProvider,
        emailVerifiedAt: user.emailVerifiedAt || null,
        preferences: {
            reducedMotion: preferences.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
            showOnLeaderboard:
                preferences.showOnLeaderboard ?? DEFAULT_PREFERENCES.showOnLeaderboard,
            emailNotifications:
                preferences.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
            loginAlerts: preferences.loginAlerts ?? DEFAULT_PREFERENCES.loginAlerts,
            productUpdates: preferences.productUpdates ?? DEFAULT_PREFERENCES.productUpdates,
            defaultMode: preferences.defaultMode ?? DEFAULT_PREFERENCES.defaultMode,
        },
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt || null,
    };
}

function buildStatsPayload(stats = {}) {
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

module.exports = {
    DEFAULT_PREFERENCES,
    buildUserPayload,
    buildStatsPayload,
};
