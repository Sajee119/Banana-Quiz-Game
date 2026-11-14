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
    RefreshCw,
    SkipForward,
    Trophy,
    XCircle,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import StatCard from '../components/StatCard.jsx';
import QuizPerformanceChart from '../components/QuizPerformanceChart.jsx';
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

    if (loading) {
        return (
            <div className="min-h-screen">
                <AppHeader />
                <main className="mx-auto w-full max-w-[1560px] px-4 py-8 md:px-6">
                    <div className="mb-6 h-24 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60" />
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className="h-24 animate-pulse rounded-2xl border-2 border-banana-200 bg-white/60"
                            />
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, index) => (
                            <div
                                key={index}
                                className="h-32 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60"
                            />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen">
                <AppHeader />
                <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
                    <XCircle size={52} className="mx-auto mb-3 text-red-400" />
                    <h1 className="font-display text-3xl font-extrabold text-banana-900">
                        Could not load this game
                    </h1>
                    <p className="mt-2 font-semibold text-red-700">{error}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Button onClick={reload}>
                            <RefreshCw size={18} /> Try again
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/history')}>
                            <ArrowLeft size={18} /> Back to history
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen">
                <AppHeader />
                <main className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
                    <Trophy size={52} className="mx-auto mb-3 text-banana-400" />
                    <h1 className="font-display text-3xl font-extrabold text-banana-900">
                        Game not found
                    </h1>
                    <p className="mt-2 font-semibold text-banana-700">
                        This game may belong to another account, or it may have been removed.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link to="/history">
                            <Button variant="secondary">
                                <ArrowLeft size={18} /> Back to history
                            </Button>
                        </Link>
                        <Link to="/play">
                            <Button>Play a game</Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const status = gameStatus(game.status);

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full max-w-[1560px] px-4 py-8 md:px-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-extrabold uppercase tracking-widest text-banana-600">
                            Game analysis
                        </p>
                        <h1 className="font-display text-4xl font-extrabold text-banana-900">
                            {modeInfo.label}
                        </h1>
                        <p className="mt-1 font-semibold text-banana-700">
                            {formatDateTime(game.completedAt || game.startedAt)} ·{' '}
                            {game.leaderboardEligible ? 'Leaderboard game' : 'Practice only'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => navigate('/history')}>
                            <ArrowLeft size={18} /> Game history
                        </Button>
                        <Link to="/play">
                            <Button>Play again</Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${status.tone}`}>
                        {status.label}
                    </span>
                    <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-extrabold uppercase text-banana-700">
                        {Number(game.time) ? `${game.time}s per quiz` : `${modeInfo.time} per quiz`}
                    </span>
                    {!game.leaderboardEligible && (
                        <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-extrabold uppercase text-banana-700">
                            Not ranked
                        </span>
                    )}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                    <StatCard
                        icon={<Trophy size={18} />}
                        label="Points"
                        value={`${total > 0 ? '+' : ''}${total}`}
                        color={
                            total < 0
                                ? 'from-red-300 to-red-500'
                                : 'from-banana-300 to-banana-500'
                        }
                    />
                    <StatCard
                        icon={<CheckCircle2 size={18} />}
                        label="Correct"
                        value={`${correct}/${quizTotal}`}
                        color="from-emerald-300 to-emerald-500"
                    />
                    <StatCard
                        icon={<Clock3 size={18} />}
                        label="Accuracy"
                        value={`${accuracy}%`}
                        color="from-sky-300 to-sky-500"
                    />
                    <StatCard
                        icon={<SkipForward size={18} />}
                        label="Answered"
                        value={`${answered}/${quizTotal}`}
                        color="from-violet-300 to-violet-500"
                    />
                    <StatCard
                        icon={<Trophy size={18} />}
                        label="Ranked"
                        value={game.leaderboardEligible ? 'Yes' : 'No'}
                        color="from-pink-300 to-pink-500"
                    />
                </div>

                {game.quitPenalty ? (
                    <p className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        This game was quit early and a {game.quitPenalty} point penalty was applied.
                    </p>
                ) : null}

                {quizzes.length === 0 ? (
                    <Card className="py-14 text-center">
                        <Clock3 size={44} className="mx-auto mb-3 text-banana-400" />
                        <h2 className="font-display text-2xl font-extrabold text-banana-800">
                            No quizzes recorded
                        </h2>
                        <p className="mt-1 text-banana-700">
                            This game was started but no answers were saved yet.
                        </p>
                    </Card>
                ) : (
                    <>
                        <QuizPerformanceChart
                            quizzes={quizzes}
                            timeLimit={game.time}
                            className="mb-6"
                        />
                        <div className="space-y-4">
                            {quizzes.map((quiz, index) => (
                                <QuizCard
                                    key={quiz?.id || `${game.id}-${index}`}
                                    quiz={quiz}
                                    index={index}
                                    defaultTime={Number(game?.time) || 0}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function gameStatus(value) {
    if (value === 'quit') return { label: 'Quit early', tone: 'bg-red-100 text-red-700' };
    if (value === 'completed') return { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' };
    return { label: 'In progress', tone: 'bg-amber-100 text-amber-800' };
}

function quizStatus(quiz) {
    if (quiz?.status === 'expired') {
        return { label: 'Timed out', tone: 'bg-orange-100 text-orange-700', icon: Clock3 };
    }
    if (quiz?.playerAnswer == null) {
        return { label: 'Skipped', tone: 'bg-banana-100 text-banana-700', icon: SkipForward };
    }
    if (quiz?.isCorrect) {
        return { label: 'Correct', tone: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    }
    return { label: 'Incorrect', tone: 'bg-red-100 text-red-700', icon: XCircle };
}

function QuizCard({ quiz, index, defaultTime = 0 }) {
    const [showDetails, setShowDetails] = useState(false);
    const { play } = useSound();
    const points = Number(quiz?.pointsAwarded) || 0;
    const status = quizStatus(quiz);
    const StatusIcon = status.icon;
    const positive = quiz?.isCorrect && points > 0;
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
        <Card className="!p-4">
            <div className="grid gap-4 md:grid-cols-[128px_1fr_auto] md:items-center">
                <div className="h-24 w-full max-w-[128px] overflow-hidden rounded-xl border-2 border-banana-300 bg-banana-100 md:w-32">
                    {quiz?.imageUrl ? (
                        <img
                            src={quiz.imageUrl}
                            alt={`Quiz ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-banana-400">
                            <ImageOff size={28} />
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-extrabold text-banana-900">
                            Quiz {index + 1}
                        </h2>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase ${status.tone}`}>
                            <StatusIcon size={12} /> {status.label}
                        </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-banana-600">
                        Attempted {formatDateTime(quiz?.completedAt || quiz?.createdAt)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-banana-700">
                        <Clock3 size={14} className="mr-1 inline" /> Response time: {responseTime}
                    </p>
                    <p className="text-sm font-bold text-banana-700">
                        Your answer:{' '}
                        <span className="text-banana-900">
                            {quiz?.playerAnswer == null ? '—' : quiz.playerAnswer}
                        </span>{' '}
                        · Correct answer:{' '}
                        <span className="text-banana-900">{quiz?.solution ?? '—'}</span>
                    </p>
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center md:flex-col md:items-end">
                    <div
                        className={`rounded-2xl px-4 py-3 text-center font-display text-xl font-extrabold ${
                            positive
                                ? 'bg-emerald-100 text-emerald-700'
                                : quiz?.status === 'expired'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {points > 0 ? '+' : ''}
                        {points} points
                        <p className="text-xs font-bold">
                            {quiz?.status === 'expired'
                                ? 'No points · timed out'
                                : quiz?.playerAnswer == null
                                  ? 'No points · skipped'
                                  : positive
                                    ? 'Correct answer'
                                    : 'No points'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={toggleDetails}
                        aria-expanded={showDetails}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-banana-200 bg-white px-3 py-1.5 text-xs font-extrabold text-banana-700 transition hover:border-banana-300 hover:bg-banana-50 active:translate-y-0.5"
                    >
                        <ListChecks size={14} />
                        {showDetails ? 'Hide details' : 'Answer details'}
                        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 border-t-2 border-banana-200 pt-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h3 className="font-display text-lg font-extrabold text-banana-900">
                                Answer details
                            </h3>
                            <p className="text-xs font-semibold text-banana-600">
                                A closer look at one banana puzzle from your history.
                            </p>
                        </div>
                        {quiz?.id && (
                            <Link
                                to={`/history/${encodeURIComponent(quiz.id)}`}
                                className="rounded-xl bg-banana-100 px-2.5 py-1 text-xs font-extrabold text-banana-800 hover:bg-banana-200"
                            >
                                Open full answer page
                            </Link>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                        <div className="mx-auto h-48 w-full max-w-[240px] flex-shrink-0 overflow-hidden rounded-2xl border-4 border-banana-300 bg-banana-100">
                            {quiz?.imageUrl ? (
                                <img
                                    src={quiz.imageUrl}
                                    alt={`Quiz ${index + 1} answer detail`}
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-banana-400">
                                    <ImageOff size={40} />
                                </div>
                            )}
                        </div>

                        <dl className="grid grid-cols-2 gap-3">
                            <Detail
                                label="Your answer"
                                value={quiz?.playerAnswer == null ? '—' : quiz.playerAnswer}
                            />
                            <Detail label="Correct answer" value={quiz?.solution ?? '—'} />
                            <Detail
                                label="Points"
                                value={`${points > 0 ? '+' : ''}${points}`}
                            />
                            <Detail label="Response time" value={responseTime} />
                            <Detail
                                label="Time limit"
                                value={timeLimit ? `${timeLimit}s` : '—'}
                            />
                            <Detail
                                label="Recorded"
                                value={formatDateTime(quiz?.completedAt || quiz?.createdAt)}
                            />
                        </dl>
                    </div>
                </div>
            )}
        </Card>
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
