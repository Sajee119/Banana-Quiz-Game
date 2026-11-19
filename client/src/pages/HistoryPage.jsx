import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Eye,
    History as HistoryIcon,
    ImageOff,
    ListChecks,
    Play,
    RefreshCw,
    SkipForward,
    Trophy,
    XCircle,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import {
    MODE_INFO,
    MODE_LIST,
    formatDateTime,
    formatDuration,
    normalizeModeId,
} from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const TABS = [
    { id: 'games', label: 'Games', icon: Trophy },
    { id: 'answers', label: 'Answers', icon: ListChecks },
];

function toArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function modeLabel(modeId) {
    return MODE_INFO[normalizeModeId(modeId)]?.label || 'Standard · Easy';
}

function gameStatus(game) {
    if (game?.status === 'quit') return { label: 'Quit early', tone: 'bg-red-100 text-red-700' };
    if (game?.status === 'completed') return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' };
    return { label: 'In progress', tone: 'bg-amber-100 text-amber-800' };
}

function answerStatus(answer) {
    if (answer?.status === 'expired') return { label: 'Timed out', tone: 'bg-orange-100 text-orange-700', icon: Clock3 };
    if (answer?.playerAnswer == null) return { label: 'Skipped', tone: 'bg-banana-100 text-banana-700', icon: SkipForward };
    if (answer?.isCorrect) return { label: 'Correct', tone: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    return { label: 'Incorrect', tone: 'bg-red-100 text-red-700', icon: XCircle };
}

export default function HistoryPage() {
    const { sessionId } = useParams();
    const isDetail = Boolean(sessionId);
    usePageTitle(isDetail ? 'Answer details' : 'Game history');

    const [tab, setTab] = useState('games');
    const [modeFilter, setModeFilter] = useState('all');
    const [games, setGames] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        Promise.allSettled([gameApi.games(100), gameApi.history(100)]).then(
            ([gamesResult, answersResult]) => {
                if (!active) return;

                const problems = [];
                if (gamesResult.status === 'fulfilled') {
                    setGames(toArray(gamesResult.value));
                } else {
                    setGames([]);
                    problems.push(
                        gamesResult.reason?.friendlyMessage ||
                            'Could not load your game history.'
                    );
                }

                if (answersResult.status === 'fulfilled') {
                    setAnswers(toArray(answersResult.value));
                } else {
                    setAnswers([]);
                    problems.push(
                        answersResult.reason?.friendlyMessage ||
                            'Could not load your answer history.'
                    );
                }

                setError(problems.join(' '));
                setLoading(false);
            }
        );

        return () => {
            active = false;
        };
    }, [reloadKey]);

    const filteredGames = useMemo(() => {
        if (modeFilter === 'all') return games;
        return games.filter((game) => normalizeModeId(game?.mode) === modeFilter);
    }, [games, modeFilter]);

    const filteredAnswers = useMemo(() => {
        if (modeFilter === 'all') return answers;
        return answers.filter((answer) => normalizeModeId(answer?.mode) === modeFilter);
    }, [answers, modeFilter]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    if (isDetail) {
        return <HistoryDetail sessionId={sessionId} />;
    }

    const visible = tab === 'games' ? filteredGames : filteredAnswers;

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

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-300 bg-banana-100 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                    <HistoryIcon size={13} /> Your history
                                </p>
                                <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-banana-900 sm:text-5xl">
                                    Game history
                                </h1>
                                <p className="mt-2 text-sm font-semibold leading-relaxed text-banana-800 sm:text-base">
                                    Review every completed game and every banana puzzle you have
                                    answered.
                                </p>

                                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-300 bg-white px-2.5 py-1 text-banana-900 shadow-game-sm">
                                        <Trophy size={12} /> {games.length} games
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-50 px-2.5 py-1 text-banana-800">
                                        <ListChecks size={12} /> {answers.length} answers
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-50 px-2.5 py-1 text-banana-800">
                                        {MODE_LIST.length} modes tracked
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={reload}
                                    disabled={loading}
                                    className="!px-4 !py-2.5 !text-sm"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={loading ? 'animate-spin' : ''}
                                    />
                                    Refresh
                                </Button>
                                <Link to="/play">
                                    <Button className="!px-4 !py-2.5 !text-sm">
                                        <Play size={17} /> Play a game
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Controls */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div
                            className="flex gap-1 rounded-2xl border-2 border-banana-200 bg-banana-100 p-1"
                            role="tablist"
                        >
                            {TABS.map(({ id, label, icon: Icon }) => {
                                const count = id === 'games' ? games.length : answers.length;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === id}
                                        onClick={() => setTab(id)}
                                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-extrabold transition ${
                                            tab === id
                                                ? 'bg-white text-banana-900 shadow-game-sm'
                                                : 'text-banana-600 hover:text-banana-800'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {label}
                                        <span className="rounded-full bg-banana-200 px-1.5 text-[11px] text-banana-800">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <label className="flex items-center gap-2 text-sm font-bold text-banana-700">
                            <span className="hidden sm:inline">Mode</span>
                            <select
                                value={modeFilter}
                                onChange={(event) => setModeFilter(event.target.value)}
                                className="rounded-2xl border-2 border-banana-300 bg-white px-3 py-2 font-bold text-banana-800 shadow-game-sm focus:border-banana-400 focus:outline-none"
                            >
                                <option value="all">All modes</option>
                                {MODE_LIST.map((mode) => (
                                    <option key={mode.id} value={mode.id}>
                                        {mode.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {error && (
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
                            <p className="font-bold text-red-700">{error}</p>
                            <Button variant="secondary" className="!py-2 !text-sm" onClick={reload}>
                                Try again
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-3" aria-label="Loading history">
                            {[...Array(4)].map((_, index) => (
                                <div
                                    key={index}
                                    className="h-28 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60"
                                />
                            ))}
                        </div>
                    )}

                    {!loading && !error && visible.length === 0 && (
                        <EmptyHistory tab={tab} filtered={modeFilter !== 'all'} />
                    )}

                    {!loading && tab === 'games' && filteredGames.length > 0 && (
                        <div className="space-y-4">
                            {filteredGames.map((game) => (
                                <GameRow
                                    key={game?.id || `${game?.startedAt}-${game?.mode}`}
                                    game={game}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && tab === 'answers' && filteredAnswers.length > 0 && (
                        <div className="space-y-3">
                            {filteredAnswers.map((answer) => (
                                <AnswerRow
                                    key={answer?.id || `${answer?.completedAt}-${answer?.imageUrl}`}
                                    answer={answer}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

function GameRow({ game }) {
    const quizzes = Array.isArray(game?.quizzes) ? game.quizzes : [];
    const total = Number(game?.quizCount) || quizzes.length || 0;
    const correct = Number.isFinite(Number(game?.correctCount))
        ? Number(game.correctCount)
        : quizzes.filter((quiz) => quiz?.isCorrect).length;
    const points = Number(game?.totalPoints) || 0;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const status = gameStatus(game);
    const pointsTone =
        points > 0 ? 'text-emerald-600' : points < 0 ? 'text-red-600' : 'text-banana-800';

    return (
        <Card className="overflow-hidden !p-0">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-2xl font-extrabold text-banana-900">
                            {modeLabel(game?.mode)}
                        </p>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${status.tone}`}
                        >
                            {status.label}
                        </span>
                        {!game?.leaderboardEligible && (
                            <span className="rounded-full border-2 border-sky-300 bg-sky-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-sky-800">
                                Practice
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-banana-600">
                        {formatDateTime(game?.completedAt || game?.startedAt)} · {total} quiz
                        {total === 1 ? '' : 'z'} · {correct} correct
                    </p>

                    <div className="mt-3 grid max-w-md grid-cols-3 gap-2">
                        <MicroMetric label="Points" value={`${points > 0 ? '+' : ''}${points}`} tone={pointsTone} />
                        <MicroMetric label="Accuracy" value={`${accuracy}%`} />
                        <MicroMetric label="Correct" value={`${correct}/${total}`} />
                    </div>

                    {game?.quitPenalty ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-extrabold text-red-700">
                            <XCircle size={12} /> {game.quitPenalty} point quit penalty
                        </p>
                    ) : null}
                </div>

                <Link
                    to={`/game-overview/${encodeURIComponent(game?.id || '')}`}
                    className="shrink-0"
                >
                    <Button variant="secondary">
                        <Eye size={18} /> View analysis
                    </Button>
                </Link>
            </div>
        </Card>
    );
}

function AnswerRow({ answer }) {
    const status = answerStatus(answer);
    const StatusIcon = status.icon;
    const points = Number(answer?.pointsAwarded) || 0;
    const limit = Number(answer?.quizTimeSeconds) || 0;

    return (
        <Card className="!p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-banana-300 bg-banana-100">
                    {answer?.imageUrl ? (
                        <img
                            src={answer.imageUrl}
                            alt="Banana puzzle"
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-banana-400">
                            <ImageOff size={26} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${status.tone}`}
                        >
                            <StatusIcon size={12} /> {status.label}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-banana-500">
                            {modeLabel(answer?.mode)}
                        </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-banana-700">
                        Your answer:{' '}
                        <span className="text-banana-900">
                            {answer?.playerAnswer == null ? '—' : answer.playerAnswer}
                        </span>{' '}
                        · Correct answer:{' '}
                        <span className="text-banana-900">{answer?.solution ?? '—'}</span>
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-banana-500">
                        {formatDateTime(answer?.completedAt || answer?.createdAt)}
                        {limit ? ` · ${limit}s limit` : ''}
                        {answer?.timeToAnswerMs != null
                            ? ` · answered in ${formatDuration(answer.timeToAnswerMs)}`
                            : ''}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span
                        className={`font-display text-xl font-extrabold ${
                            points > 0 ? 'text-emerald-600' : 'text-banana-500'
                        }`}
                    >
                        {points > 0 ? '+' : ''}
                        {points} pts
                    </span>
                    <div className="flex gap-2">
                        {answer?.gameId && (
                            <Link
                                to={`/game-overview/${encodeURIComponent(answer.gameId)}`}
                                className="rounded-xl border-2 border-banana-200 bg-white px-2.5 py-1 text-xs font-extrabold text-banana-700 hover:bg-banana-50"
                            >
                                Game
                            </Link>
                        )}
                        <Link
                            to={`/history/${encodeURIComponent(answer?.id || '')}`}
                            className="rounded-xl bg-banana-100 px-2.5 py-1 text-xs font-extrabold text-banana-800 hover:bg-banana-200"
                        >
                            Details
                        </Link>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function MicroMetric({ label, value, tone = 'text-banana-800' }) {
    return (
        <div className="rounded-xl border-2 border-banana-100 bg-banana-50/70 px-2.5 py-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-wide text-banana-500">
                {label}
            </p>
            <p className={`font-display text-base font-extrabold leading-tight ${tone}`}>{value}</p>
        </div>
    );
}

function EmptyHistory({ tab, filtered }) {
    const isGames = tab === 'games';
    return (
        <Card className="py-14 text-center">
            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-500">
                {isGames ? <Trophy size={32} /> : <ListChecks size={32} />}
            </span>
            <h2 className="font-display text-2xl font-extrabold text-banana-800">
                {filtered
                    ? 'No history for this mode'
                    : isGames
                      ? 'No games yet'
                      : 'No answers yet'}
            </h2>
            <p className="mx-auto mt-1 max-w-lg text-banana-700">
                {filtered
                    ? 'Try another mode or clear the filter to see everything.'
                    : isGames
                      ? 'Play your first banana quiz and the full game breakdown will appear here.'
                      : 'Answer a puzzle and every response, time and solution will be saved here.'}
            </p>
            {!filtered && (
                <Link to="/play">
                    <Button className="mt-5">
                        <Play size={18} /> Start playing
                    </Button>
                </Link>
            )}
        </Card>
    );
}

function HistoryDetail({ sessionId }) {
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        gameApi
            .historyEntry(sessionId)
            .then((payload) => {
                if (!active) return;
                const data = payload?.data ?? payload ?? null;
                setEntry(data);
                if (!data) setError('That answer could not be found.');
            })
            .catch((err) => {
                if (active) {
                    setEntry(null);
                    setError(err.friendlyMessage || 'Could not load this answer.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [sessionId]);

    const status = entry ? answerStatus(entry) : null;
    const StatusIcon = status?.icon;

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/history"
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-3 py-1.5 text-sm font-extrabold text-banana-700 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-50"
                    >
                        <ArrowLeft size={17} /> Back to history
                    </Link>
                    {entry?.gameId && (
                        <Link
                            to={`/game-overview/${encodeURIComponent(entry.gameId)}`}
                            className="text-sm font-extrabold text-banana-700 hover:underline"
                        >
                            View full game
                        </Link>
                    )}
                </div>

                <section className="relative mb-6 overflow-hidden rounded-[1.75rem] border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-5 shadow-game sm:p-7">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[14px] border-banana-300/30"
                    />
                    <div className="relative">
                        <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-300 bg-banana-100 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                            <ListChecks size={13} /> Answer archive
                        </p>
                        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-banana-900">
                            Answer details
                        </h1>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-banana-800">
                            A closer look at one banana puzzle from your history.
                        </p>

                        {entry && (
                            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 uppercase ${status.tone}`}
                                >
                                    <StatusIcon size={12} /> {status.label}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-300 bg-white/80 px-2.5 py-1 text-banana-800">
                                    {modeLabel(entry.mode)}
                                </span>
                                {!entry.leaderboardEligible && (
                                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-sky-300 bg-sky-100 px-2.5 py-1 text-sky-800">
                                        Practice
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {loading && (
                    <Card className="py-16 text-center">
                        <RefreshCw
                            size={30}
                            className="mx-auto mb-3 animate-spin text-banana-400"
                        />
                        <p className="font-display text-xl font-extrabold text-banana-700">
                            Loading answer…
                        </p>
                    </Card>
                )}

                {!loading && error && (
                    <Card className="py-12 text-center">
                        <XCircle size={44} className="mx-auto mb-3 text-red-400" />
                        <p className="font-bold text-red-700">{error}</p>
                        <Link to="/history">
                            <Button variant="secondary" className="mt-5">
                                Back to history
                            </Button>
                        </Link>
                    </Card>
                )}

                {!loading && !error && entry && (
                    <>
                        <Card className="overflow-hidden !p-0">
                            <div className="flex items-center gap-3 border-b-4 border-banana-200 bg-banana-100/70 px-5 py-3.5">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-200 text-banana-700">
                                    <ListChecks size={20} />
                                </span>
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-banana-500">
                                        Puzzle snapshot
                                    </p>
                                    <h2 className="font-display text-xl font-extrabold text-banana-800">
                                        Your answer breakdown
                                    </h2>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
                                <div className="mx-auto h-48 w-full max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border-4 border-banana-300 bg-banana-100">
                                    {entry.imageUrl ? (
                                        <img
                                            src={entry.imageUrl}
                                            alt="Banana puzzle"
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-banana-400">
                                            <ImageOff size={40} />
                                        </div>
                                    )}
                                </div>

                                <dl className="grid flex-1 grid-cols-2 gap-3">
                                    <Detail label="Your answer" value={entry.playerAnswer ?? '—'} />
                                    <Detail label="Correct answer" value={entry.solution ?? '—'} />
                                    <Detail
                                        label="Points"
                                        value={`${Number(entry.pointsAwarded) > 0 ? '+' : ''}${
                                            Number(entry.pointsAwarded) || 0
                                        }`}
                                    />
                                    <Detail
                                        label="Response time"
                                        value={
                                            entry.status === 'expired'
                                                ? 'Timed out'
                                                : entry.timeToAnswerMs != null
                                                  ? formatDuration(entry.timeToAnswerMs)
                                                  : '—'
                                        }
                                    />
                                    <Detail
                                        label="Time limit"
                                        value={
                                            entry.quizTimeSeconds
                                                ? `${entry.quizTimeSeconds}s`
                                                : '—'
                                        }
                                    />
                                    <Detail
                                        label="Recorded"
                                        value={formatDateTime(entry.completedAt || entry.createdAt)}
                                    />
                                </dl>
                            </div>
                        </Card>

                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                            <Link to="/play">
                                <Button>
                                    <Play size={18} /> Play another game
                                </Button>
                            </Link>
                            <Link to="/history">
                                <Button variant="secondary">All history</Button>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="rounded-xl border-2 border-banana-200 bg-banana-50 px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wide text-banana-500">
                {label}
            </dt>
            <dd className="break-words font-display text-lg font-extrabold text-banana-900">
                {value}
            </dd>
        </div>
    );
}
