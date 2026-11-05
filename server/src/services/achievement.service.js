const Score = require('../models/Score');

/**
 * Achievement definitions. Each one maps to a single number from the player's
 * stats (or from their game-session history) and is evaluated on read, so no
 * extra bookkeeping is needed when a game ends.
 */
const ACHIEVEMENTS = [
    {
        id: 'first-round',
        title: 'First Peel',
        description: 'Finish your very first banana round.',
        icon: 'banana',
        tier: 'bronze',
        metric: 'gamesPlayed',
        target: 1,
    },
    {
        id: 'first-win',
        title: 'Sharp Eyes',
        description: 'Count a bunch correctly for the first time.',
        icon: 'eye',
        tier: 'bronze',
        metric: 'gamesWon',
        target: 1,
    },
    {
        id: 'streak-3',
        title: 'On a Roll',
        description: 'Get 3 correct answers in a row.',
        icon: 'flame',
        tier: 'bronze',
        metric: 'bestStreak',
        target: 3,
    },
    {
        id: 'streak-10',
        title: 'Banana Fever',
        description: 'Build a best streak of 10.',
        icon: 'flame',
        tier: 'silver',
        metric: 'bestStreak',
        target: 10,
    },
    {
        id: 'streak-25',
        title: 'Unstoppable',
        description: 'Build a best streak of 25.',
        icon: 'crown',
        tier: 'gold',
        metric: 'bestStreak',
        target: 25,
    },
    {
        id: 'speed-5',
        title: 'Quick Draw',
        description: 'Answer correctly in under 5 seconds.',
        icon: 'zap',
        tier: 'silver',
        metric: 'fastestAnswerMs',
        target: 5000,
        lowerIsBetter: true,
    },
    {
        id: 'speed-2',
        title: 'Lightning Peel',
        description: 'Answer correctly in under 2 seconds.',
        icon: 'zap',
        tier: 'gold',
        metric: 'fastestAnswerMs',
        target: 2000,
        lowerIsBetter: true,
    },
    {
        id: 'points-500',
        title: 'Point Collector',
        description: 'Bank 500 total points.',
        icon: 'coins',
        tier: 'bronze',
        metric: 'totalPoints',
        target: 500,
    },
    {
        id: 'points-2500',
        title: 'Banana Baron',
        description: 'Bank 2,500 total points.',
        icon: 'trophy',
        tier: 'silver',
        metric: 'totalPoints',
        target: 2500,
    },
    {
        id: 'points-10000',
        title: 'Golden Bunch',
        description: 'Bank 10,000 total points.',
        icon: 'trophy',
        tier: 'gold',
        metric: 'totalPoints',
        target: 10000,
    },
    {
        id: 'veteran-25',
        title: 'Quiz Veteran',
        description: 'Play 25 rounds.',
        icon: 'medal',
        tier: 'silver',
        metric: 'gamesPlayed',
        target: 25,
    },
    {
        id: 'champion-50',
        title: 'Banana Champion',
        description: 'Win 50 rounds.',
        icon: 'crown',
        tier: 'gold',
        metric: 'gamesWon',
        target: 50,
    },
    {
        id: 'mode-blitz',
        title: 'Blitz Rookie',
        description: 'Complete a round in Blitz mode.',
        icon: 'timer',
        tier: 'bronze',
        metric: 'blitzSessions',
        target: 1,
    },
    {
        id: 'mode-zen',
        title: 'Zen Master',
        description: 'Complete a round in Zen mode.',
        icon: 'leaf',
        tier: 'bronze',
        metric: 'zenSessions',
        target: 1,
    },
];

async function evaluateAchievements(userId) {
    const score = await Score.findOne({ user: userId }).lean();

    const metrics = {
        totalPoints: score?.totalPoints || 0,
        gamesPlayed: score?.gamesPlayed || 0,
        gamesWon: score?.gamesWon || 0,
        bestStreak: score?.bestStreak || 0,
        currentStreak: score?.currentStreak || 0,
        fastestAnswerMs: score?.fastestAnswerMs ?? null,
        classicSessions: score?.modePlays?.classic || 0,
        blitzSessions: score?.modePlays?.blitz || 0,
        zenSessions: score?.modePlays?.zen || 0,
    };

    const achievements = ACHIEVEMENTS.map((achievement) => {
        const raw = metrics[achievement.metric];

        let progress;
        let unlocked;
        if (achievement.lowerIsBetter) {
            // Speed achievements unlock when a recorded time is at or below
            // the target. Progress grows as the time gets faster.
            const value = raw ?? 0;
            unlocked = value > 0 && value <= achievement.target;
            progress = value > 0 ? Math.min(1, achievement.target / value) : 0;
        } else {
            progress = Math.min(1, raw / achievement.target);
            unlocked = raw >= achievement.target;
        }

        return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier,
            metric: achievement.metric,
            target: achievement.target,
            lowerIsBetter: Boolean(achievement.lowerIsBetter),
            value: raw,
            progress: Math.round(progress * 100),
            unlocked,
        };
    });

    return {
        achievements,
        summary: {
            unlocked: achievements.filter((a) => a.unlocked).length,
            total: achievements.length,
        },
        stats: metrics,
    };
}

module.exports = {
    ACHIEVEMENTS,
    evaluateAchievements,
};
