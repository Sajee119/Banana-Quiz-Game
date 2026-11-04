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
    classic: {
        id: 'classic',
        label: 'Classic',
        tagline: 'The original banana count',
        description: 'Two minutes per puzzle with speed bonuses and streak multipliers.',
        time: '2 min',
        multiplier: '1×',
    },
    blitz: {
        id: 'blitz',
        label: 'Blitz',
        tagline: 'Thirty seconds of chaos',
        description: 'Only 30 seconds per puzzle, but every point is worth 50% more.',
        time: '30 sec',
        multiplier: '1.5×',
    },
    zen: {
        id: 'zen',
        label: 'Zen',
        tagline: 'Slow down and count',
        description: 'Five relaxed minutes per puzzle. No speed bonus — just accuracy.',
        time: '5 min',
        multiplier: '1×',
    },
};

export const MODE_LIST = Object.values(MODE_INFO);
