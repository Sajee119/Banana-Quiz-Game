import { useEffect } from 'react';

const HOME_TITLE = 'Banana Quiz — Count bananas. Beat the clock.';
const BRAND = 'Banana Quiz';

/**
 * Keep the browser tab title in sync with the page the player is viewing.
 * Pass no title for the landing page, or a short page name for every other
 * route (for example "Leaderboard").
 */
export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · ${BRAND}` : HOME_TITLE;
    }, [title]);
}
