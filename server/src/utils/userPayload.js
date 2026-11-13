/**
 * Shared serializers for user-facing API responses. Keeping them in one place
 * means the register, verify, profile and password routes always return the
 * same shape to the React client.
 */

const DEFAULT_PREFERENCES = {
    theme: 'light',
    compactMode: false,
    reducedMotion: false,
    showOnLeaderboard: true,
    emailNotifications: true,
    loginAlerts: true,
    productUpdates: false,
    defaultMode: 'easy',
    autoSubmit: true,
    celebrations: true,
    showKeyboardHints: true,
    showTimer: true,
    confirmQuit: true,
    defaultQuizCount: 10,
    defaultTime: 30,
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
            theme: preferences.theme ?? DEFAULT_PREFERENCES.theme,
            compactMode: preferences.compactMode ?? DEFAULT_PREFERENCES.compactMode,
            reducedMotion: preferences.reducedMotion ?? DEFAULT_PREFERENCES.reducedMotion,
            showOnLeaderboard:
                preferences.showOnLeaderboard ?? DEFAULT_PREFERENCES.showOnLeaderboard,
            emailNotifications:
                preferences.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
            loginAlerts: preferences.loginAlerts ?? DEFAULT_PREFERENCES.loginAlerts,
            productUpdates: preferences.productUpdates ?? DEFAULT_PREFERENCES.productUpdates,
            defaultMode: preferences.defaultMode ?? DEFAULT_PREFERENCES.defaultMode,
            autoSubmit: preferences.autoSubmit ?? DEFAULT_PREFERENCES.autoSubmit,
            celebrations: preferences.celebrations ?? DEFAULT_PREFERENCES.celebrations,
            showKeyboardHints:
                preferences.showKeyboardHints ?? DEFAULT_PREFERENCES.showKeyboardHints,
            showTimer: preferences.showTimer ?? DEFAULT_PREFERENCES.showTimer,
            confirmQuit: preferences.confirmQuit ?? DEFAULT_PREFERENCES.confirmQuit,
            defaultQuizCount:
                preferences.defaultQuizCount ?? DEFAULT_PREFERENCES.defaultQuizCount,
            defaultTime: preferences.defaultTime ?? DEFAULT_PREFERENCES.defaultTime,
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
