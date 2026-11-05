const logger = require('../utils/logger');

const BANANA_BASE = 'http://marcconrad.com/uob/banana/api.php';
const env = require('../config/env');
const FETCH_TIMEOUT_MS = env.BANANA_API_TIMEOUT_MS;
const MAX_RETRIES = env.BANANA_API_MAX_RETRIES;

class BananaApiError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.name = 'BananaApiError';
        this.status = status;
    }
}

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new BananaApiError(`Banana API responded ${res.status}`, 502);
        return res;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Fetch one puzzle from the Banana API.
 * @returns {{ imageUrl: string, solution: number, imageBase64?: string }}
 */
async function fetchPuzzle({ base64 = false } = {}) {
    const params = new URLSearchParams({
        out: 'json',
        base64: base64 ? 'yes' : 'no',
    });
    const url = `${BANANA_BASE}?${params}`;

    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetchWithTimeout(url);
            const data = await res.json();

            // API returns an image URL or PNG base64 in `question`.
            const imageBase64 = base64 && typeof data.question === 'string'
                ? data.question
                : data.base64 || null;
            const imageUrl = base64 && imageBase64
                ? `data:image/png;base64,${imageBase64}`
                : extractImageUrl(data.question);
            const solution = Number(data.solution);

            if (!imageUrl || Number.isNaN(solution)) {
                throw new BananaApiError('Malformed Banana API response');
            }

            return { imageUrl, solution, imageBase64 };
        } catch (err) {
            lastErr = err;
            logger.warn(`Banana API attempt ${attempt} failed: ${err.message}`);
            if (attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, 500 * attempt));
            }
        }
    }
    throw new BananaApiError(`Banana API unavailable: ${lastErr?.message}`);
}

function extractImageUrl(questionHtml) {
    if (typeof questionHtml !== 'string') return null;
    if (/^https?:\/\//i.test(questionHtml)) return questionHtml;
    const match = questionHtml.match(/src=["']([^"']+)["']/i);
    return match ? match[1] : null;
}

module.exports = { fetchPuzzle, BananaApiError };