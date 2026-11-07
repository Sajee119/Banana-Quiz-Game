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
    Leaf,
    Banana,
    Sparkles,
    BarChart3,
    Brain,
    TrendingUp,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
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
import { useAuth } from '../context/auth-context.js';
import { gameApi, userApi } from '../api/client.js';
import { useSound } from '../hooks/useSound.js';
import { AchievementIcon } from '../lib/achievementIcons.jsx';
import { TIER_STYLES } from '../lib/tiers.js';
import { MODE_LIST, formatDate, formatRelative, getLevel, initials } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MODE_ICONS = { classic: Banana, blitz: Timer, zen: Leaf };

export default function DashboardPage() {
    usePageTitle('Dashboard');
    const { user, stats } = useAuth();
    const navigate = useNavigate();
    const { play } = useSound();

    const [selectedMode, setSelectedMode] = useState(
        ['easy', 'hard', 'custom'].includes(user?.favoriteMode) ? user.favoriteMode : 'easy'
    );
    const [achievements, setAchievements] = useState(null);
    const [summary, setSummary] = useState(null);
    const [games, setGames] = useState([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    useEffect(() => {
        let active = true;
        userApi
            .achievements()
            .then((data) => {
                if (!active) return;
                setAchievements(data.achievements || []);
                setSummary(data.summary || null);
            })
            .catch(() => {
                if (active) setAchievements([]);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        gameApi.games(100)
            .then((data) => {
                if (active) setGames(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (active) setGames([]);
            })
            .finally(() => {
                if (active) setLoadingAnalytics(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const level = getLevel(stats?.totalPoints ?? 0);
    const winRate = stats?.gamesPlayed
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
        : 0;

    const preview = useMemo(() => {
        if (!achievements) return [];
        return [...achievements]
            .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress)
            .slice(0, 4);
    }, [achievements]);

    const startRound = () => {
        play('click');
        navigate(`/play?mode=${selectedMode}`);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
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
                                <p className="text-sm text-banana-600">{user.email}</p>
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
                                <Play size={18} /> Play {MODE_LIST.find((m) => m.id === selectedMode)?.label}
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {/* Player status */}
                <section className="mb-8">
                    <SectionTitle icon={<Sparkles size={18} />} title="Player status" hint="Updated after every round" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                            value={stats?.fastestAnswerMs ? `${(stats.fastestAnswerMs / 1000).toFixed(1)}s` : '—'}
                            color="from-pink-300 to-pink-500"
                        />
                    </div>
                </section>

                <section className="mb-8 space-y-5">
                    <Card className="!p-5">
                        <SectionTitle icon={<TrendingUp size={18} />} title="Score and accuracy trend" hint="The last 14 days. The line tracks accuracy." />
                        <LazySection loading={loadingAnalytics} loaderLabel="Loading 14-day trend" skeletonHeight={310}>
                            <AccuracyChart games={games} />
                        </LazySection>
                    </Card>
                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card className="!p-5">
                            <SectionTitle icon={<BarChart3 size={18} />} title="Mode mix" hint="Games by mode" />
                            <LazySection loading={loadingAnalytics} loaderLabel="Loading mode breakdown" skeletonHeight={300}>
                                <ModeChart games={games} />
                            </LazySection>
                        </Card>
                        <Card className="!p-5">
                            <SectionTitle icon={<Brain size={18} />} title="Thinking time" hint="Answer-time profile" />
                            <LazySection loading={loadingAnalytics} loaderLabel="Bucketing response times" skeletonHeight={300}>
                                <ThinkingChart games={games} />
                            </LazySection>
                        </Card>
                    </div>
                </section>

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
                                            {mode.multiplier} points
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-extrabold text-banana-800">{mode.label}</h3>
                                    <p className="text-xs font-bold uppercase tracking-wide text-banana-500">
                                        {mode.time} per puzzle
                                    </p>
                                    <p className="mt-1 text-sm text-banana-700">{mode.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Achievements preview */}
                    <Card className="lg:col-span-2 !p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Award className="text-banana-500" size={22} />
                                <div>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">Achievements</h2>
                                    <p className="text-xs text-banana-600">
                                        {summary ? `${summary.unlocked} of ${summary.total} unlocked` : 'Loading your badges…'}
                                    </p>
                                </div>
                            </div>
                            <Link to="/achievements" className="flex items-center gap-1 text-sm font-bold text-banana-700 hover:underline">
                                View all <ChevronRight size={16} />
                            </Link>
                        </div>

                        {!achievements && (
                            <div className="py-8 text-center text-sm font-semibold text-banana-600">Loading achievements…</div>
                        )}

                        {achievements && achievements.length === 0 && (
                            <p className="py-6 text-center text-sm text-banana-600">Play a round to start earning badges.</p>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            {preview.map((achievement) => {
                                const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`rounded-2xl border-2 p-3 ${
                                            achievement.unlocked ? `${tier.ring} bg-banana-50` : 'border-banana-200 bg-white/60'
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
                                                <p className="line-clamp-2 text-xs text-banana-600">{achievement.description}</p>
                                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-banana-200">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            achievement.unlocked
                                                                ? 'bg-gradient-to-r from-banana-400 to-banana-600'
                                                                : 'bg-banana-300'
                                                        }`}
                                                        style={{ width: `${Math.max(4, achievement.progress)}%` }}
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
                            <h2 className="mb-4 font-display text-xl font-extrabold text-banana-800">Controls</h2>
                            <AudioControls />
                        </Card>

                        <Card className="!p-5">
                            <h2 className="mb-3 font-display text-xl font-extrabold text-banana-800">Account at a glance</h2>
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
                                    <dd className="font-bold text-banana-800">{formatRelative(user.lastLoginAt)}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="flex items-center gap-2 text-banana-600">
                                        <Banana size={15} /> Favourite mode
                                    </dt>
                                    <dd className="font-bold capitalize text-banana-800">{user.favoriteMode || 'classic'}</dd>
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

function SectionTitle({ icon, title, hint }) {
    return (
        <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                <span className="text-banana-500">{icon}</span>
                {title}
            </h2>
            {hint && <p className="hidden text-xs font-semibold text-banana-500 sm:block">{hint}</p>}
        </div>
    );
}

const chartTooltipStyle = { background: '#fffceb', border: '2px solid #ffec85', borderRadius: 12, boxShadow: '0 10px 24px rgba(107,50,0,.12)' };
const chartColors = ['#facc15', '#34d399', '#60a5fa', '#fb7185', '#a78bfa'];

function LazySection({ loading, loaderLabel, skeletonHeight, children }) {
    if (loading) return <div style={{ minHeight: skeletonHeight }} className="flex flex-col items-center justify-center"><div className="w-full animate-pulse rounded-2xl bg-banana-100" style={{ height: skeletonHeight - 35 }} /><p className="mt-3 text-xs font-bold text-banana-500">{loaderLabel}</p></div>;
    return children;
}

function AccuracyChart({ games }) {
    const rows = trendRows(games);
    if (!rows.some((row) => row.games > 0)) return <EmptyState text="No games in this window" />;
    return <ChartFrame label="Score and accuracy over the last 14 days"><AreaChart data={rows}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#facc15" stopOpacity=".5" /><stop offset="95%" stopColor="#facc15" stopOpacity=".02" /></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5d875" /><XAxis dataKey="label" tick={{ fontSize: 12, fill: '#b56000' }} axisLine={false} tickLine={false} /><YAxis yAxisId="score" tick={{ fontSize: 12, fill: '#b56000' }} axisLine={false} tickLine={false} /><YAxis yAxisId="accuracy" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: '#b56000' }} axisLine={false} tickLine={false} /><Tooltip content={<TrendTooltip />} /><Legend wrapperStyle={{ fontSize: 12, color: '#b56000' }} /><Area yAxisId="score" type="monotone" dataKey="score" stroke="#facc15" fill="url(#scoreFill)" name="Score" activeDot={{ r: 5 }} /><Line yAxisId="accuracy" type="monotone" dataKey="accuracy" stroke="#34d399" dot={false} activeDot={{ r: 5 }} name="Accuracy %" /></AreaChart></ChartFrame>;
}

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
    return <div style={chartTooltipStyle} className="min-w-[150px] px-3 py-2 text-sm font-bold text-banana-800">
        <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-banana-500">{label}</p>
        <p className="flex items-center justify-between gap-5"><span className="text-yellow-600">Score</span><span>{Number(values.score || 0)} pts</span></p>
        <p className="flex items-center justify-between gap-5"><span className="text-emerald-600">Accuracy %</span><span>{Number(values.accuracy || 0)}%</span></p>
    </div>;
}

function ModeChart({ games }) {
    const rows = Object.entries(games.reduce((result, game) => { result[game.mode] = (result[game.mode] || 0) + 1; return result; }, {})).map(([mode, count]) => ({ label: mode, games: count }));
    if (!rows.some((row) => row.games > 0)) return <EmptyState text="No completed games by mode yet." />;
    return <ChartFrame label="Games by mode" height={290}><BarChart data={rows}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5d875" /><XAxis dataKey="label" tick={{ fontSize: 12, fill: '#b56000' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#b56000' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartTooltipStyle} /><Bar dataKey="games" radius={[8, 8, 0, 0]}>{rows.map((row, index) => <Cell key={row.label} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ChartFrame>;
}

function ThinkingChart({ games }) {
    const buckets = [{ name: '<5s', value: 0 }, { name: '5–10s', value: 0 }, { name: '10–20s', value: 0 }, { name: '20s+', value: 0 }];
    games.flatMap((game) => game.quizzes || []).forEach((quiz) => { const seconds = (quiz.timeToAnswerMs || 0) / 1000; buckets[seconds < 5 ? 0 : seconds < 10 ? 1 : seconds < 20 ? 2 : 3].value += 1; });
    const rows = buckets.filter((row) => row.value > 0);
    if (!rows.length) return <EmptyState text="Answer a few puzzles to see your time profile." />;
    return <ChartFrame label="Answer-time profile" height={290}><PieChart><Pie data={rows} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>{rows.map((row, index) => <Cell key={row.name} fill={chartColors[index % chartColors.length]} stroke="transparent" />)}</Pie><Tooltip contentStyle={chartTooltipStyle} /><Legend wrapperStyle={{ fontSize: 12, color: '#b56000' }} /></PieChart></ChartFrame>;
}

function ChartFrame({ label, height = 280, children }) {
    return <div role="img" aria-label={label} style={{ height }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function EmptyState({ text }) { return <p className="flex min-h-[220px] items-center justify-center text-sm font-bold text-banana-500">{text}</p>; }

function trendRows(games) {
    return Array.from({ length: 14 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (13 - index));
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        const daily = games.filter((game) => { const value = new Date(game.completedAt || game.startedAt); return value >= date && value < next; });
        const quizzes = daily.reduce((sum, game) => sum + (game.quizCount || game.quizzes?.length || 0), 0);
        const correct = daily.reduce((sum, game) => sum + (game.correctCount || 0), 0);
        return { label: date.toLocaleDateString(undefined, { weekday: 'short' }), score: daily.reduce((sum, game) => sum + (game.totalPoints || 0), 0), accuracy: quizzes ? Math.round((correct / quizzes) * 100) : 0, games: daily.length };
    });
}
