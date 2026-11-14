import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    Gamepad2,
    Target,
    Flame,
    Crown,
    Zap,
    Play,
    Award,
    Settings,
    CalendarDays,
    ShieldCheck,
    ChevronRight,
    Timer,
    Banana,
    Mail,
    Sparkles,
    BarChart3,
    Brain,
    TrendingUp,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    LabelList,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import AudioControls from '../components/AudioControls.jsx';
import StatCard from '../components/StatCard.jsx';
import QuizPerformanceChart from '../components/QuizPerformanceChart.jsx';
import { useAuth } from '../context/auth-context.js';
import { gameApi, userApi } from '../api/client.js';
import { useSound } from '../hooks/useSound.js';
import { AchievementIcon } from '../lib/achievementIcons.jsx';
import { TIER_STYLES } from '../lib/tiers.js';
import { getDashboardVisibility } from '../lib/dashboardSections.js';
import {
    MODE_INFO,
    MODE_LIST,
    formatDate,
    formatRelative,
    getLevel,
    initials,
    normalizeModeId,
} from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MODE_ICONS = { easy: Banana, hard: Timer, custom: Settings };
const MODE_SHORT = { easy: 'Easy', hard: 'Hard', custom: 'Custom' };

export default function DashboardPage() {
    usePageTitle('Dashboard');
    const { user, stats } = useAuth();
    const navigate = useNavigate();
    const { play } = useSound();

    const {
        dashboardShowTrend: showTrend,
        dashboardShowLatestGame: showLatestGame,
        dashboardShowModeMix: showModeMix,
        dashboardShowThinkingTime: showThinkingTime,
    } = getDashboardVisibility(user?.preferences);
    const analyticsVisible =
        showTrend || showLatestGame || showModeMix || showThinkingTime;

    const [selectedMode, setSelectedMode] = useState(() =>
        normalizeModeId(user?.preferences?.defaultMode || user?.favoriteMode)
    );
    const [achievements, setAchievements] = useState(null);
    const [summary, setSummary] = useState(null);
    const [games, setGames] = useState([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [analyticsError, setAnalyticsError] = useState('');
    const [trendRange, setTrendRange] = useState(14);

    useEffect(() => {
        setSelectedMode(
            normalizeModeId(user?.preferences?.defaultMode || user?.favoriteMode)
        );
    }, [user?.id, user?.preferences?.defaultMode, user?.favoriteMode]);

    useEffect(() => {
        let active = true;
        userApi
            .achievements()
            .then((data) => {
                if (!active) return;
                setAchievements(Array.isArray(data?.achievements) ? data.achievements : []);
                setSummary(data?.summary || { unlocked: 0, total: 0 });
            })
            .catch(() => {
                if (!active) return;
                setAchievements([]);
                setSummary({ unlocked: 0, total: 0 });
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!analyticsVisible) return undefined;

        let active = true;
        setLoadingAnalytics(true);
        setAnalyticsError('');

        gameApi
            .games(100)
            .then((data) => {
                if (active) setGames(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (!active) return;
                setGames([]);
                setAnalyticsError(err.friendlyMessage || 'Could not load your game analytics.');
            })
            .finally(() => {
                if (active) setLoadingAnalytics(false);
            });

        return () => {
            active = false;
        };
    }, [analyticsVisible]);

    const level = getLevel(stats?.totalPoints ?? 0);
    const winRate = stats?.gamesPlayed
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const preview = useMemo(() => {
        if (!Array.isArray(achievements)) return [];
        return [...achievements]
            .sort(
                (a, b) =>
                    Number(Boolean(b?.unlocked)) - Number(Boolean(a?.unlocked)) ||
                    (Number(b?.progress) || 0) - (Number(a?.progress) || 0)
            )
            .slice(0, 4);
    }, [achievements]);

    const latestGame = useMemo(() => {
        if (!Array.isArray(games)) return null;
        return (
            games.find(
                (game) => Array.isArray(game?.quizzes) && game.quizzes.length > 0
            ) || null
        );
    }, [games]);

    const startRound = () => {
        play('click');
        navigate(`/play?mode=${encodeURIComponent(selectedMode)}`);
    };

    if (!user) return null;

    const selectedInfo = MODE_INFO[selectedMode] || MODE_INFO.easy;
    const favouriteMode = normalizeModeId(user.favoriteMode);
    const favouriteLabel = MODE_INFO[favouriteMode]?.label || MODE_INFO.easy.label;

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8">
                {/* Welcome */}
                <motion.section
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6 overflow-hidden rounded-3xl border-4 border-banana-300 bg-gradient-to-br from-banana-100 via-banana-50 to-amber-100 p-5 shadow-game md:p-7"
                >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-banana-400 bg-banana-200 font-display text-2xl font-extrabold text-banana-700 shadow-game-sm">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    initials(user.displayName)
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-banana-600">
                                    Welcome back
                                </p>
                                <h1 className="font-display text-3xl font-extrabold leading-tight text-banana-800 md:text-4xl">
                                    {user.displayName}
                                </h1>
                                <p className="break-all text-sm text-banana-600">{user.email}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                                    <span className="rounded-full bg-banana-300 px-2.5 py-1 text-banana-900">
                                        Level {level.level} · {level.title}
                                    </span>
                                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-banana-700">
                                        Member since {formatDate(user.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:w-64">
                            <div>
                                <div className="mb-1 flex justify-between text-xs font-bold text-banana-700">
                                    <span>Level {level.level}</span>
                                    <span>
                                        {level.intoLevel}/{level.needed} pts
                                    </span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-white/80">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-banana-400 to-banana-600 transition-all"
                                        style={{ width: `${Math.max(3, level.progress)}%` }}
                                    />
                                </div>
                            </div>
                            <Button onClick={startRound} className="!py-3">
                                <Play size={18} /> Play {selectedInfo.label}
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {!user.emailVerified && (
                    <Link
                        to="/profile?tab=security"
                        className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-left shadow-game-sm transition hover:bg-amber-100"
                    >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                            <Mail size={19} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-display text-base font-extrabold text-amber-900">
                                Verify your email address
                            </span>
                            <span className="block text-xs font-semibold text-amber-700">
                                Confirm it from your profile to secure your account and enable
                                recovery emails.
                            </span>
                        </span>
                        <ChevronRight size={18} className="flex-shrink-0 text-amber-600" />
                    </Link>
                )}

                {/* Player status */}
                <section className="mb-8">
                    <SectionTitle
                        icon={<Sparkles size={18} />}
                        title="Player status"
                        hint="Updated after every round"
                    />
                    <div className="flex flex-wrap gap-3 [&>*]:grow [&>*]:basis-[calc(50%-0.375rem)] sm:[&>*]:basis-[calc(33.333%-0.5rem)] 2xl:[&>*]:basis-[calc(16.666%-0.625rem)]">
                        <StatCard icon={<Trophy size={18} />} label="Total points" value={stats?.totalPoints ?? 0} />
                        <StatCard
                            icon={<Gamepad2 size={18} />}
                            label="Games played"
                            value={stats?.gamesPlayed ?? 0}
                            color="from-sky-300 to-sky-500"
                        />
                        <StatCard
                            icon={<Target size={18} />}
                            label="Win rate"
                            value={`${winRate}%`}
                            hint={`${stats?.gamesWon ?? 0} correct`}
                            color="from-emerald-300 to-emerald-500"
                        />
                        <StatCard
                            icon={<Flame size={18} />}
                            label="Current streak"
                            value={stats?.currentStreak ?? 0}
                            color="from-orange-300 to-orange-500"
                        />
                        <StatCard
                            icon={<Crown size={18} />}
                            label="Best streak"
                            value={stats?.bestStreak ?? 0}
                            color="from-violet-300 to-violet-500"
                        />
                        <StatCard
                            icon={<Zap size={18} />}
                            label="Fastest answer"
                            value={
                                stats?.fastestAnswerMs
                                    ? `${(stats.fastestAnswerMs / 1000).toFixed(1)}s`
                                    : '—'
                            }
                            color="from-pink-300 to-pink-500"
                        />
                    </div>
                </section>

                {analyticsError && analyticsVisible && (
                    <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {analyticsError}
                    </p>
                )}

                {analyticsVisible ? (
                    <section className="mb-8 space-y-5">
                        {showTrend && (
                            <Card className="!p-5">
                                <SectionTitle
                                    icon={<TrendingUp size={18} />}
                                    title="Score and accuracy trend"
                                    hint={`Last ${trendRange} days`}
                                    action={
                                        <div className="flex gap-1 rounded-xl bg-banana-100 p-1">
                                            {[7, 14, 30].map((days) => (
                                                <button
                                                    key={days}
                                                    type="button"
                                                    onClick={() => setTrendRange(days)}
                                                    aria-pressed={trendRange === days}
                                                    className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                                                        trendRange === days
                                                            ? 'bg-white text-banana-800 shadow-game-sm'
                                                            : 'text-banana-600 hover:text-banana-800'
                                                    }`}
                                                >
                                                    {days}d
                                                </button>
                                            ))}
                                        </div>
                                    }
                                />
                                <LazySection
                                    loading={loadingAnalytics}
                                    loaderLabel={`Loading ${trendRange}-day trend`}
                                    skeletonHeight={340}
                                >
                                    <AccuracyChart games={games} range={trendRange} />
                                </LazySection>
                            </Card>
                        )}
                        {showLatestGame && (
                            <LazySection
                                loading={loadingAnalytics}
                                loaderLabel="Loading latest game performance"
                                skeletonHeight={360}
                            >
                                {latestGame ? (
                                    <QuizPerformanceChart
                                        quizzes={latestGame.quizzes}
                                        timeLimit={latestGame.time}
                                        title="Latest game performance"
                                        subtitle={`${
                                            MODE_INFO[normalizeModeId(latestGame.mode)]?.label ||
                                            'Game'
                                        } · ${formatRelative(
                                            latestGame.completedAt || latestGame.startedAt
                                        )}`}
                                        action={
                                            <Link
                                                to={`/game-overview/${encodeURIComponent(
                                                    latestGame.id
                                                )}`}
                                                className="flex items-center gap-1 text-sm font-bold text-banana-700 hover:underline"
                                            >
                                                View analysis <ChevronRight size={15} />
                                            </Link>
                                        }
                                    />
                                ) : (
                                    <Card className="!p-5">
                                        <SectionTitle
                                            icon={<BarChart3 size={18} />}
                                            title="Latest game performance"
                                            hint="Points and response time per quiz"
                                        />
                                        <p className="flex min-h-[180px] items-center justify-center text-center text-sm font-bold text-banana-500">
                                            Play a round and your per-quiz points and response
                                            times will appear here.
                                        </p>
                                    </Card>
                                )}
                            </LazySection>
                        )}
                        {(showModeMix || showThinkingTime) && (
                            <div
                                className={`grid gap-5 ${
                                    showModeMix && showThinkingTime ? 'lg:grid-cols-2' : ''
                                }`}
                            >
                                {showModeMix && (
                                    <Card className="!p-5">
                                        <SectionTitle
                                            icon={<BarChart3 size={18} />}
                                            title="Mode mix"
                                            hint="Share of games by mode"
                                        />
                                        <LazySection
                                            loading={loadingAnalytics}
                                            loaderLabel="Loading mode breakdown"
                                            skeletonHeight={340}
                                        >
                                            <ModeChart games={games} />
                                        </LazySection>
                                    </Card>
                                )}
                                {showThinkingTime && (
                                    <Card className="!p-5">
                                        <SectionTitle
                                            icon={<Brain size={18} />}
                                            title="Thinking time"
                                            hint="How quickly you answer"
                                        />
                                        <LazySection
                                            loading={loadingAnalytics}
                                            loaderLabel="Bucketing response times"
                                            skeletonHeight={340}
                                        >
                                            <ThinkingChart games={games} />
                                        </LazySection>
                                    </Card>
                                )}
                            </div>
                        )}
                    </section>
                ) : (
                    <Card className="mb-8 !p-6">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-banana-100 text-banana-600">
                                    <BarChart3 size={20} />
                                </span>
                                <div>
                                    <p className="font-display text-lg font-extrabold text-banana-800">
                                        Dashboard analytics are hidden
                                    </p>
                                    <p className="text-sm font-semibold text-banana-600">
                                        Your trend, latest game, mode mix and thinking-time cards
                                        are turned off. Add the ones you want from your profile.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                className="flex-shrink-0 !px-4 !py-2 !text-base"
                                onClick={() => navigate('/profile?tab=appearance')}
                            >
                                <Settings size={16} /> Choose cards
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Mode selection */}
                <section className="mb-8">
                    <SectionTitle
                        icon={<Gamepad2 size={18} />}
                        title="Choose a play mode"
                        hint="Each mode changes the timer and scoring"
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                        {MODE_LIST.map((mode) => {
                            const Icon = MODE_ICONS[mode.id] || Banana;
                            const active = selectedMode === mode.id;
                            return (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedMode(mode.id);
                                        play('click');
                                    }}
                                    aria-pressed={active}
                                    className={`rounded-2xl border-4 p-4 text-left transition ${
                                        active
                                            ? 'border-banana-500 bg-banana-100 shadow-game-sm'
                                            : 'border-banana-200 bg-white/80 hover:border-banana-300'
                                    }`}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-banana-300 to-banana-500 text-white">
                                            <Icon size={20} />
                                        </div>
                                        <span className="rounded-full bg-banana-200 px-2 py-0.5 text-[11px] font-extrabold text-banana-800">
                                            {mode.multiplier === 'Practice'
                                                ? 'Practice'
                                                : `${mode.multiplier} pts`}
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-extrabold text-banana-800">
                                        {mode.label}
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-wide text-banana-500">
                                        {mode.time} per puzzle
                                    </p>
                                    <p className="mt-1 text-sm text-banana-700">
                                        {mode.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Achievements preview */}
                    <Card className="!p-5 lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Award className="text-banana-500" size={22} />
                                <div>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">
                                        Achievements
                                    </h2>
                                    <p className="text-xs text-banana-600">
                                        {summary
                                            ? `${summary.unlocked ?? 0} of ${summary.total ?? 0} unlocked`
                                            : 'Loading your badges…'}
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/achievements"
                                className="flex items-center gap-1 text-sm font-bold text-banana-700 hover:underline"
                            >
                                View all <ChevronRight size={16} />
                            </Link>
                        </div>

                        {!achievements && (
                            <div className="py-8 text-center text-sm font-semibold text-banana-600">
                                Loading achievements…
                            </div>
                        )}

                        {achievements && achievements.length === 0 && (
                            <p className="py-6 text-center text-sm text-banana-600">
                                Play a round to start earning badges.
                            </p>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            {preview.map((achievement) => {
                                const tier = TIER_STYLES[achievement?.tier] || TIER_STYLES.bronze;
                                const progress = Math.max(
                                    0,
                                    Math.min(100, Number(achievement?.progress) || 0)
                                );
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`rounded-2xl border-2 p-3 ${
                                            achievement.unlocked
                                                ? `${tier.ring} bg-banana-50`
                                                : 'border-banana-200 bg-white/60'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div
                                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white ${
                                                    achievement.unlocked
                                                        ? `bg-gradient-to-br ${tier.gradient}`
                                                        : 'bg-banana-200 text-banana-500'
                                                }`}
                                            >
                                                <AchievementIcon name={achievement.icon} size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm font-extrabold text-banana-800">
                                                        {achievement.title}
                                                    </p>
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tier.chip}`}>
                                                        {tier.label}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-2 text-xs text-banana-600">
                                                    {achievement.description}
                                                </p>
                                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-banana-200">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            achievement.unlocked
                                                                ? 'bg-gradient-to-r from-banana-400 to-banana-600'
                                                                : 'bg-banana-300'
                                                        }`}
                                                        style={{ width: `${Math.max(4, progress)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Controls + account */}
                    <div className="space-y-5">
                        <Card className="!p-5">
                            <h2 className="mb-4 font-display text-xl font-extrabold text-banana-800">
                                Controls
                            </h2>
                            <AudioControls />
                        </Card>

                        <Card className="!p-5">
                            <h2 className="mb-3 font-display text-xl font-extrabold text-banana-800">
                                Account at a glance
                            </h2>
                            <dl className="space-y-2.5 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="flex items-center gap-2 text-banana-600">
                                        <ShieldCheck size={15} /> Sign-in
                                    </dt>
                                    <dd className="font-bold capitalize text-banana-800">
                                        {user.providerNames?.join(', ') || 'local'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="flex items-center gap-2 text-banana-600">
                                        <CalendarDays size={15} /> Last login
                                    </dt>
                                    <dd className="font-bold text-banana-800">
                                        {formatRelative(user.lastLoginAt)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="flex items-center gap-2 text-banana-600">
                                        <Banana size={15} /> Favourite mode
                                    </dt>
                                    <dd className="text-right font-bold text-banana-800">
                                        {favouriteLabel}
                                    </dd>
                                </div>
                            </dl>
                            <Link to="/profile" className="mt-4 block">
                                <Button variant="secondary" className="w-full !py-2.5 !text-base">
                                    <Settings size={17} /> Manage account
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SectionTitle({ icon, title, hint, action = null }) {
    return (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                <span className="text-banana-500">{icon}</span>
                {title}
            </h2>
            <div className="flex items-center gap-3">
                {hint && (
                    <p className="hidden text-xs font-semibold text-banana-500 sm:block">{hint}</p>
                )}
                {action}
            </div>
        </div>
    );
}

const chartTooltipStyle = {
    background: '#fffceb',
    border: '2px solid #ffec85',
    borderRadius: 12,
    boxShadow: '0 10px 24px rgba(107,50,0,.12)',
};
const MODE_COLORS = { easy: '#facc15', hard: '#fb7185', custom: '#60a5fa' };

const THINKING_BUCKETS = [
    { name: '<5s', label: 'Under 5s', color: '#34d399' },
    { name: '5–10s', label: '5–10s', color: '#facc15' },
    { name: '10–20s', label: '10–20s', color: '#fb923c' },
    { name: '20s+', label: '20s or more', color: '#fb7185' },
];

function LazySection({ loading, loaderLabel, skeletonHeight, children }) {
    if (loading) {
        return (
            <div
                style={{ minHeight: skeletonHeight }}
                className="flex flex-col items-center justify-center"
            >
                <div
                    className="w-full animate-pulse rounded-2xl bg-banana-100"
                    style={{ height: skeletonHeight - 35 }}
                />
                <p className="mt-3 text-xs font-bold text-banana-500">{loaderLabel}</p>
            </div>
        );
    }
    return children;
}

function gameAttemptCount(game) {
    const quizzes = Array.isArray(game?.quizzes) ? game.quizzes : [];
    return quizzes.filter(
        (quiz) => quiz?.status === 'answered' || quiz?.status === 'expired'
    ).length;
}

function gameCorrectCount(game) {
    if (Number.isFinite(Number(game?.correctCount))) return Number(game.correctCount);
    const quizzes = Array.isArray(game?.quizzes) ? game.quizzes : [];
    return quizzes.filter((quiz) => quiz?.isCorrect).length;
}

function AccuracyChart({ games, range = 14 }) {
    const rows = trendRows(games, range);
    const activeDays = rows.filter((row) => row.games > 0).length;

    if (!activeDays) {
        return <EmptyState text={`No games in the last ${range} days`} />;
    }

    const windowPoints = rows.reduce((sum, row) => sum + row.score, 0);
    const attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
    const correct = rows.reduce((sum, row) => sum + row.correct, 0);
    const windowAccuracy = attempts ? Math.round((correct / attempts) * 100) : null;

    return (
        <div>
            <div className="mb-4 grid grid-cols-3 gap-2">
                <TrendStat
                    label="Window points"
                    value={`${windowPoints > 0 ? '+' : ''}${windowPoints}`}
                    tone="text-banana-700"
                />
                <TrendStat
                    label="Accuracy"
                    value={windowAccuracy == null ? '—' : `${windowAccuracy}%`}
                    tone="text-emerald-600"
                />
                <TrendStat
                    label="Active days"
                    value={`${activeDays}/${range}`}
                    tone="text-sky-600"
                />
            </div>

            <ChartFrame label={`Score and accuracy over the last ${range} days`}>
                <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                        <linearGradient id="trendBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#facc15" stopOpacity=".95" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity=".55" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5d875" />
                    <XAxis
                        dataKey="label"
                        interval={range > 14 ? 4 : 0}
                        tick={{ fontSize: 11, fill: '#b56000' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="score"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#b56000' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="accuracy"
                        orientation="right"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: 12, fill: '#b56000' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#b56000' }} />
                    <Bar
                        yAxisId="score"
                        dataKey="score"
                        name="Daily points"
                        fill="url(#trendBarFill)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                    />
                    <Line
                        yAxisId="accuracy"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#34d399"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#34d399' }}
                        activeDot={{ r: 5 }}
                        connectNulls
                        name="Accuracy %"
                    />
                </ComposedChart>
            </ChartFrame>
        </div>
    );
}

function TrendStat({ label, value, tone }) {
    return (
        <div className="rounded-xl bg-banana-50 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-banana-500">
                {label}
            </p>
            <p className={`font-display text-lg font-extrabold ${tone}`}>{value}</p>
        </div>
    );
}

function TrendTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload || {};
    const score = Number(row.score) || 0;
    const accuracy = row.accuracy == null ? null : Number(row.accuracy);

    return (
        <div
            style={chartTooltipStyle}
            className="min-w-[170px] px-3 py-2 text-sm font-bold text-banana-800"
        >
            <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-banana-500">
                {row.fullLabel || row.label}
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-yellow-600">Points</span>
                <span>
                    {score > 0 ? '+' : ''}
                    {score}
                </span>
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-emerald-600">Accuracy</span>
                <span>{accuracy == null ? '—' : `${accuracy}%`}</span>
            </p>
            <p className="mt-1 flex items-center justify-between gap-5 border-t border-banana-200 pt-1 text-xs font-semibold text-banana-500">
                <span>
                    {row.games || 0} game{row.games === 1 ? '' : 's'}
                </span>
                <span>
                    {row.attempts || 0} quiz{row.attempts === 1 ? '' : 'z'}
                </span>
            </p>
        </div>
    );
}

function ModeChart({ games }) {
    const list = Array.isArray(games) ? games : [];
    const stats = new Map();

    for (const game of list) {
        const id = normalizeModeId(game?.mode);
        const entry = stats.get(id) || { id, games: 0, points: 0 };
        entry.games += 1;
        entry.points += Number(game?.totalPoints) || 0;
        stats.set(id, entry);
    }

    const rows = [...stats.values()]
        .map((row) => ({
            ...row,
            label: MODE_SHORT[row.id] || MODE_INFO[row.id]?.label || row.id,
            avgPoints: row.games ? Math.round(row.points / row.games) : 0,
        }))
        .sort((a, b) => b.games - a.games);

    if (!rows.length) return <EmptyState text="No completed games by mode yet." />;

    const total = rows.reduce((sum, row) => sum + row.games, 0);
    const top = rows[0];

    return (
        <div>
            <div className="mb-4 grid grid-cols-3 gap-2">
                <TrendStat label="Total games" value={total} tone="text-banana-700" />
                <TrendStat label="Top mode" value={top.label} tone="text-emerald-600" />
                <TrendStat
                    label="Modes played"
                    value={`${rows.length}/${MODE_LIST.length}`}
                    tone="text-sky-600"
                />
            </div>

            <ChartFrame label="Games by mode" height={230}>
                <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5d875" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#b56000' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#b56000' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        content={<ModeTooltip total={total} />}
                        cursor={{ fill: 'rgba(250,204,21,.12)' }}
                    />
                    <Bar dataKey="games" name="Games" radius={[8, 8, 0, 0]} maxBarSize={64}>
                        {rows.map((row) => (
                            <Cell key={row.id} fill={MODE_COLORS[row.id] || '#facc15'} />
                        ))}
                        <LabelList
                            dataKey="games"
                            position="top"
                            style={{ fontSize: 12, fontWeight: 800, fill: '#b56000' }}
                        />
                    </Bar>
                </BarChart>
            </ChartFrame>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-banana-600">
                {rows.map((row) => (
                    <span key={row.id} className="flex items-center gap-1.5">
                        <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: MODE_COLORS[row.id] || '#facc15' }}
                        />
                        {row.label} · {row.games}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ModeTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload || {};
    const share = total ? Math.round((row.games / total) * 100) : 0;

    return (
        <div
            style={chartTooltipStyle}
            className="min-w-[160px] px-3 py-2 text-sm font-bold text-banana-800"
        >
            <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-banana-500">
                {row.label}
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-yellow-600">Games</span>
                <span>{row.games}</span>
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-sky-600">Share</span>
                <span>{share}%</span>
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-emerald-600">Avg points</span>
                <span>{row.avgPoints}</span>
            </p>
        </div>
    );
}

function ThinkingChart({ games }) {
    const list = Array.isArray(games) ? games : [];
    const buckets = THINKING_BUCKETS.map((bucket) => ({ ...bucket, value: 0 }));
    let totalMs = 0;
    let answered = 0;

    list
        .flatMap((game) => (Array.isArray(game?.quizzes) ? game.quizzes : []))
        .forEach((quiz) => {
            if (quiz?.status !== 'answered') return;
            const ms = Number(quiz?.timeToAnswerMs);
            if (!Number.isFinite(ms) || ms <= 0) return;
            const seconds = ms / 1000;
            buckets[seconds < 5 ? 0 : seconds < 10 ? 1 : seconds < 20 ? 2 : 3].value += 1;
            totalMs += ms;
            answered += 1;
        });

    if (!answered) {
        return <EmptyState text="Answer a few puzzles to see your time profile." />;
    }

    const rows = buckets.filter((row) => row.value > 0);
    const avgSeconds = Math.round((totalMs / answered / 1000) * 10) / 10;
    const top = [...buckets].sort((a, b) => b.value - a.value)[0];

    return (
        <div>
            <div className="mb-4 grid grid-cols-3 gap-2">
                <TrendStat label="Answered" value={answered} tone="text-banana-700" />
                <TrendStat label="Avg time" value={`${avgSeconds}s`} tone="text-sky-600" />
                <TrendStat label="Most common" value={top.label} tone="text-emerald-600" />
            </div>

            <ChartFrame label="Answer-time profile" height={230}>
                <PieChart>
                    <Pie
                        data={rows}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={88}
                        paddingAngle={3}
                        stroke="transparent"
                    >
                        {rows.map((row) => (
                            <Cell key={row.name} fill={row.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<ThinkingTooltip total={answered} />} />
                    <text
                        x="50%"
                        y="46%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 22, fontWeight: 800, fill: '#8a4b00' }}
                    >
                        {avgSeconds}s
                    </text>
                    <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: 1.2,
                            fill: '#b56000',
                        }}
                    >
                        AVG TIME
                    </text>
                </PieChart>
            </ChartFrame>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-banana-600">
                {buckets.map((bucket) => (
                    <span key={bucket.name} className="flex items-center gap-1.5">
                        <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: bucket.color }}
                        />
                        {bucket.label} · {bucket.value}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ThinkingTooltip({ active, payload, total }) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload || {};
    const share = total ? Math.round((row.value / total) * 100) : 0;

    return (
        <div
            style={chartTooltipStyle}
            className="min-w-[150px] px-3 py-2 text-sm font-bold text-banana-800"
        >
            <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-banana-500">
                {row.label}
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-yellow-600">Answers</span>
                <span>{row.value}</span>
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-sky-600">Share</span>
                <span>{share}%</span>
            </p>
        </div>
    );
}

function ChartFrame({ label, height = 280, children }) {
    return (
        <div role="img" aria-label={label} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <p className="flex min-h-[220px] items-center justify-center text-sm font-bold text-banana-500">
            {text}
        </p>
    );
}

function trendRows(games, days = 14) {
    const list = Array.isArray(games) ? games : [];

    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (days - 1 - index));
        const next = new Date(date);
        next.setDate(next.getDate() + 1);

        const daily = list.filter((game) => {
            const value = new Date(game?.completedAt || game?.startedAt);
            return !Number.isNaN(value.getTime()) && value >= date && value < next;
        });

        const attempts = daily.reduce((sum, game) => sum + gameAttemptCount(game), 0);
        const correct = daily.reduce((sum, game) => sum + gameCorrectCount(game), 0);
        const score = daily.reduce(
            (sum, game) => sum + (Number(game?.totalPoints) || 0),
            0
        );

        return {
            label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            fullLabel: date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
            }),
            score,
            accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
            games: daily.length,
            attempts,
            correct,
        };
    });
}
