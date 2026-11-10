export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelative(value) {
    if (!value) return 'never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'never';

    const diff = Date.now() - date.getTime();
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    return formatDate(value);
}

export function formatDuration(ms) {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export const QUIZ_COUNT_OPTIONS = [5, 10, 20, 30];
export const TIME_LIMIT_OPTIONS = [10, 15, 20, 30, 45, 60];

export const POINTS_PER_LEVEL = 500;

export function getLevel(totalPoints = 0) {
    const points = Math.max(0, Number(totalPoints) || 0);
    const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
    const intoLevel = points % POINTS_PER_LEVEL;
    return {
        level,
        intoLevel,
        needed: POINTS_PER_LEVEL,
        progress: Math.round((intoLevel / POINTS_PER_LEVEL) * 100),
        title: ['Rookie', 'Counter', 'Spotter', 'Sharp Eye', 'Banana Ace', 'Legend'][
            Math.min(5, Math.floor((level - 1) / 3))
        ],
    };
}

export function initials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const MODE_INFO = {
    easy: {
        id: 'easy',
        label: 'Standard · Easy',
        tagline: '10 quizzes · 30 seconds each',
        description: 'A steady pace for building your banana-value calculation streak.',
        time: '30 sec',
        multiplier: '50+',
    },
    hard: {
        id: 'hard',
        label: 'Standard · Hard',
        tagline: '10 quizzes · 15 seconds each',
        description: 'Fast calculations and faster answers. Every puzzle has only 15 seconds.',
        time: '15 sec',
        multiplier: '50+',
    },
    custom: {
        id: 'custom',
        label: 'Custom',
        tagline: 'Choose quizzes and time',
        description: 'Build a practice game with your own puzzle count and timer.',
        time: '10–60 sec',
        multiplier: 'Practice',
    },
};

export const MODE_LIST = Object.values(MODE_INFO);

const LEGACY_MODE_ALIASES = {
    classic: 'easy',
    blitz: 'hard',
    zen: 'custom',
};

export function normalizeModeId(modeId) {
    const id = String(modeId || '').trim().toLowerCase();
    const normalized = LEGACY_MODE_ALIASES[id] || id;
    return Object.hasOwn(MODE_INFO, normalized) ? normalized : 'easy';
}
