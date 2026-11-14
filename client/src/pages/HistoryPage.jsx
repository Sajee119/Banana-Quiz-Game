import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Eye,
    History as HistoryIcon,
    ImageOff,
    ListChecks,
    RefreshCw,
    SkipForward,
    Trophy,
    XCircle,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
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
            <main className="mx-auto w-full max-w-[1560px] px-4 py-8 md:px-6">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-banana-600">
                            <HistoryIcon size={17} /> Your history
                        </p>
                        <h1 className="font-display text-4xl font-extrabold text-banana-900">
                            Game history
                        </h1>
                        <p className="mt-1 font-semibold text-banana-700">
                            Review every completed game and every banana puzzle you have answered.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={reload} disabled={loading}>
                            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                        <Link to="/play">
                            <Button>Play a game</Button>
                        </Link>
                    </div>
                </header>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1 rounded-2xl bg-banana-100 p-1" role="tablist">
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
                            className="rounded-xl border-2 border-banana-200 bg-white px-3 py-2 font-bold text-banana-800 focus:border-banana-400 focus:outline-none"
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
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3">
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
                            <GameRow key={game?.id || `${game?.startedAt}-${game?.mode}`} game={game} />
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

    return (
        <Card className="!p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-2xl font-extrabold text-banana-900">
                            {modeLabel(game?.mode)}
                        </p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${status.tone}`}>
                            {status.label}
                        </span>
                        {!game?.leaderboardEligible && (
                            <span className="rounded-full bg-banana-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-banana-700">
                                Practice
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-banana-600">
                        {formatDateTime(game?.completedAt || game?.startedAt)} · {total} quiz
                        {total === 1 ? '' : 'z'} · {correct} correct
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-extrabold">
                        <span
                            className={
                                points > 0
                                    ? 'text-emerald-600'
                                    : points < 0
                                      ? 'text-red-600'
                                      : 'text-banana-700'
                            }
                        >
                            {points > 0 ? '+' : ''}
                            {points} points
                        </span>
                        <span className="text-banana-500">{accuracy}% accuracy</span>
                        {game?.quitPenalty ? (
                            <span className="text-red-600">{game.quitPenalty} quit penalty</span>
                        ) : null}
                    </div>
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
                <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-banana-200 bg-banana-100">
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
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${status.tone}`}>
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

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
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
                                className="rounded-xl px-2 py-1 text-xs font-extrabold text-banana-700 hover:bg-banana-100"
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

function EmptyHistory({ tab, filtered }) {
    const isGames = tab === 'games';
    return (
        <Card className="py-16 text-center">
            {isGames ? (
                <Trophy size={48} className="mx-auto mb-3 text-banana-400" />
            ) : (
                <ListChecks size={48} className="mx-auto mb-3 text-banana-400" />
            )}
            <h2 className="font-display text-2xl font-extrabold text-banana-800">
                {filtered
                    ? 'No history for this mode'
                    : isGames
                      ? 'No games yet'
                      : 'No answers yet'}
            </h2>
            <p className="mt-1 text-banana-700">
                {filtered
                    ? 'Try another mode or clear the filter to see everything.'
                    : isGames
                      ? 'Play your first banana quiz and the full game breakdown will appear here.'
                      : 'Answer a puzzle and every response, time and solution will be saved here.'}
            </p>
            {!filtered && (
                <Link to="/play">
                    <Button className="mt-5">Start playing</Button>
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
            <main className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/history"
                        className="flex items-center gap-1.5 text-sm font-bold text-banana-700 hover:underline"
                    >
                        <ArrowLeft size={17} /> Back to history
                    </Link>
                    {entry?.gameId && (
                        <Link
                            to={`/game-overview/${encodeURIComponent(entry.gameId)}`}
                            className="text-sm font-bold text-banana-700 hover:underline"
                        >
                            View full game
                        </Link>
                    )}
                </div>

                <h1 className="font-display text-4xl font-extrabold text-banana-900">
                    Answer details
                </h1>
                <p className="mt-1 mb-6 font-semibold text-banana-700">
                    A closer look at one banana puzzle from your history.
                </p>

                {loading && (
                    <Card className="py-16 text-center font-display text-xl text-banana-700">
                        Loading answer…
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
                        <Card className="!p-5">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
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

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${status.tone}`}>
                                            <StatusIcon size={14} /> {status.label}
                                        </span>
                                        <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-extrabold uppercase text-banana-700">
                                            {modeLabel(entry.mode)}
                                        </span>
                                        {!entry.leaderboardEligible && (
                                            <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-extrabold uppercase text-banana-700">
                                                Practice
                                            </span>
                                        )}
                                    </div>

                                    <dl className="mt-4 grid grid-cols-2 gap-3">
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
                                            value={entry.quizTimeSeconds ? `${entry.quizTimeSeconds}s` : '—'}
                                        />
                                        <Detail
                                            label="Recorded"
                                            value={formatDateTime(entry.completedAt || entry.createdAt)}
                                        />
                                    </dl>
                                </div>
                            </div>
                        </Card>

                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                            <Link to="/play">
                                <Button>Play another game</Button>
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
        <div className="rounded-xl bg-banana-50 px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase tracking-wide text-banana-500">
                {label}
            </dt>
            <dd className="break-words font-display text-lg font-extrabold text-banana-900">
                {value}
            </dd>
        </div>
    );
}
