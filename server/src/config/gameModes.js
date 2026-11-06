const GAME_MODES = {
    easy: {
        id: 'easy',
        label: 'Standard · Easy',
        tagline: '10 quizzes with 30 seconds each',
        description: 'A steady pace for building your banana-counting streak.',
        timeLimitMs: 30000,
        pointsMultiplier: 1,
        speedBonus: true,
        icon: 'banana',
    },
    hard: {
        id: 'hard',
        label: 'Standard · Hard',
        tagline: '10 quizzes with 15 seconds each',
        description: 'Fast eyes and faster answers. Every quiz has only 15 seconds.',
        timeLimitMs: 15000,
        pointsMultiplier: 1,
        speedBonus: true,
        icon: 'timer',
    },
    custom: {
        id: 'custom',
        label: 'Custom',
        tagline: 'Make the challenge yours',
        description: 'Choose the number of quizzes and time allowed for each quiz.',
        timeLimitMs: 30000,
        pointsMultiplier: 1,
        speedBonus: true,
        icon: 'settings',
    },
    classic: {
        id: 'classic',
        label: 'Classic',
        tagline: 'The original banana count',
        description: 'Two minutes per puzzle, with speed bonuses and streak multipliers.',
        timeLimitMs: 120000,
        pointsMultiplier: 1,
        speedBonus: true,
        icon: 'banana',
    },
    blitz: {
        id: 'blitz',
        label: 'Blitz',
        tagline: 'Thirty seconds of chaos',
        description: 'Only 30 seconds per puzzle, but every point is worth 50% more.',
        timeLimitMs: 30000,
        pointsMultiplier: 1.5,
        speedBonus: true,
        icon: 'timer',
    },
    zen: {
        id: 'zen',
        label: 'Zen',
        tagline: 'Slow down and count',
        description: 'Five relaxed minutes per puzzle. No speed bonus — just accuracy.',
        timeLimitMs: 300000,
        pointsMultiplier: 1,
        speedBonus: false,
        icon: 'leaf',
    },
};

const DEFAULT_MODE = 'classic';

function getMode(modeId) {
    return GAME_MODES[modeId] || GAME_MODES[DEFAULT_MODE];
}

function listModes() {
    return Object.values(GAME_MODES).map((mode) => ({
        id: mode.id,
        label: mode.label,
        tagline: mode.tagline,
        description: mode.description,
        timeLimitMs: mode.timeLimitMs,
        quizCount: mode.id === 'easy' || mode.id === 'hard' ? 10 : null,
        pointsMultiplier: mode.pointsMultiplier,
        speedBonus: mode.speedBonus,
        icon: mode.icon,
    }));
}

module.exports = {
    GAME_MODES,
    DEFAULT_MODE,
    getMode,
    listModes,
};
