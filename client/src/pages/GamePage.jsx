import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Delete,
    LogOut,
    RefreshCw,
    SkipForward,
    Sparkles,
    XCircle,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { normalizeModeId } from '../lib/format.js';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const FEEDBACK_MS = 900;
const AUTO_SUBMIT_MS = 900;
const MAX_ANSWER = 1000;
const MAX_DIGITS = 4;
const ALLOWED_TIMES = [10, 15, 20, 30, 45, 60];

const CELEBRATION_COLORS = ['#facc15', '#34d399', '#60a5fa', '#fb7185', '#fb923c', '#a78bfa'];
const CELEBRATION_PIECES = Array.from({ length: 30 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 30;
    const distance = 110 + ((index * 43) % 170);
    return {
        id: index,
        x: Math.round(Math.cos(angle) * distance),
        y: Math.round(Math.sin(angle) * distance - 40),
        rotate: ((index * 67) % 360) - 180,
        delay: (index % 6) * 0.025,
        color: CELEBRATION_COLORS[index % CELEBRATION_COLORS.length],
        emoji: index % 5 === 0 ? '🍌' : index % 7 === 0 ? '✨' : null,
        size: 7 + ((index * 11) % 9),
    };
});

function createGameId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `game-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStoredConfig() {
    const raw = sessionStorage.getItem('banana-game-config');
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const rawTime = Number(parsed.time);
        return {
            mode: normalizeModeId(parsed.mode),
            quizCount: Math.max(1, Math.min(30, Number(parsed.quizCount) || 10)),
            time: ALLOWED_TIMES.includes(rawTime) ? rawTime : 30,
            leaderboardEligible: parsed.leaderboardEligible !== false,
        };
    } catch {
        return null;
    }
}

export default function GamePage() {
    const navigate = useNavigate();
    const { setStats, user } = useAuth();
    const preferences = user?.preferences || {};
    const autoSubmit = preferences.autoSubmit !== false;
    const celebrations = preferences.celebrations !== false;
    const showKeyboardHints = preferences.showKeyboardHints !== false;
    const showTimer = preferences.showTimer !== false;
    const celebrate = celebrations && !preferences.reducedMotion;

    const [config, setConfig] = useState(null);
    const [session, setSession] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [seconds, setSeconds] = useState(0);
    const [entry, setEntry] = useState('');
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState('');
    const [startError, setStartError] = useState('');
    const deadline = useRef(0);
    const busyRef = useRef(false);
    const finishedRef = useRef(false);
    const feedbackTimer = useRef(0);
    const autoSubmitTimer = useRef(0);

    usePageTitle('Playing');

    useEffect(() => {
        const stored = readStoredConfig();
        if (!stored) {
            sessionStorage.removeItem('banana-game-config');
            navigate('/play', { replace: true });
            return undefined;
        }

        setConfig(stored);
        window.history.pushState(null, '', window.location.href);
        const blockBack = () => window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', blockBack);
        return () => window.removeEventListener('popstate', blockBack);
    }, [navigate]);

    useEffect(
        () => () => {
            window.clearTimeout(feedbackTimer.current);
            window.clearTimeout(autoSubmitTimer.current);
        },
        []
    );

    const finishGame = useCallback(() => {
        const gameId = sessionStorage.getItem('banana-game-id');
        sessionStorage.removeItem('banana-game-config');
        sessionStorage.removeItem('banana-game-id');
        navigate(gameId ? `/game-overview/${encodeURIComponent(gameId)}` : '/history', {
            replace: true,
        });
    }, [navigate]);

    const startQuiz = useCallback(async () => {
        if (!config || feedback || finishedRef.current) return;
        if (answers.length >= config.quizCount || busyRef.current) return;

        busyRef.current = true;
        setBusy(true);
        setError('');
        setStartError('');

        try {
            const gameId = sessionStorage.getItem('banana-game-id') || createGameId();
            sessionStorage.setItem('banana-game-id', gameId);

            const response = await gameApi.start(config.mode, {
                gameId,
                quizCount: config.quizCount,
                quizTimeSeconds: config.time,
                leaderboardEligible: config.leaderboardEligible,
            });

            const data = response?.data;
            if (!data?.sessionId || !data?.imageUrl) {
                throw new Error('The server did not return a quiz.');
            }

            const remaining = Number(data.remainingMs) > 0 ? Number(data.remainingMs) : config.time * 1000;
            setSession({ ...data, startedAt: new Date().toISOString() });
            deadline.current = Date.now() + remaining;
            setSeconds(Math.ceil(remaining / 1000));
            setEntry('');
        } catch (err) {
            setStartError(err.friendlyMessage || err.message || 'Could not load the next quiz.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, [answers.length, config, feedback]);

    useEffect(() => {
        if (!config || session || feedback || startError || finishedRef.current) return;
        if (answers.length >= config.quizCount) return;
        startQuiz();
    }, [answers.length, config, feedback, session, startError, startQuiz]);

    const record = useCallback(
        (result, { timedOut = false, skipped = false } = {}) => {
            const item = {
                quiz: answers.length + 1,
                quizImage: session?.imageUrl,
                startedAt: session?.startedAt,
                completedAt: new Date().toISOString(),
                responseTimeMs:
                    result?.answerMs ?? result?.timeToAnswerMs ?? (config?.time || 0) * 1000,
                response: result?.playerAnswer ?? null,
                correctAnswer: result?.solution ?? null,
                isCorrect: Boolean(result?.isCorrect),
                timedOut,
                skipped,
                points: Number(result?.pointsAwarded) || 0,
                leaderboardEligible: config?.leaderboardEligible !== false,
            };

            const next = [...answers, item];
            const total = config?.quizCount ?? next.length;

            setAnswers(next);
            setSession(null);
            setEntry('');
            setFeedback({ ...result, timedOut, skipped });
            if (result?.stats) setStats(result.stats);

            window.clearTimeout(feedbackTimer.current);
            feedbackTimer.current = window.setTimeout(() => {
                setFeedback(null);
                if (next.length >= total) {
                    finishedRef.current = true;
                    finishGame();
                }
            }, FEEDBACK_MS);
        },
        [answers, config, finishGame, session, setStats]
    );

    const submit = useCallback(
        async (timedOut = false) => {
            if (!session || busyRef.current || feedback) return;

            if (!timedOut) {
                if (!entry) {
                    setError('Enter a number before submitting.');
                    return;
                }
                const value = Number(entry);
                if (!Number.isInteger(value) || value < 0 || value > MAX_ANSWER) {
                    setError(`Enter a whole number between 0 and ${MAX_ANSWER}.`);
                    return;
                }
            }

            busyRef.current = true;
            setBusy(true);
            setError('');

            try {
                const response = timedOut
                    ? await gameApi.expire(session.sessionId)
                    : await gameApi.answer(session.sessionId, Number(entry));
                record(response?.data || {}, { timedOut });
            } catch (err) {
                const payload = err.response?.data;

                if (payload?.timedOut) {
                    record(payload, { timedOut: true });
                    return;
                }

                // The server clock is slightly behind ours. Re-sync the timer
                // instead of recording a fake timeout.
                if (
                    timedOut &&
                    err.response?.status === 409 &&
                    Number(payload?.remainingMs) > 0
                ) {
                    deadline.current = Date.now() + Number(payload.remainingMs);
                    setSeconds(Math.ceil(Number(payload.remainingMs) / 1000));
                    return;
                }

                setError(err.friendlyMessage || 'Could not submit that answer.');
            } finally {
                busyRef.current = false;
                setBusy(false);
            }
        },
        [entry, feedback, record, session]
    );

    // Auto-submit: wait for a short pause after the last digit. Enter still
    // submits immediately, and turning the preference off restores the
    // Submit answer button.
    useEffect(() => {
        if (!autoSubmit || !session || feedback || !entry) return undefined;

        window.clearTimeout(autoSubmitTimer.current);
        autoSubmitTimer.current = window.setTimeout(() => submit(false), AUTO_SUBMIT_MS);
        return () => window.clearTimeout(autoSubmitTimer.current);
    }, [autoSubmit, entry, feedback, session, submit]);

    useEffect(() => {
        if (!session || feedback) return undefined;

        const tick = () => {
            const left = Math.max(0, deadline.current - Date.now());
            setSeconds(Math.ceil(left / 1000));
            if (left <= 0) submit(true);
        };

        tick();
        const timer = window.setInterval(tick, 200);
        return () => window.clearInterval(timer);
    }, [feedback, session, submit]);

    const appendDigit = useCallback(
        (digit) => {
            if (busyRef.current || feedback) return;
            setError('');
            setEntry((prev) => {
                if (prev === '0') return String(digit);
                if (prev.length >= MAX_DIGITS) return prev;
                return `${prev}${digit}`;
            });
        },
        [feedback]
    );

    const backspace = useCallback(() => {
        if (busyRef.current || feedback) return;
        setError('');
        setEntry((prev) => prev.slice(0, -1));
    }, [feedback]);

    const clearEntry = useCallback(() => {
        if (busyRef.current || feedback) return;
        setError('');
        setEntry('');
    }, [feedback]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (!session || feedback) return;

            if (/^[0-9]$/.test(event.key)) {
                event.preventDefault();
                appendDigit(event.key);
            } else if (event.key === 'Backspace') {
                event.preventDefault();
                backspace();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                submit(false);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                clearEntry();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [appendDigit, backspace, clearEntry, feedback, session, submit]);

    const skip = async () => {
        if (!session || busyRef.current || feedback) return;
        busyRef.current = true;
        setBusy(true);
        setError('');

        try {
            const response = await gameApi.skip(session.sessionId);
            record(response?.data || {}, { skipped: true });
        } catch (err) {
            setError(err.friendlyMessage || 'Could not skip this quiz.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const quit = async () => {
        if (busyRef.current || feedback) return;
        busyRef.current = true;
        setBusy(true);
        setError('');

        const gameId = sessionStorage.getItem('banana-game-id');

        try {
            if (session?.sessionId) {
                try {
                    await gameApi.skip(session.sessionId);
                } catch (err) {
                    const status = err.response?.status;
                    if (status !== 409 && status !== 410) throw err;
                }
            }

            if (gameId) {
                try {
                    const response = await gameApi.quit(gameId);
                    if (response?.data?.stats) setStats(response.data.stats);
                } catch (err) {
                    if (err.response?.status !== 404) throw err;
                }
            }

            finishedRef.current = true;
            window.clearTimeout(feedbackTimer.current);
            sessionStorage.removeItem('banana-game-config');
            sessionStorage.removeItem('banana-game-id');
            navigate(gameId ? `/game-overview/${encodeURIComponent(gameId)}` : '/history', {
                replace: true,
            });
        } catch (err) {
            setError(err.friendlyMessage || 'Could not quit this game.');
            busyRef.current = false;
            setBusy(false);
        }
    };

    if (!config) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <BananaLogo size={90} className="animate-float" />
            </div>
        );
    }

    if (!session && !feedback) {
        if (startError) {
            return (
                <div className="min-h-screen bg-banana-50">
                    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
                        <Card className="w-full !p-8">
                            <XCircle size={52} className="mx-auto mb-3 text-red-400" />
                            <h1 className="font-display text-3xl font-extrabold text-banana-900">
                                Could not load the next quiz
                            </h1>
                            <p className="mt-2 font-semibold text-red-700">{startError}</p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Button onClick={startQuiz} disabled={busy}>
                                    <RefreshCw size={18} className={busy ? 'animate-spin' : ''} />
                                    Try again
                                </Button>
                                <Button variant="secondary" onClick={quit} disabled={busy}>
                                    <ArrowLeft size={18} /> Quit game
                                </Button>
                            </div>
                        </Card>
                    </main>
                </div>
            );
        }

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-banana-50">
                <BananaLogo size={90} className="animate-float" />
                <p className="font-display text-lg font-extrabold text-banana-700">
                    Loading the next quiz…
                </p>
            </div>
        );
    }

    const quizNumber = feedback
        ? Math.min(answers.length, config.quizCount)
        : Math.min(answers.length + 1, config.quizCount);
    const progress = session
        ? Math.max(0, Math.min(100, (seconds / Math.max(1, config.time)) * 100))
        : 0;
    const entryValue = entry || '—';

    return (
        <div className="min-h-screen bg-banana-50">
            {celebrate && feedback?.isCorrect && (
                <CelebrationBurst key={`celebration-${answers.length}`} />
            )}
            <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 md:px-8">
                <header className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="font-extrabold uppercase tracking-widest text-banana-600">
                            Full game
                        </p>
                        <h1 className="font-display text-3xl font-extrabold text-banana-900">
                            Quiz {quizNumber} of {config.quizCount}
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {!showTimer && (
                            <Button
                                variant="secondary"
                                className="!px-4 !py-2 !text-sm"
                                onClick={skip}
                                disabled={busy || Boolean(feedback)}
                            >
                                <SkipForward size={16} /> Skip
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={quit}
                            disabled={busy || Boolean(feedback)}
                        >
                            <LogOut size={18} /> Quit game
                        </Button>
                    </div>
                </header>

                {showTimer && (
                    <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-banana-200 bg-white/80 px-4 py-3">
                        <span className="font-bold text-banana-700">{seconds}s remaining</span>
                        <div className="mx-4 h-3 flex-1 overflow-hidden rounded-full bg-banana-200">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    progress < 25 ? 'bg-red-500' : 'bg-banana-500'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            className="!px-4 !py-2 !text-sm"
                            onClick={skip}
                            disabled={busy || Boolean(feedback)}
                        >
                            <SkipForward size={16} /> Skip
                        </Button>
                    </div>
                )}

                <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <Card className="flex min-h-[520px] items-center justify-center !p-5 md:!p-10">
                        {session && (
                            <img
                                src={session.imageUrl}
                                alt="Calculate the banana value in this puzzle"
                                className="max-h-[560px] max-w-full rounded-2xl border-4 border-banana-300 object-contain shadow-game-sm"
                            />
                        )}
                        {feedback && (
                            <ResultFeedback result={feedback} celebrate={celebrate} />
                        )}
                    </Card>

                    <Card className="flex flex-col justify-center !p-5 md:!p-7">
                        <div className="mb-4 text-center">
                            <p className="text-sm font-extrabold uppercase tracking-widest text-banana-600">
                                Your answer
                            </p>
                            <p className="mt-1 flex items-center justify-center gap-2 font-bold text-banana-700">
                                {autoSubmit ? (
                                    <>
                                        <Sparkles size={17} className="text-emerald-500" />
                                        Tap a number — it submits automatically
                                    </>
                                ) : (
                                    <>
                                        <Clock3 size={17} /> Type or tap a number, then submit
                                    </>
                                )}
                            </p>
                        </div>

                        <div
                            className={`mb-4 rounded-2xl border-2 px-4 py-3 text-center font-display text-4xl font-extrabold ${
                                entry
                                    ? 'border-banana-400 bg-banana-50 text-banana-900'
                                    : 'border-banana-200 bg-white text-banana-300'
                            }`}
                            aria-live="polite"
                            aria-label={`Current answer ${entry || 'empty'}`}
                        >
                            {entryValue}
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                            {KEYS.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => appendDigit(key)}
                                    disabled={busy || Boolean(feedback)}
                                    className="rounded-2xl border-2 border-banana-200 bg-banana-100 py-4 font-display text-2xl font-extrabold text-banana-800 shadow-game-sm transition hover:bg-banana-300 active:translate-y-1 disabled:opacity-50"
                                >
                                    {key}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={clearEntry}
                                disabled={busy || Boolean(feedback) || !entry}
                                className="rounded-2xl border-2 border-banana-200 bg-white py-4 font-display text-base font-extrabold text-banana-600 shadow-game-sm transition hover:bg-banana-100 active:translate-y-1 disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => appendDigit(0)}
                                disabled={busy || Boolean(feedback)}
                                className="rounded-2xl border-2 border-banana-200 bg-banana-100 py-4 font-display text-2xl font-extrabold text-banana-800 shadow-game-sm transition hover:bg-banana-300 active:translate-y-1 disabled:opacity-50"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={backspace}
                                disabled={busy || Boolean(feedback) || !entry}
                                aria-label="Delete last digit"
                                className="flex items-center justify-center rounded-2xl border-2 border-banana-200 bg-white py-4 text-banana-600 shadow-game-sm transition hover:bg-banana-100 active:translate-y-1 disabled:opacity-50"
                            >
                                <Delete size={22} />
                            </button>
                        </div>

                        {autoSubmit && session && entry && !feedback && (
                            <div className="mt-4" aria-live="polite">
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-banana-600">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-emerald-500" />
                                        Auto-submitting…
                                    </span>
                                    <span>Enter to send now</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-banana-200">
                                    <div
                                        key={`${session.sessionId}-${entry}`}
                                        className="auto-submit-bar h-full rounded-full bg-emerald-400"
                                    />
                                </div>
                            </div>
                        )}

                        {!autoSubmit && (
                            <Button
                                onClick={() => submit(false)}
                                disabled={busy || Boolean(feedback) || !entry}
                                className="mt-4 w-full !py-4 !text-xl"
                            >
                                <CheckCircle2 size={20} /> Submit answer
                            </Button>
                        )}

                        {showKeyboardHints && (
                            <p className="mt-3 text-center text-xs font-semibold text-banana-500">
                                Keyboard: digits to type, Backspace to delete, Enter to submit.
                            </p>
                        )}

                        {error && (
                            <p className="mt-3 text-center font-bold text-red-600" role="alert">
                                {error}
                            </p>
                        )}
                    </Card>
                </div>

                <Card className="mt-5 !p-5">
                    <h2 className="font-display text-2xl font-extrabold text-banana-800">
                        How scoring works
                    </h2>
                    <div className="mt-3 grid gap-3 text-sm font-semibold text-banana-700 sm:grid-cols-3">
                        <div className="rounded-2xl bg-banana-100 p-3">
                            <strong className="text-banana-900">Quick response:</strong> a correct
                            answer starts at 50 points, with speed and streak bonuses added when
                            earned.
                        </div>
                        <div className="rounded-2xl bg-banana-100 p-3">
                            <strong className="text-banana-900">Keep your streak:</strong> each
                            continued correct answer can add 5 points to your run.
                        </div>
                        <div className="rounded-2xl bg-banana-100 p-3">
                            <strong className="text-banana-900">No time-out points:</strong> wrong,
                            skipped and timed-out quizzes earn 0 points; custom scores stay off the
                            leaderboard.
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function ResultFeedback({ result, celebrate = false }) {
    const correct = Boolean(result.isCorrect);
    const timedOut = Boolean(result.timedOut);
    const skipped = Boolean(result.skipped);

    return (
        <div
            className={`w-full max-w-md rounded-3xl border-4 p-8 text-center ${
                correct
                    ? `border-emerald-300 bg-emerald-50 ${celebrate ? 'animate-pop' : ''}`
                    : timedOut
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-red-300 bg-red-50'
            }`}
        >
            {correct ? (
                <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
            ) : (
                <XCircle
                    size={64}
                    className={`mx-auto ${timedOut ? 'text-orange-500' : 'text-red-500'}`}
                />
            )}
            <h2
                className={`mt-4 font-display text-4xl font-extrabold ${
                    correct ? 'text-emerald-700' : timedOut ? 'text-orange-700' : 'text-red-700'
                }`}
            >
                {correct ? 'Correct!' : timedOut ? 'Time out' : skipped ? 'Skipped' : 'Wrong answer'}
            </h2>
            <p className="mt-3 font-display text-3xl font-extrabold text-banana-900">
                {Number(result.pointsAwarded) > 0 ? `+${result.pointsAwarded}` : '0'} points
            </p>
            {result.solution != null && (
                <p className="mt-2 font-bold text-banana-700">Correct answer: {result.solution}</p>
            )}
        </div>
    );
}

function CelebrationBurst() {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
            aria-hidden="true"
        >
            <div className="absolute left-1/2 top-1/2">
                {CELEBRATION_PIECES.map((piece) => (
                    <motion.span
                        key={piece.id}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                        animate={{
                            x: piece.x,
                            y: piece.y,
                            opacity: 0,
                            scale: 1,
                            rotate: piece.rotate,
                        }}
                        transition={{ duration: 0.75, delay: piece.delay, ease: 'easeOut' }}
                        className="absolute block"
                        style={{ fontSize: 22, lineHeight: 1 }}
                    >
                        {piece.emoji ? (
                            piece.emoji
                        ) : (
                            <span
                                className="block rounded-sm"
                                style={{
                                    width: piece.size,
                                    height: piece.size,
                                    background: piece.color,
                                }}
                            />
                        )}
                    </motion.span>
                ))}
            </div>
        </div>
    );
}
