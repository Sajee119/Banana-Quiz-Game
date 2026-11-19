import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    ImageOff,
    ListChecks,
    Play,
    RefreshCw,
    ShieldCheck,
    SkipForward,
    Trophy,
    XCircle,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import StatCard from '../components/StatCard.jsx';
import { OutcomeBreakdown, QuizPointsChart, ResponseTimeChart, buildQuizRows } from '../components/GameCharts.jsx';
import { formatDateTime, formatDuration, normalizeModeId, MODE_INFO } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useSound } from '../hooks/useSound.js';
import { gameApi } from '../api/client.js';

export default function GameOverviewPage() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [showAll, setShowAll] = useState(false);

    usePageTitle('Game overview');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        gameApi
            .game(gameId)
            .then((data) => {
                if (active) setGame(data || null);
            })
            .catch((err) => {
                if (active) {
                    setGame(null);
                    setError(err.friendlyMessage || 'Could not load game analysis.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [gameId, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const quizzes = useMemo(
        () => (Array.isArray(game?.quizzes) ? game.quizzes : []),
        [game]
    );

    const total = Number.isFinite(Number(game?.totalPoints))
        ? Number(game.totalPoints)
        : quizzes.reduce((sum, quiz) => sum + (Number(quiz?.pointsAwarded) || 0), 0) +
          (Number(game?.quitPenalty) || 0);

    const correct = Number.isFinite(Number(game?.correctCount))
        ? Number(game.correctCount)
        : quizzes.filter((quiz) => quiz?.isCorrect).length;

    const answered = quizzes.filter(
        (quiz) => quiz?.status === 'answered' || quiz?.status === 'expired'
    ).length;
    const quizTotal = Math.max(Number(game?.quizCount) || 0, quizzes.length);
    const accuracy = quizTotal ? Math.round((correct / quizTotal) * 100) : 0;
    const modeInfo = MODE_INFO[normalizeModeId(game?.mode)];
    const rows = useMemo(() => buildQuizRows(quizzes, game?.time), [quizzes, game?.time]);
    const visibleQuizzes = showAll ? quizzes : quizzes.slice(0, 4);

    if (loading) {
        return (
            <div className="min-h-screen">
                <AppHeader />
                <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8" aria-busy="true">
                    <div className="mb-6 h-28 rounded-xl border border-banana-200 bg-white/60" />
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="h-24 rounded-xl border border-banana-200 bg-white/60" />
                        ))}
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[3fr_4fr_2fr]">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="h-64 rounded-xl border border-banana-200 bg-white/60" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="min-h-screen">
                <AppHeader />
                <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
                    <Card className="py-12 text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-banana-100 text-banana-700">
                            <XCircle size={24} />
                        </span>
                        <h1 className="font-display text-2xl text-banana-900">
                            {error ? 'Could not load this game' : 'Game not found'}
                        </h1>
                        <p className="mt-2 text-sm text-banana-800">
                            {error || 'This game may belong to another account, or it may have been removed.'}
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {error && (
                                <Button onClick={reload}>
                                    <RefreshCw size={17} /> Try again
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => navigate('/history')}>
                                <ArrowLeft size={17} /> Game history
                            </Button>
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8">
                                <section className="mb-6 overflow-hidden rounded-[1.75rem] border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-5 shadow-game md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-300 bg-banana-100 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                <Trophy size={12} /> Game analysis
                            </p>
                            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-banana-900 md:text-4xl">
                                {modeInfo.label}
                            </h1>
                            <p className="mt-1 text-sm font-semibold text-banana-800">
                                {formatDateTime(game.completedAt || game.startedAt)} · {game.leaderboardEligible ? 'Ranked game' : 'Practice game'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => navigate('/history')} className="!py-2 !text-sm">
                                <ArrowLeft size={16} /> Game history
                            </Button>
                            <Link to="/play">
                                <Button className="!py-2 !text-sm">
                                    <Play size={16} /> Play again
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                    <StatCard icon={<Trophy size={18} />} label="Points" value={`${total > 0 ? '+' : ''}${total}`} />
                    <StatCard icon={<CheckCircle2 size={18} />} label="Correct" value={`${correct}/${quizTotal}`} />
                    <StatCard icon={<Clock3 size={18} />} label="Accuracy" value={`${accuracy}%`} />
                    <StatCard icon={<SkipForward size={18} />} label="Answered" value={`${answered}/${quizTotal}`} />
                    <StatCard
                        icon={game.leaderboardEligible ? <Trophy size={18} /> : <ShieldCheck size={18} />}
                        label="Ranked"
                        value={game.leaderboardEligible ? 'Yes' : 'No'}
                    />
                </div>

                {game.quitPenalty ? (
                    <p className="mb-5 flex items-start gap-2 rounded-xl border border-banana-200 bg-banana-100 px-4 py-3 text-sm text-banana-900">
                        <XCircle size={17} className="mt-0.5 flex-shrink-0 text-banana-700" />
                        This game was quit early and a {game.quitPenalty} point penalty was applied.
                    </p>
                ) : null}

                {quizzes.length === 0 ? (
                    <Card className="py-14 text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-banana-100 text-banana-700">
                            <Clock3 size={24} />
                        </span>
                        <h2 className="font-display text-xl text-banana-900">No quizzes recorded</h2>
                        <p className="mt-1 text-sm text-banana-800">
                            This game was started but no answers were saved yet.
                        </p>
                    </Card>
                ) : (
                    <div className="grid items-start gap-5 lg:grid-cols-[3fr_4fr_2fr]">
                        <div className="space-y-4">
                            <QuizPointsChart rows={rows} />
                            <ResponseTimeChart rows={rows} />
                            <OutcomeBreakdown rows={rows} />
                        </div>

                        <Card className="!p-4 md:!p-5">
                            <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="flex items-center gap-2 font-display text-xl text-banana-900">
                                    <ListChecks size={18} className="text-banana-700" />
                                    Game results
                                </h2>
                                <span className="text-xs text-banana-800 tabular-nums">
                                    {quizzes.length} recorded
                                </span>
                            </header>
                            <div className="space-y-3">
                                {visibleQuizzes.map((quiz, index) => (
                                    <QuizResult
                                        key={quiz?.id || `${game.id}-${index}`}
                                        quiz={quiz}
                                        index={index}
                                        defaultTime={Number(game?.time) || 0}
                                    />
                                ))}
                            </div>
                            {quizzes.length > 4 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAll((value) => !value)}
                                    aria-expanded={showAll}
                                    className="mt-4 w-full rounded-lg border border-banana-200 px-3 py-2 text-sm font-semibold text-banana-800 transition-colors hover:bg-banana-100"
                                >
                                    {showAll ? 'Show latest four' : `Show all ${quizzes.length} quizzes`}
                                </button>
                            )}
                        </Card>

                        <div className="space-y-4">
                            <Card className="!p-4 md:!p-5">
                                <h2 className="mb-3 font-display text-lg text-banana-900">Summary</h2>
                                <dl className="divide-y divide-banana-200 text-sm">
                                    <SummaryRow label="Mode" value={modeInfo.label} />
                                    <SummaryRow
                                        label="Time per quiz"
                                        value={Number(game.time) ? `${game.time}s` : modeInfo.time}
                                    />
                                    <SummaryRow label="Accuracy" value={`${accuracy}%`} />
                                    <SummaryRow
                                        label="Penalty"
                                        value={game.quitPenalty ? `${game.quitPenalty} pts` : 'None'}
                                    />
                                    <SummaryRow
                                        label="Leaderboard"
                                        value={game.leaderboardEligible ? 'Ranked' : 'Practice'}
                                    />
                                </dl>
                            </Card>

                            <Card className="!p-4 md:!p-5">
                                <h2 className="mb-3 font-display text-lg text-banana-900">Next</h2>
                                <div className="space-y-2 text-sm">
                                    <Link
                                        to="/play"
                                        className="flex items-center justify-between gap-2 rounded-lg border border-banana-200 px-3 py-2 transition-colors hover:bg-banana-100"
                                    >
                                        <span>Play another round</span>
                                        <Play size={15} className="text-banana-700" />
                                    </Link>
                                    <Link
                                        to="/history"
                                        className="flex items-center justify-between gap-2 rounded-lg border border-banana-200 px-3 py-2 transition-colors hover:bg-banana-100"
                                    >
                                        <span>Browse game history</span>
                                        <ArrowLeft size={15} className="text-banana-700" />
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-banana-800">{label}</dt>
            <dd className="text-right font-semibold text-banana-900 tabular-nums">{value}</dd>
        </div>
    );
}

function quizStatus(quiz) {
    if (quiz?.status === 'expired') {
        return { label: 'Timed out', icon: Clock3 };
    }
    if (quiz?.playerAnswer == null) {
        return { label: 'Skipped', icon: SkipForward };
    }
    if (quiz?.isCorrect) {
        return { label: 'Correct', icon: CheckCircle2 };
    }
    return { label: 'Incorrect', icon: XCircle };
}

function QuizResult({ quiz, index, defaultTime = 0 }) {
    const [showDetails, setShowDetails] = useState(false);
    const { play } = useSound();
    const points = Number(quiz?.pointsAwarded) || 0;
    const status = quizStatus(quiz);
    const StatusIcon = status.icon;
    const timeLimit = Number(quiz?.quizTimeSeconds) || defaultTime || 0;
    const responseTime =
        quiz?.status === 'expired'
            ? 'Timed out'
            : quiz?.timeToAnswerMs != null
              ? formatDuration(quiz.timeToAnswerMs)
              : '—';

    const toggleDetails = () => {
        play(showDetails ? 'pop' : 'select');
        setShowDetails((value) => !value);
    };

    return (
        <article className="rounded-lg border border-banana-200">
            <div className="grid gap-3 p-3 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                <div className="h-16 w-full max-w-[96px] overflow-hidden rounded-md bg-banana-100">
                    {quiz?.imageUrl ? (
                        <img
                            src={quiz.imageUrl}
                            alt={`Quiz ${index + 1} puzzle`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-banana-500">
                            <ImageOff size={20} />
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg text-banana-900">Quiz {index + 1}</h3>
                        <span className="inline-flex items-center gap-1 text-xs text-banana-700">
                            <StatusIcon size={13} /> {status.label}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-banana-800 tabular-nums">{responseTime}</p>
                    <p className="text-xs text-banana-800">
                        Your answer {quiz?.playerAnswer == null ? '—' : quiz.playerAnswer} · Correct{' '}
                        {quiz?.solution ?? '—'}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className="font-display text-lg text-banana-900 tabular-nums">
                        {points > 0 ? '+' : ''}
                        {points} pts
                    </span>
                    <button
                        type="button"
                        onClick={toggleDetails}
                        aria-expanded={showDetails}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-banana-700 transition-colors hover:bg-banana-100"
                    >
                        Details
                        {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {showDetails && (
                <div className="border-t border-banana-200 bg-banana-50 p-3">
                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <Detail label="Your answer" value={quiz?.playerAnswer == null ? '—' : quiz.playerAnswer} />
                        <Detail label="Correct answer" value={quiz?.solution ?? '—'} />
                        <Detail label="Points" value={`${points > 0 ? '+' : ''}${points}`} />
                        <Detail label="Response time" value={responseTime} />
                        <Detail label="Time limit" value={timeLimit ? `${timeLimit}s` : '—'} />
                        <Detail label="Recorded" value={formatDateTime(quiz?.completedAt || quiz?.createdAt)} />
                    </dl>
                    {quiz?.id && (
                        <Link
                            to={`/history/${encodeURIComponent(quiz.id)}`}
                            className="mt-3 inline-block text-sm font-semibold text-banana-700 hover:underline"
                        >
                            Open full answer page
                        </Link>
                    )}
                </div>
            )}
        </article>
    );
}

function Detail({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-banana-800">{label}</dt>
            <dd className="mt-0.5 break-words font-semibold text-banana-900 tabular-nums">{value}</dd>
        </div>
    );
}
