import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Award,
    Lock,
    CircleCheck,
    Trophy,
    Flame,
    Target,
    Sparkles,
    RefreshCw,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/auth-context.js';
import { userApi } from '../api/client.js';
import { AchievementIcon } from '../lib/achievementIcons.jsx';
import { TIER_STYLES } from '../lib/tiers.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'unlocked', label: 'Unlocked' },
    { id: 'locked', label: 'In progress' },
];

export default function AchievementsPage() {
    usePageTitle('Achievements');
    const { stats } = useAuth();
    const [achievements, setAchievements] = useState(null);
    const [summary, setSummary] = useState({ unlocked: 0, total: 0 });
    const [apiStats, setApiStats] = useState(null);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        setAchievements(null);
        setError('');

        userApi
            .achievements()
            .then((data) => {
                if (!active) return;
                setAchievements(Array.isArray(data?.achievements) ? data.achievements : []);
                setSummary(data?.summary || { unlocked: 0, total: 0 });
                setApiStats(data?.stats || null);
            })
            .catch((err) => {
                if (!active) return;
                setError(err.friendlyMessage || 'Could not load achievements.');
                setAchievements([]);
                setSummary({ unlocked: 0, total: 0 });
            });

        return () => {
            active = false;
        };
    }, [reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const visible = useMemo(() => {
        if (!Array.isArray(achievements)) return [];
        if (filter === 'unlocked') return achievements.filter((achievement) => achievement?.unlocked);
        if (filter === 'locked') return achievements.filter((achievement) => !achievement?.unlocked);
        return achievements;
    }, [achievements, filter]);

    const total = Number(summary?.total) || 0;
    const unlocked = Number(summary?.unlocked) || 0;
    const percent = total ? Math.round((unlocked / total) * 100) : 0;
    const displayStats = apiStats || stats || {};
    const counts = useMemo(() => {
        const list = Array.isArray(achievements) ? achievements : [];
        const done = list.filter((achievement) => achievement?.unlocked).length;
        return { all: list.length, unlocked: done, locked: list.length - done };
    }, [achievements]);

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8">
                <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div className="mb-6 rounded-3xl border-4 border-banana-300 bg-gradient-to-br from-banana-100 to-amber-100 p-5 shadow-game md:p-7">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-banana-600">
                                    <Award size={15} /> Trophy cabinet
                                </p>
                                <h1 className="font-display text-4xl font-extrabold text-banana-800">
                                    Achievements
                                </h1>
                                <p className="mt-1 max-w-xl text-banana-700">
                                    Every badge is earned from your real stats. Keep solving
                                    banana-value puzzles to fill the cabinet.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative flex h-24 w-24 items-center justify-center">
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#FFEC85" strokeWidth="10" />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="#F5A800"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray={`${percent * 2.64} 264`}
                                        />
                                    </svg>
                                    <div className="text-center">
                                        <div className="font-display text-2xl font-extrabold leading-none text-banana-800">
                                            {percent}%
                                        </div>
                                        <div className="text-[10px] font-bold uppercase text-banana-600">
                                            complete
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-banana-700">
                                    <p className="font-display text-3xl font-extrabold text-banana-800">
                                        {unlocked}
                                        <span className="text-lg text-banana-500">/{total}</span>
                                    </p>
                                    <p>badges unlocked</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1 rounded-2xl bg-banana-100 p-1">
                            {FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFilter(item.id)}
                                    aria-pressed={filter === item.id}
                                    className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                                        filter === item.id
                                            ? 'bg-white text-banana-800 shadow-game-sm'
                                            : 'text-banana-600 hover:text-banana-800'
                                    }`}
                                >
                                    {item.label}
                                    <span className="ml-1.5 rounded-full bg-banana-200 px-1.5 text-[11px] text-banana-700">
                                        {counts[item.id]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-xs font-semibold text-banana-500">
                                {displayStats.gamesPlayed ?? 0} rounds played ·{' '}
                                {displayStats.totalPoints ?? 0} points
                            </p>
                            <button
                                type="button"
                                onClick={reload}
                                title="Refresh achievements"
                                className="rounded-xl p-2 text-banana-600 hover:bg-banana-100"
                            >
                                <RefreshCw
                                    size={16}
                                    className={!achievements ? 'animate-spin' : ''}
                                />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-700">{error}</p>
                            <Button variant="secondary" className="!py-2 !text-sm" onClick={reload}>
                                Try again
                            </Button>
                        </div>
                    )}

                    {!achievements && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, index) => (
                                <div
                                    key={index}
                                    className="h-36 animate-pulse rounded-2xl border-2 border-banana-200 bg-white/60"
                                />
                            ))}
                        </div>
                    )}

                    {achievements && visible.length === 0 && (
                        <Card className="py-12 text-center">
                            <Sparkles className="mx-auto mb-2 text-banana-400" size={36} />
                            <p className="font-bold text-banana-700">
                                {filter === 'unlocked'
                                    ? 'No badges unlocked yet — play a round!'
                                    : filter === 'locked'
                                      ? 'Nothing here. Every achievement is already unlocked!'
                                      : 'No achievements available yet.'}
                            </p>
                        </Card>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((achievement, index) => {
                            const tier = TIER_STYLES[achievement?.tier] || TIER_STYLES.bronze;
                            const progress = Math.max(
                                0,
                                Math.min(100, Number(achievement?.progress) || 0)
                            );
                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                    className={`relative overflow-hidden rounded-2xl border-4 bg-white/90 p-4 shadow-game-sm ${
                                        achievement.unlocked ? tier.ring : 'border-banana-200'
                                    }`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                                                achievement.unlocked
                                                    ? `bg-gradient-to-br ${tier.gradient}`
                                                    : 'bg-banana-200 text-banana-500'
                                            }`}
                                        >
                                            <AchievementIcon name={achievement.icon} size={24} />
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${tier.chip}`}>
                                            {tier.label}
                                        </span>
                                    </div>

                                    <h3 className="font-display text-lg font-extrabold leading-tight text-banana-800">
                                        {achievement.title}
                                    </h3>
                                    <p className="mb-3 text-sm text-banana-600">
                                        {achievement.description}
                                    </p>

                                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-banana-600">
                                        <span className="flex items-center gap-1">
                                            {achievement.unlocked ? (
                                                <CircleCheck size={14} />
                                            ) : (
                                                <Lock size={13} />
                                            )}
                                            {achievement.unlocked ? 'Unlocked' : `${progress}%`}
                                        </span>
                                        <span className="text-right">
                                            {formatTarget(achievement)}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-banana-200">
                                        <div
                                            className={`h-full rounded-full ${
                                                achievement.unlocked
                                                    ? 'bg-gradient-to-r from-banana-400 to-banana-600'
                                                    : 'bg-banana-300'
                                            }`}
                                            style={{ width: `${achievement.unlocked ? 100 : Math.max(3, progress)}%` }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        <MiniStat
                            icon={<Trophy size={18} />}
                            label="Points earned"
                            value={displayStats.totalPoints ?? 0}
                        />
                        <MiniStat
                            icon={<Flame size={18} />}
                            label="Best streak"
                            value={displayStats.bestStreak ?? 0}
                        />
                        <MiniStat
                            icon={<Target size={18} />}
                            label="Rounds won"
                            value={displayStats.gamesWon ?? 0}
                        />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function formatTarget(achievement) {
    const target = Number(achievement?.target) || 0;
    const value = Number(achievement?.value) || 0;
    if (achievement?.lowerIsBetter) {
        return target >= 1000 ? `under ${(target / 1000).toFixed(0)}s` : `under ${target}ms`;
    }
    return `${Math.min(value, target)}/${target}`;
}

function MiniStat({ icon, label, value }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-banana-200 bg-white/80 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                {icon}
            </div>
            <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-banana-600">
                    {label}
                </div>
                <div className="font-display text-xl font-extrabold text-banana-800">{value}</div>
            </div>
        </div>
    );
}
