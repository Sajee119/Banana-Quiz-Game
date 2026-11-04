// Shared password policy used by registration, password changes and resets.
// Keep the rules in sync with client/src/lib/passwordStrength.js so the live
// meter in the UI matches what the server will accept.

const COMMON_PASSWORDS = new Set([
    '12345678',
    '123456789',
    '1234567890',
    'password',
    'password1',
    'password12',
    'password123',
    'passw0rd',
    'qwerty',
    'qwerty123',
    'letmein',
    'welcome',
    'welcome1',
    'admin123',
    'iloveyou',
    'monkey123',
    'dragon123',
    'sunshine',
    'princess',
    'football',
    'baseball',
    'abc12345',
    'banana',
    'bananas',
    'banana123',
    'bananaquiz',
]);

function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function personalTokens({ email = '', name = '' } = {}) {
    const tokens = new Set();
    const localPart = String(email).split('@')[0] || '';
    if (localPart.length >= 3) tokens.add(normalize(localPart));

    String(name)
        .split(/\s+/)
        .filter((part) => part.length >= 3)
        .forEach((part) => tokens.add(normalize(part)));

    return [...tokens].filter(Boolean);
}

/**
 * Evaluate a password and return a score from 0 (empty/weak) to 4 (strong),
 * plus the individual checks the UI renders as a live checklist.
 */
function evaluatePassword(password, { email = '', name = '' } = {}) {
    const value = String(password || '');
    const lowerValue = value.toLowerCase();
    const normalizedValue = normalize(value);

    const checks = {
        length: value.length >= 8,
        long: value.length >= 12,
        lower: /[a-z]/.test(value),
        upper: /[A-Z]/.test(value),
        number: /\d/.test(value),
        symbol: /[^A-Za-z0-9]/.test(value),
        notCommon: value.length > 0 && !COMMON_PASSWORDS.has(lowerValue),
        noPersonal:
            value.length > 0 &&
            !personalTokens({ email, name }).some(
                (token) => normalizedValue.includes(token)
            ),
        noRepeat: !/(.)\1{2,}/.test(value),
    };

    const classes = [checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean)
        .length;

    let score = 0;
    if (checks.length && checks.notCommon && checks.noPersonal) {
        score = 1;
        if (classes >= 2) score = 2;
        if (classes >= 3) score = 3;
        if (classes >= 3 && checks.long && checks.symbol && checks.noRepeat) score = 4;
    }

    const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const valid =
        checks.length &&
        checks.notCommon &&
        checks.noPersonal &&
        classes >= 3;

    let message = '';
    if (!checks.length) {
        message = 'Password must be at least 8 characters.';
    } else if (!checks.notCommon) {
        message = 'That password is too common. Choose something less predictable.';
    } else if (!checks.noPersonal) {
        message = 'Do not include your name or email address in your password.';
    } else if (classes < 3) {
        message =
            'Use at least three of: lowercase letters, uppercase letters, numbers and symbols.';
    }

    return {
        score,
        label: labels[score],
        valid,
        message,
        checks,
        classes,
    };
}

module.exports = { evaluatePassword, COMMON_PASSWORDS };
