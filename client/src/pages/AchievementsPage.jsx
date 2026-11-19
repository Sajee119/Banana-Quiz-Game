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
import BananaLogo from '../components/BananaLogo.jsx';
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

    const circumference = 2 * Math.PI * 42;

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8">
                <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    {/* Hero */}
                    <section className="relative mb-6 overflow-hidden rounded-[1.75rem] border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-5 shadow-game sm:p-7">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[14px] border-banana-300/30"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[14px] border-banana-200/40"
                        />
                        <BananaLogo
                            size={180}
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-10 right-6 rotate-12 opacity-[0.08]"
                        />

                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-300 bg-banana-100 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                    <Award size={13} /> Trophy cabinet
                                </p>
                                <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-banana-900 sm:text-5xl">
                                    Achievements
                                </h1>
                                <p className="mt-2 text-sm font-semibold leading-relaxed text-banana-800 sm:text-base">
                                    Every badge is earned from your real stats. Keep solving
                                    banana-value puzzles to fill the cabinet.
                                </p>

                                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-300 bg-emerald-100 px-2.5 py-1 text-emerald-800">
                                        <CircleCheck size={12} /> {unlocked} unlocked
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-300 bg-white px-2.5 py-1 text-banana-800 shadow-game-sm">
                                        <Lock size={12} /> {counts.locked} in progress
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-amber-300 bg-amber-50 px-2.5 py-1 text-banana-900">
                                        <Sparkles size={12} /> {percent}% complete
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-50 px-2.5 py-1 text-banana-800">
                                        <Trophy size={12} /> {displayStats.gamesPlayed ?? 0} rounds
                                        played
                                    </span>
                                </div>
                            </div>

                            <div className="w-full rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 p-4 shadow-game-sm lg:max-w-xs">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center"
                                        role="img"
                                        aria-label={`${percent}% of achievements unlocked`}
                                    >
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                strokeWidth="10"
                                                className="stroke-banana-200"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                fill="none"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
                                                className="stroke-banana-500 transition-all"
                                            />
                                        </svg>
                                        <div className="text-center">
                                            <div className="font-display text-2xl font-extrabold leading-none text-banana-900">
                                                {percent}%
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wide text-banana-700">
                                                complete
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-banana-700">
                                            Cabinet progress
                                        </p>
                                        <p className="font-display text-3xl font-extrabold leading-none text-banana-900">
                                            {unlocked}
                                            <span className="text-lg text-banana-600">/{total}</span>
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-banana-700">
                                            badges unlocked
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-banana-200 bg-banana-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-banana-400 to-banana-600 transition-all"
                                        style={{ width: `${Math.max(3, percent)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Filters */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div
                            className="flex flex-wrap gap-1 rounded-2xl border-2 border-banana-200 bg-banana-100 p-1"
                            role="group"
                            aria-label="Filter achievements"
                        >
                            {FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFilter(item.id)}
                                    aria-pressed={filter === item.id}
                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-extrabold transition ${
                                        filter === item.id
                                            ? 'bg-white text-banana-900 shadow-game-sm'
                                            : 'text-banana-600 hover:text-banana-800'
                                    }`}
                                >
                                    {item.label}
                                    <span className="rounded-full bg-banana-200 px-1.5 text-[11px] text-banana-800">
                                        {counts[item.id]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <p className="hidden items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-banana-600 sm:inline-flex">
                                {displayStats.gamesPlayed ?? 0} rounds ·{' '}
                                {displayStats.totalPoints ?? 0} points
                            </p>
                            <button
                                type="button"
                                onClick={reload}
                                title="Refresh achievements"
                                className="inline-flex items-center gap-2 rounded-2xl border-2 border-banana-400 bg-white px-4 py-2.5 text-sm font-display font-bold text-banana-700 shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5"
                            >
                                <RefreshCw
                                    size={16}
                                    className={!achievements ? 'animate-spin' : ''}
                                />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-700">{error}</p>
                            <Button variant="secondary" className="!py-2 !text-sm" onClick={reload}>
                                Try again
                            </Button>
                        </div>
                    )}

                    {!achievements && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {[...Array(12)].map((_, index) => (
                                <div
                                    key={index}
                                    className="h-[172px] animate-pulse rounded-xl border border-banana-200 bg-banana-100/60"
                                />
                            ))}
                        </div>
                    )}

                    {achievements && visible.length === 0 && (
                        <Card className="py-14 text-center">
                            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-500">
                                <Sparkles size={32} />
                            </span>
                            <p className="font-bold text-banana-700">
                                {filter === 'unlocked'
                                    ? 'No badges unlocked yet — play a round!'
                                    : filter === 'locked'
                                      ? 'Nothing here. Every achievement is already unlocked!'
                                      : 'No achievements available yet.'}
                            </p>
                        </Card>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        {visible.map((achievement, index) => {
                            const tier = TIER_STYLES[achievement?.tier] || TIER_STYLES.bronze;
                            const progress = Math.max(
                                0,
                                Math.min(100, Number(achievement?.progress) || 0)
                            );
                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ y: 8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                    className={`relative flex h-[172px] flex-col overflow-hidden rounded-xl border-2 bg-gradient-to-b from-white to-banana-50/70 shadow-game-sm ${
                                        achievement.unlocked ? tier.ring : 'border-banana-300'
                                    }`}
                                >
                                    <div
                                        aria-hidden="true"
                                        className={`h-1 ${
                                            achievement.unlocked
                                                ? `bg-gradient-to-r ${tier.gradient}`
                                                : 'bg-banana-200'
                                        }`}
                                    />

                                    <div className="flex min-h-0 flex-1 flex-col p-2.5">
                                        <div className="mb-2 flex items-start justify-between gap-1.5">
                                            <div
                                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                                                    achievement.unlocked
                                                        ? `border-white/40 bg-gradient-to-br text-white ${tier.gradient}`
                                                        : 'border-banana-200 bg-banana-100 text-banana-600'
                                                }`}
                                            >
                                                <AchievementIcon name={achievement.icon} size={15} />
                                            </div>
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${tier.chip}`}
                                            >
                                                {tier.label}
                                            </span>
                                        </div>

                                        <h3 className="line-clamp-2 font-display text-sm leading-tight text-banana-900">
                                            {achievement.title}
                                        </h3>
                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-banana-700">
                                            {achievement.description}
                                        </p>

                                        <div className="mt-auto pt-1.5">
                                            <div className="mb-1 flex items-center justify-between gap-1 text-[10px] text-banana-700">
                                                <span className="flex items-center gap-1 truncate">
                                                    {achievement.unlocked ? <CircleCheck size={11} /> : <Lock size={10} />}
                                                    {achievement.unlocked ? 'Complete' : `${progress}%`}
                                                </span>
                                                <span className="truncate">{formatTarget(achievement)}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-banana-100">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        achievement.unlocked
                                                            ? `bg-gradient-to-r ${tier.gradient}`
                                                            : 'bg-banana-400'
                                                    }`}
                                                    style={{
                                                        width: `${achievement.unlocked ? 100 : Math.max(3, progress)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-8">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                            <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-banana-800">
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 border-banana-300 bg-banana-200 text-banana-700">
                                    <Flame size={18} />
                                </span>
                                Player stats
                            </h2>
                            <p className="hidden rounded-full border-2 border-banana-200 bg-white/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-banana-600 sm:block">
                                Lifetime totals
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <MiniStat
                                icon={<Trophy size={18} />}
                                label="Points earned"
                                value={displayStats.totalPoints ?? 0}
                                color="from-banana-300 to-banana-500"
                            />
                            <MiniStat
                                icon={<Flame size={18} />}
                                label="Best streak"
                                value={displayStats.bestStreak ?? 0}
                                color="from-orange-300 to-red-500"
                            />
                            <MiniStat
                                icon={<Target size={18} />}
                                label="Rounds won"
                                value={displayStats.gamesWon ?? 0}
                                color="from-sky-300 to-violet-500"
                            />
                        </div>
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

function MiniStat({ icon, label, value, color }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm">
            <div
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${color}`}
            />
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-game-sm ${color}`}
                >
                    {icon}
                </div>
                <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-banana-500">
                        {label}
                    </div>
                    <div className="font-display text-2xl font-extrabold leading-none text-banana-800">
                        {value}
                    </div>
                </div>
            </div>
        </div>
    );
}
