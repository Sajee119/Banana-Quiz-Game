const REMEMBER_COOKIE = 'banana-remember';
const REMEMBER_DAYS = 30;

function readCookie(name) {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    for (const part of document.cookie.split(';')) {
        const entry = part.trim();
        if (entry.startsWith(prefix)) return entry.slice(prefix.length);
    }
    return null;
}

/**
 * Returns the email address saved by a previous "Remember me" sign-in, or
 * null when the player has not opted in (or the cookie is unreadable).
 */
export function readRememberedLogin() {
    const raw = readCookie(REMEMBER_COOKIE);
    if (!raw) return null;

    try {
        const data = JSON.parse(decodeURIComponent(raw));
        if (!data || typeof data !== 'object') return null;
        const email = typeof data.email === 'string' ? data.email.trim() : '';
        return { email };
    } catch {
        return null;
    }
}

/**
 * Stores the player's email and remember choice in a first-party cookie.
 * The session cookie itself is made persistent by the server.
 */
export function rememberLogin({ email }) {
    if (typeof document === 'undefined') return;
    const value = encodeURIComponent(JSON.stringify({ email: String(email || '').trim() }));
    const maxAge = REMEMBER_DAYS * 24 * 60 * 60;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${REMEMBER_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/** Removes the saved email and forgets the player's remember choice. */
export function forgetRememberedLogin() {
    if (typeof document === 'undefined') return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${REMEMBER_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}
