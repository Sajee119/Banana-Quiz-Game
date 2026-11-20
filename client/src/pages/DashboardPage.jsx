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
    CircleCheck,
    Headphones,
    ArrowRight,
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
import BananaLogo from '../components/BananaLogo.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import AudioControls from '../components/AudioControls.jsx';
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

            <main className="mx-auto w-full px-4 py-6 sm:px-6 md:py-8">
                {/* Player HUD */}
                <motion.section
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative mb-6 overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-white to-amber-50 p-5 shadow-game sm:p-7"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[10px] border-banana-300/30"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[10px] border-banana-200/40"
                    />
                    <BananaLogo
                        size={190}
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-10 right-6 rotate-12 opacity-10"
                    />

                    <div className="relative flex flex-wrap gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-shrink-0 self-start">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-banana-400 bg-gradient-to-b from-banana-200 to-banana-300 font-display text-2xl font-extrabold text-banana-800 shadow-game-sm sm:h-24 sm:w-24">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initials(user.displayName)
                                    )}
                                </div>
                                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-banana-900 shadow-game-sm">
                                    Lv {level.level}
                                </span>
                            </div>

                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Player online
                                </p>
                                <h1 className="mt-1 break-words font-display text-4xl font-extrabold leading-tight text-banana-900 sm:text-5xl">
                                    {user.displayName}
                                </h1>
                                <p className="break-all text-sm font-semibold text-banana-600">
                                    {user.email}
                                </p>
                                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                        <Crown size={12} /> {level.title}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                        <CalendarDays size={12} /> Since{' '}
                                        {formatDate(user.createdAt)}
                                    </span>
                                    {user.emailVerified ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                            <ShieldCheck size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                            <Mail size={12} /> Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full rounded-2xl border-2 border-banana-300 bg-white/90 p-4 shadow-game-sm xl:max-w-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                        Next level
                                    </p>
                                    <p className="truncate font-display text-2xl font-extrabold leading-tight text-banana-800">
                                        {level.title}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-banana-600">
                                        {level.intoLevel}/{level.needed} pts earned this level
                                    </p>
                                </div>
                                <LevelRing progress={level.progress} />
                            </div>

                            <div className="mt-3">
                                <div className="h-3 overflow-hidden rounded-full border-2 border-banana-200 bg-banana-100">
                                    <div
                                        className="h-full rounded-full bg-banana-500"
                                        style={{ width: `${Math.max(3, level.progress)}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-[11px] font-bold text-banana-600">
                                    <span>Level {level.level}</span>
                                    <span>Level {level.level + 1}</span>
                                </div>
                            </div>

                            <Button onClick={startRound} className="mt-3 w-full !py-3 !text-base">
                                <Play size={17} /> Play {MODE_SHORT[selectedMode]}
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {!user.emailVerified && (
                    <Link
                        to="/profile?tab=security"
                        className="group mb-6 flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50/70 px-4 py-3 text-left shadow-game-sm transition hover:bg-amber-100 hover:shadow-game"
                    >
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-200 text-amber-800">
                            <Mail size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-banana-700">
                                Quest · Secure your account
                            </span>
                            <span className="block font-display text-base font-extrabold text-banana-900">
                                Verify your email address
                            </span>
                            <span className="block text-xs font-semibold text-banana-700">
                                Confirm it from your profile to enable recovery emails and keep
                                your streak safe.
                            </span>
                        </span>
                        <span className="hidden flex-shrink-0 items-center gap-1 rounded-full border-2 border-amber-300 bg-white/70 px-3 py-1 text-xs font-extrabold text-banana-800 sm:inline-flex">
                            Verify <ChevronRight size={14} />
                        </span>
                        <ChevronRight
                            size={18}
                            className="flex-shrink-0 text-banana-600 transition group-hover:translate-x-0.5 sm:hidden"
                        />
                    </Link>
                )}

                {/* Player status */}
                <section className="mb-6">
                    <SectionTitle
                        icon={<Sparkles size={18} />}
                        title="Player status"
                        hint="Updated after every round"
                        action={
                            <Link
                                to="/leaderboard"
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-700 transition hover:bg-banana-100"
                            >
                                <Trophy size={13} /> Rankings
                            </Link>
                        }
                    />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <PlayerStat
                            icon={<Trophy size={14} />}
                            label="Total points"
                            value={stats?.totalPoints ?? 0}
                            hint={`${level.title} tier`}
                        />
                        <PlayerStat
                            icon={<Gamepad2 size={14} />}
                            label="Games played"
                            value={stats?.gamesPlayed ?? 0}
                            hint={`${stats?.gamesWon ?? 0} won`}
                        />
                        <PlayerStat
                            icon={<Target size={14} />}
                            label="Win rate"
                            value={`${winRate}%`}
                            hint={`${stats?.gamesWon ?? 0} correct`}
                        />
                        <PlayerStat
                            icon={<Flame size={14} />}
                            label="Current streak"
                            value={stats?.currentStreak ?? 0}
                            hint="Keep it alive"
                        />
                        <PlayerStat
                            icon={<Crown size={14} />}
                            label="Best streak"
                            value={stats?.bestStreak ?? 0}
                            hint="Personal record"
                        />
                        <PlayerStat
                            icon={<Zap size={14} />}
                            label="Fastest answer"
                            value={
                                stats?.fastestAnswerMs
                                    ? `${(stats.fastestAnswerMs / 1000).toFixed(1)}s`
                                    : '—'
                            }
                            hint="Across all modes"
                        />
                    </div>
                </section>

                {analyticsError && analyticsVisible && (
                    <p className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {analyticsError}
                    </p>
                )}

                {analyticsVisible ? (
                    <section className="mb-6">
                        <SectionTitle
                            icon={<BarChart3 size={18} />}
                            title="Performance lab"
                            hint="Your last 100 games"
                            action={
                                <Link
                                    to="/history"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-banana-700 hover:underline"
                                >
                                    Game history <ArrowRight size={14} />
                                </Link>
                            }
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {showTrend && (
                                <Card className="!p-3">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-banana-900">
                                            <TrendingUp size={14} className="text-banana-700" />
                                            Score & accuracy
                                        </h3>
                                        <div className="flex gap-0.5 rounded-xl border-2 border-banana-200 bg-banana-50 p-0.5">
                                            {[7, 14, 30].map((days) => (
                                                <button
                                                    key={days}
                                                    type="button"
                                                    onClick={() => setTrendRange(days)}
                                                    aria-pressed={trendRange === days}
                                                    className={`rounded-lg px-1.5 py-0.5 font-display text-[11px] font-bold transition ${
                                                        trendRange === days
                                                            ? 'bg-white text-banana-900'
                                                            : 'text-banana-700 hover:text-banana-900'
                                                    }`}
                                                >
                                                    {days}d
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <LazySection
                                        loading={loadingAnalytics}
                                        loaderLabel="Loading trend"
                                        skeletonHeight={170}
                                    >
                                        <AccuracyChart games={games} range={trendRange} compact />
                                    </LazySection>
                                </Card>
                            )}
                            {showLatestGame && (
                                <Card className="!p-3">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-banana-900">
                                            <BarChart3 size={14} className="text-banana-700" />
                                            Latest game
                                        </h3>
                                        {latestGame && (
                                            <Link
                                                to={`/game-overview/${encodeURIComponent(latestGame.id)}`}
                                                className="text-[11px] font-semibold text-banana-700 hover:underline"
                                            >
                                                Open
                                            </Link>
                                        )}
                                    </div>
                                    <LazySection
                                        loading={loadingAnalytics}
                                        loaderLabel="Loading latest game"
                                        skeletonHeight={170}
                                    >
                                        {latestGame ? (
                                            <QuizPerformanceChart
                                                quizzes={latestGame.quizzes}
                                                timeLimit={latestGame.time}
                                                compact
                                            />
                                        ) : (
                                            <p className="flex h-[170px] items-center justify-center text-center text-xs text-banana-700">
                                                Play a round to see per-quiz points and response time.
                                            </p>
                                        )}
                                    </LazySection>
                                </Card>
                            )}
                            {showModeMix && (
                                <Card className="!p-3">
                                    <div className="mb-2 flex items-center gap-1.5">
                                        <BarChart3 size={14} className="text-banana-700" />
                                        <h3 className="text-sm font-semibold text-banana-900">Mode mix</h3>
                                    </div>
                                    <LazySection
                                        loading={loadingAnalytics}
                                        loaderLabel="Loading modes"
                                        skeletonHeight={170}
                                    >
                                        <ModeChart games={games} compact />
                                    </LazySection>
                                </Card>
                            )}
                            {showThinkingTime && (
                                <Card className="!p-3">
                                    <div className="mb-2 flex items-center gap-1.5">
                                        <Brain size={14} className="text-banana-700" />
                                        <h3 className="text-sm font-semibold text-banana-900">Thinking time</h3>
                                    </div>
                                    <LazySection
                                        loading={loadingAnalytics}
                                        loaderLabel="Loading response times"
                                        skeletonHeight={170}
                                    >
                                        <ThinkingChart games={games} compact />
                                    </LazySection>
                                </Card>
                            )}
                        </div>
                    </section>
                ) : (
                    <Card className="mb-6 !p-5">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                    <BarChart3 size={18} />
                                </span>
                                <div>
                                    <p className="font-display text-lg text-banana-900">Performance lab is hidden</p>
                                    <p className="text-sm text-banana-800">
                                        Turn on trend, latest game, mode mix or thinking time cards.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                className="flex-shrink-0 !px-4 !py-2 !text-sm"
                                onClick={() => navigate('/profile?tab=appearance')}
                            >
                                <Settings size={15} /> Choose cards
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Mode selection */}
                <section className="mb-6">
                    <SectionTitle
                        icon={<Gamepad2 size={18} />}
                        title="Choose a play mode"
                        hint={`${selectedInfo.label} selected`}
                        action={
                            <Link
                                to="/play"
                                className="inline-flex items-center gap-1 text-xs font-bold text-banana-700 hover:underline"
                            >
                                Open mode select <ArrowRight size={14} />
                            </Link>
                        }
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
                                    className={`flex flex-col rounded-2xl border-2 p-4 text-left shadow-game-sm transition-all ${
                                        active
                                            ? '-translate-y-0.5 border-banana-500 bg-gradient-to-b from-banana-100 to-banana-50 shadow-game'
                                            : 'border-banana-300 bg-gradient-to-b from-white to-banana-50/60 hover:-translate-y-0.5 hover:border-banana-400 hover:shadow-game'
                                    }`}
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                            <Icon size={18} />
                                        </span>
                                        {active && (
                                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-300 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                                <CircleCheck size={11} /> Selected
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-display text-lg leading-tight text-banana-900">
                                        {mode.label}
                                    </h3>
                                    <p className="text-xs text-banana-700">{mode.tagline}</p>
                                    <p className="mt-1 flex-1 text-sm text-banana-800">{mode.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-banana-700">
                                        <span className="inline-flex items-center rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">{mode.time}</span>
                                        <span className="inline-flex items-center rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                                            {mode.multiplier === 'Practice' ? 'Practice' : `${mode.multiplier} points`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="grid items-start gap-5 lg:grid-cols-3">
                    {/* Achievements preview */}
                    <div className="space-y-5 lg:col-span-2">
                        <Card className="!p-5">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-200 text-banana-700">
                                        <Award size={24} />
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                            Trophy cabinet
                                        </p>
                                        <h2 className="font-display text-xl font-extrabold text-banana-800">
                                            Achievements
                                        </h2>
                                        <p className="text-xs font-semibold text-banana-600">
                                            {summary
                                                ? `${summary.unlocked ?? 0} of ${summary.total ?? 0} unlocked`
                                                : 'Loading your badges…'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/achievements"
                                    className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-banana-200 bg-white/80 px-3 py-2 font-display text-xs font-bold text-banana-700 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-100"
                                >
                                    View all <ChevronRight size={14} />
                                </Link>
                            </div>
    
                            {summary && Number(summary.total) > 0 && (
                                <div className="mb-4">
                                    <div className="h-3 overflow-hidden rounded-full border-2 border-banana-200 bg-banana-100">
                                        <div
                                            className="h-full rounded-full bg-banana-500"
                                            style={{
                                                width: `${Math.max(
                                                    2,
                                                    Math.round(
                                                        ((summary.unlocked ?? 0) /
                                                            (summary.total || 1)) *
                                                            100
                                                    )
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
    
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
                                            className={`relative overflow-hidden rounded-2xl border-2 p-3 transition ${
                                                achievement.unlocked
                                                    ? `${tier.ring} bg-banana-50 shadow-game-sm`
                                                    : 'border-banana-200 bg-white/60'
                                            }`}
                                        >
                                            {achievement.unlocked && (
                                                <div
                                                    aria-hidden="true"
                                                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tier.gradient}`}
                                                />
                                            )}
                                            <div className="flex items-start gap-2.5">
                                                <div
                                                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white ${
                                                        achievement.unlocked
                                                            ? `bg-gradient-to-br ${tier.gradient} shadow-game-sm`
                                                            : 'bg-banana-200 text-banana-500'
                                                    }`}
                                                >
                                                    <AchievementIcon name={achievement.icon} size={19} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate text-sm font-extrabold text-banana-800">
                                                            {achievement.title}
                                                        </p>
                                                        <span
                                                            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-banana-700"
                                                        >
                                                            <span
                                                                aria-hidden="true"
                                                                className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${tier.gradient}`}
                                                            />
                                                            {tier.label}
                                                        </span>
                                                    </div>
                                                    <p className="line-clamp-2 text-xs font-semibold text-banana-600">
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
                                                    <p
                                                        className={`mt-1 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                                            achievement.unlocked
                                                                ? 'text-emerald-800'
                                                                : 'text-banana-500'
                                                        }`}
                                                    >
                                                        {achievement.unlocked ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-300 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                                                <CircleCheck size={11} /> Unlocked
                                                            </span>
                                                        ) : (
                                                            `${Math.round(progress)}% complete`
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="!p-5">
                            <div className="mb-3 flex items-center gap-2.5">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                    <Sparkles size={19} />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                        Shortcuts
                                    </p>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">
                                        Jump back in
                                    </h2>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    { to: '/history', label: 'Game history', icon: CalendarDays },
                                    { to: '/achievements', label: 'Achievements', icon: Award },
                                    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
                                    { to: '/profile', label: 'Account settings', icon: Settings },
                                ].map(({ to, label, icon: Icon }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className="group flex items-center gap-2.5 rounded-2xl border-2 border-banana-200 bg-white/90 px-3 py-2 font-display text-sm font-bold text-banana-800 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-50"
                                    >
                                        <Icon size={16} className="text-banana-500" />
                                        <span className="flex-1">{label}</span>
                                        <ChevronRight
                                            size={15}
                                            className="text-banana-400 transition group-hover:translate-x-0.5"
                                        />
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Controls + account */}
                    <div className="space-y-5">
                        <Card className="!p-5">
                            <div className="mb-4 flex items-center gap-2.5">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                    <Headphones size={19} />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                        Audio &amp; feedback
                                    </p>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">
                                        Controls
                                    </h2>
                                </div>
                            </div>
                            <AudioControls />
                        </Card>

                        <Card className="!p-5">
                            <div className="mb-3 flex items-center gap-2.5">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                    <ShieldCheck size={19} />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-banana-700">
                                        Your account
                                    </p>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">
                                        At a glance
                                    </h2>
                                </div>
                            </div>
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

function PlayerStat({ icon, label, value, hint }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm">
            <div className="flex items-center gap-1.5 text-banana-700">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    {icon}
                </span>
                <p className="truncate text-[11px] font-bold uppercase tracking-wide text-banana-800">{label}</p>
            </div>
            <p className="mt-1.5 font-display text-xl leading-none text-banana-900 tabular-nums">{value}</p>
            {hint && <p className="mt-0.5 truncate text-[11px] text-banana-700">{hint}</p>}
        </div>
    );
}

function LevelRing({ progress }) {
    const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div
            className="relative h-16 w-16 flex-shrink-0"
            role="img"
            aria-label={`${pct}% towards the next level`}
        >
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    className="stroke-banana-200"
                />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="stroke-banana-500"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-extrabold text-banana-800">
                {pct}%
            </span>
        </div>
    );
}

function SectionTitle({ icon, title, hint, action = null }) {
    return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="flex items-center gap-2.5 font-display text-xl font-extrabold text-banana-800">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    {icon}
                </span>
                {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                {hint && (
                    <p className="hidden rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-700 sm:block">
                        {hint}
                    </p>
                )}
                {action}
            </div>
        </div>
    );
}

const chartTooltipStyle = {
    background: 'var(--color-banana-100)',
    border: '2px solid var(--color-banana-300)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-game)',
    color: 'var(--color-banana-900)',
};
const MODE_COLORS = {
    easy: 'var(--color-warning)',
    hard: 'var(--color-danger-soft)',
    custom: 'var(--color-info)',
};

const THINKING_BUCKETS = [
    { name: '<5s', label: 'Under 5s', color: 'var(--color-correct)' },
    { name: '5–10s', label: '5–10s', color: 'var(--color-warning)' },
    { name: '10–20s', label: '10–20s', color: 'var(--color-expired)' },
    { name: '20s+', label: '20s or more', color: 'var(--color-danger-soft)' },
];

function LazySection({ loading, loaderLabel, skeletonHeight, children }) {
    if (loading) {
        return (
            <div
                style={{ minHeight: skeletonHeight }}
                className="flex flex-col items-center justify-center"
            >
                <div
                    className="w-full rounded-2xl border-2 border-banana-200 bg-banana-50/60"
                    style={{ height: Math.max(60, skeletonHeight - 24) }}
                />
                <p className="mt-2 text-[11px] text-banana-600">{loaderLabel}</p>
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

function AccuracyChart({ games, range = 14, compact = false }) {
    const rows = trendRows(games, range);
    const activeDays = rows.filter((row) => row.games > 0).length;

    if (!activeDays) {
        return <EmptyState text={`No games in the last ${range} days`} compact={compact} />;
    }

    const windowPoints = rows.reduce((sum, row) => sum + row.score, 0);
    const attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
    const correct = rows.reduce((sum, row) => sum + row.correct, 0);
    const windowAccuracy = attempts ? Math.round((correct / attempts) * 100) : null;
    const chartHeight = compact ? 170 : 280;

    return (
        <div>
            {!compact && (
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
            )}

            <ChartFrame label={`Score and accuracy over the last ${range} days`} height={chartHeight}>
                <ComposedChart data={rows} margin={{ top: 6, right: 0, bottom: 0, left: compact ? -24 : -16 }}>
                    <defs>
                        <linearGradient id="trendBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-banana-400)" stopOpacity=".95" />
                            <stop offset="100%" stopColor="var(--color-banana-600)" stopOpacity=".55" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e1d7" />
                    <XAxis
                        dataKey="label"
                        interval={range > 14 ? 4 : 0}
                        tick={{ fontSize: compact ? 10 : 11, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="score"
                        allowDecimals={false}
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <YAxis
                        yAxisId="accuracy"
                        orientation="right"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    {!compact && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-chart-label)' }} />}
                    <Bar
                        yAxisId="score"
                        dataKey="score"
                        name="Daily points"
                        fill="url(#trendBarFill)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={compact ? 14 : 28}
                    />
                    <Line
                        yAxisId="accuracy"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={compact ? false : { r: 3, fill: 'var(--color-correct)' }}
                        activeDot={{ r: 4 }}
                        connectNulls
                        name="Accuracy %"
                    />
                </ComposedChart>
            </ChartFrame>
            {compact && (
                <p className="mt-1 text-[10px] text-banana-700">
                    {windowPoints > 0 ? '+' : ''}{windowPoints} pts · {windowAccuracy == null ? '—' : `${windowAccuracy}%`} accuracy
                </p>
            )}
        </div>
    );
}

function TrendStat({ label, value, tone }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-white/90 px-3 py-2 shadow-game-sm">
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

function ModeChart({ games, compact = false }) {
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

    if (!rows.length) return <EmptyState text="No completed games by mode yet." compact={compact} />;

    const total = rows.reduce((sum, row) => sum + row.games, 0);
    const top = rows[0];
    const chartHeight = compact ? 170 : 230;

    return (
        <div>
            {!compact && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                    <TrendStat label="Total games" value={total} tone="text-banana-700" />
                    <TrendStat label="Top mode" value={top.label} tone="text-emerald-600" />
                    <TrendStat
                        label="Modes played"
                        value={`${rows.length}/${MODE_LIST.length}`}
                        tone="text-sky-600"
                    />
                </div>
            )}

            <ChartFrame label="Games by mode" height={chartHeight}>
                <BarChart data={rows} margin={{ top: compact ? 8 : 20, right: 4, bottom: 0, left: compact ? -24 : -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e1d7" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <Tooltip
                        content={<ModeTooltip total={total} />}
                        cursor={{ fill: 'rgba(232,182,53,.12)' }}
                    />
                    <Bar dataKey="games" name="Games" radius={[4, 4, 0, 0]} maxBarSize={compact ? 28 : 64}>
                        {rows.map((row) => (
                            <Cell key={row.id} fill={MODE_COLORS[row.id] || 'var(--color-banana-400)'} />
                        ))}
                        {!compact && (
                            <LabelList
                                dataKey="games"
                                position="top"
                                style={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-chart-label)' }}
                            />
                        )}
                    </Bar>
                </BarChart>
            </ChartFrame>

            <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 ${compact ? 'text-[10px]' : 'text-[11px] font-bold'} text-banana-700`}>
                {rows.map((row) => (
                    <span key={row.id} className="flex items-center gap-1">
                        <span
                            className="h-2 w-2 rounded-sm"
                            style={{ background: MODE_COLORS[row.id] || 'var(--color-banana-400)' }}
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

function ThinkingChart({ games, compact = false }) {
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
        return <EmptyState text="Answer a few puzzles to see your time profile." compact={compact} />;
    }

    const rows = buckets.filter((row) => row.value > 0);
    const avgSeconds = Math.round((totalMs / answered / 1000) * 10) / 10;
    const top = [...buckets].sort((a, b) => b.value - a.value)[0];
    const chartHeight = compact ? 170 : 230;

    return (
        <div>
            {!compact && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                    <TrendStat label="Answered" value={answered} tone="text-banana-700" />
                    <TrendStat label="Avg time" value={`${avgSeconds}s`} tone="text-sky-600" />
                    <TrendStat label="Most common" value={top.label} tone="text-emerald-600" />
                </div>
            )}

            <ChartFrame label="Answer-time profile" height={chartHeight}>
                <PieChart>
                    <Pie
                        data={rows}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={compact ? 38 : 54}
                        outerRadius={compact ? 62 : 88}
                        paddingAngle={2}
                        stroke="transparent"
                    >
                        {rows.map((row) => (
                            <Cell key={row.name} fill={row.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<ThinkingTooltip total={answered} />} />
                    <text
                        x="50%"
                        y="48%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: compact ? 14 : 22, fontWeight: 600, fill: 'var(--color-chart-text)' }}
                    >
                        {avgSeconds}s
                    </text>
                    {!compact && (
                        <text
                            x="50%"
                            y="57%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ fontSize: 9, fontWeight: 600, fill: 'var(--color-chart-label)' }}
                        >
                            avg time
                        </text>
                    )}
                </PieChart>
            </ChartFrame>

            <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 ${compact ? 'text-[10px]' : 'text-[11px] font-bold'} text-banana-700`}>
                {buckets.map((bucket) => (
                    <span key={bucket.name} className="flex items-center gap-1">
                        <span
                            className="h-2 w-2 rounded-sm"
                            style={{ background: bucket.color }}
                        />
                        {bucket.label} · {bucket.value}
                    </span>
                ))}
            </div>
            {compact && <p className="mt-0.5 text-[10px] text-banana-700">Avg {avgSeconds}s · {answered} answers</p>}
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

function EmptyState({ text, compact = false }) {
    return (
        <p className={`flex items-center justify-center text-center ${compact ? 'h-[170px] text-xs' : 'min-h-[220px] text-sm'} text-banana-700`}>
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
