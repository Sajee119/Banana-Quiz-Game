export const THEME_OPTIONS = [
    { id: 'light', label: 'Light', description: 'Sunny banana cream' },
    { id: 'dark', label: 'Dark', description: 'Midnight banana grove' },
];

const THEME_KEY = 'bq-theme';
const COMPACT_KEY = 'bq-compact';

export function normalizeTheme(value) {
    return value === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme() {
    try {
        return normalizeTheme(localStorage.getItem(THEME_KEY));
    } catch {
        return 'light';
    }
}

export function applyTheme(value, { persist = true } = {}) {
    const theme = normalizeTheme(value);
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = theme;
    }
    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch {
            // Private mode: the theme still applies for this session.
        }
    }
    return theme;
}

export function readStoredCompactMode() {
    try {
        return localStorage.getItem(COMPACT_KEY) === 'true';
    } catch {
        return false;
    }
}

export function applyCompactMode(enabled, { persist = true } = {}) {
    const compact = Boolean(enabled);
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.compact = compact ? 'true' : 'false';
    }
    if (persist) {
        try {
            localStorage.setItem(COMPACT_KEY, compact ? 'true' : 'false');
        } catch {
            // Private mode: the layout still applies for this session.
        }
    }
    return compact;
}
