/**
 * Optional analytics cards on the dashboard. Every card is hidden by default so
 * the dashboard stays focused until the player opts in from Profile.
 */
export const DASHBOARD_SECTIONS = [
    {
        key: 'dashboardShowTrend',
        label: 'Score and accuracy trend',
        description: 'Daily points and accuracy for the last 7, 14 or 30 days.',
    },
    {
        key: 'dashboardShowLatestGame',
        label: 'Latest game performance',
        description: 'Per-quiz points and response time from your most recent game.',
    },
    {
        key: 'dashboardShowModeMix',
        label: 'Mode mix',
        description: 'How many games you play in each mode.',
    },
    {
        key: 'dashboardShowThinkingTime',
        label: 'Thinking time',
        description: 'How quickly you answer banana puzzles.',
    },
];

export const DASHBOARD_DEFAULTS = Object.fromEntries(
    DASHBOARD_SECTIONS.map((section) => [section.key, false])
);

export function getDashboardVisibility(preferences = {}) {
    return DASHBOARD_SECTIONS.reduce((result, section) => {
        result[section.key] = preferences?.[section.key] === true;
        return result;
    }, {});
}
