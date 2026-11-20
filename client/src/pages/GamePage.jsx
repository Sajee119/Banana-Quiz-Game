import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Delete,
    Flame,
    Gamepad2,
    LogOut,
    RefreshCw,
    SkipForward,
    Sparkles,
    Trophy,
    XCircle,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useSound } from '../hooks/useSound.js';
import { normalizeModeId } from '../lib/format.js';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CONFIG_MODE_LABELS = { easy: 'Easy', hard: 'Hard', custom: 'Custom' };
const FEEDBACK_MS = 900;
const AUTO_SUBMIT_MS = 900;
const MAX_ANSWER = 1000;
const MAX_DIGITS = 4;
const ALLOWED_TIMES = [10, 15, 20, 30, 45, 60];

const CELEBRATION_PIECES = Array.from({ length: 56 }, (_, index) => {
    const left = ((index * 37) % 100) + ((index % 3) * 0.7);
    const size = 6 + (index % 4) * 2;
    const drift = ((index % 7) - 3) * 26;
    const delay = (index % 12) * 0.03;
    const duration = 1.05 + (index % 5) * 0.18;
    const rotate = ((index * 47) % 180) - 90;
    const tone = ['bg-banana-500', 'bg-banana-400', 'bg-banana-300', 'bg-banana-600'][index % 4];
    return { id: index, left, size, drift, delay, duration, rotate, tone };
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
    const { play } = useSound();
    const preferences = user?.preferences || {};
    const autoSubmit = preferences.autoSubmit !== false;
    const celebrations = preferences.celebrations !== false;
    const showKeyboardHints = preferences.showKeyboardHints !== false;
    const showTimer = preferences.showTimer !== false;
    const confirmQuit = preferences.confirmQuit !== false;
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
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const deadline = useRef(0);
    const busyRef = useRef(false);
    const finishedRef = useRef(false);
    const feedbackTimer = useRef(0);
    const autoSubmitTimer = useRef(0);
    const countdownSoundRef = useRef(0);
    const startedSoundRef = useRef(false);

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
            countdownSoundRef.current = 0;
            setEntry('');
            if (!startedSoundRef.current) {
                startedSoundRef.current = true;
                play('gameStart');
            }
        } catch (err) {
            setStartError(err.friendlyMessage || err.message || 'Could not load the next quiz.');
            play('error');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, [answers.length, config, feedback, play]);

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

            if (timedOut) play('expire');
            else if (skipped) play('skip');
            else if (result?.isCorrect) play(result?.streak >= 3 ? 'streak' : 'correct');
            else play('wrong');

            window.clearTimeout(feedbackTimer.current);
            feedbackTimer.current = window.setTimeout(() => {
                setFeedback(null);
                if (next.length >= total) {
                    finishedRef.current = true;
                    play('gameOver');
                    finishGame();
                }
            }, FEEDBACK_MS);
        },
        [answers, config, finishGame, play, session, setStats]
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
            const nextSeconds = Math.ceil(left / 1000);
            setSeconds(nextSeconds);
            if (
                nextSeconds > 0 &&
                nextSeconds <= 5 &&
                countdownSoundRef.current !== nextSeconds
            ) {
                countdownSoundRef.current = nextSeconds;
                play('countdown');
            }
            if (left <= 0) submit(true);
        };

        tick();
        const timer = window.setInterval(tick, 200);
        return () => window.clearInterval(timer);
    }, [feedback, play, session, submit]);

    const appendDigit = useCallback(
        (digit) => {
            if (busyRef.current || feedback) return;
            play('type');
            setError('');
            setEntry((prev) => {
                if (prev === '0') return String(digit);
                if (prev.length >= MAX_DIGITS) return prev;
                return `${prev}${digit}`;
            });
        },
        [feedback, play]
    );

    const backspace = useCallback(() => {
        if (busyRef.current || feedback) return;
        play('pop');
        setError('');
        setEntry((prev) => prev.slice(0, -1));
    }, [feedback, play]);

    const clearEntry = useCallback(() => {
        if (busyRef.current || feedback) return;
        play('pop');
        setError('');
        setEntry('');
    }, [feedback, play]);

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
            play('quit');
            navigate(gameId ? `/game-overview/${encodeURIComponent(gameId)}` : '/history', {
                replace: true,
            });
        } catch (err) {
            play('error');
            setError(err.friendlyMessage || 'Could not quit this game.');
            busyRef.current = false;
            setBusy(false);
        }
    };

    const requestQuit = () => {
        if (busyRef.current || feedback) return;
        if (!confirmQuit) {
            quit();
            return;
        }
        setShowQuitConfirm(true);
    };

    if (!config) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
                <BananaLogo size={64} />
                <p className="font-display text-lg text-banana-800">Preparing your game</p>
            </div>
        );
    }

    const quizNumber = feedback
        ? Math.min(answers.length, config.quizCount)
        : Math.min(answers.length + 1, config.quizCount);
    const progress = session
        ? Math.max(0, Math.min(100, (seconds / Math.max(1, config.time)) * 100))
        : 0;
    const urgent = Boolean(session) && progress < 25;
    const entryValue = entry || '—';
    const score = answers.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
    const correctCount = answers.filter((item) => item.isCorrect).length;
    let currentStreak = 0;
    for (let index = answers.length - 1; index >= 0; index -= 1) {
        if (!answers[index].isCorrect) break;
        currentStreak += 1;
    }

    return (
        <div className="min-h-dvh bg-banana-50">
            {celebrate && feedback?.isCorrect && (
                <CelebrationFlow key={`celebration-${answers.length}`} />
            )}
            <main className="mx-auto flex min-h-dvh w-full flex-col px-4 py-4 sm:px-6 md:py-6">
                {/* Game HUD */}
                <header className="mb-4 rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-white to-amber-50 p-4 shadow-game sm:p-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                <Gamepad2 size={13} />
                                {CONFIG_MODE_LABELS[config.mode] || config.mode} run
                            </p>
                            <h1 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-banana-900 md:text-3xl">
                                Quiz {quizNumber}
                                <span className="text-banana-700"> / {config.quizCount}</span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <HudChip icon={Trophy} label="Score" value={score} />
                            <HudChip
                                icon={CheckCircle2}
                                label="Correct"
                                value={correctCount}
                                className="hidden sm:flex"
                            />
                            <HudChip
                                icon={Flame}
                                label="Streak"
                                value={currentStreak}
                                className="hidden sm:flex"
                            />
                            {!showTimer && (
                                <Button
                                    variant="secondary"
                                    className="!px-3 !py-2 !text-sm"
                                    onClick={skip}
                                    disabled={busy || Boolean(feedback)}
                                >
                                    <SkipForward size={16} /> Skip
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                className="!px-3 !py-2 !text-sm"
                                onClick={requestQuit}
                                disabled={busy || Boolean(feedback)}
                            >
                                <LogOut size={16} /> Quit
                            </Button>
                        </div>
                    </div>

                    <QuizPips answers={answers} total={config.quizCount} />
                </header>

                {/* Timer */}
                {showTimer && (
                    <div className="mb-4 flex items-center gap-4 rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 px-4 py-3 shadow-game-sm">
                        <div
                            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 font-display font-extrabold leading-none tabular-nums shadow-game-sm ${
                                urgent
                                    ? 'border-red-400 bg-red-50 text-red-700 animate-pulse'
                                    : 'border-banana-400 bg-banana-100 text-banana-900'
                            }`}
                        >
                            <span className="text-lg font-extrabold">{session ? seconds : '—'}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-semibold text-banana-800">
                                    {session
                                        ? 'Time left'
                                        : feedback
                                          ? 'Answer locked in'
                                          : 'Get ready'}
                                </span>
                                <span className="text-xs font-semibold text-banana-800 tabular-nums">
                                    {config.time}s per quiz
                                </span>
                            </div>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full border-2 border-banana-200 bg-banana-100">
                                <div
                                    className={`h-full rounded-full transition-all ${urgent ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-banana-400 to-banana-500'}`}
                                    style={{ width: `${session ? progress : 0}%` }}
                                />
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            className="!px-3 !py-2 !text-sm"
                            onClick={skip}
                            disabled={busy || Boolean(feedback) || !session}
                        >
                            <SkipForward size={16} />
                            <span className="hidden sm:inline">Skip</span>
                        </Button>
                    </div>
                )}

                <div className="grid flex-1 gap-4 lg:grid-cols-[3fr_4fr_2fr]">
                    {/* Puzzle stage */}
                    <Card className="relative flex min-h-[360px] items-center justify-center overflow-hidden !p-4 md:!p-6">
                        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                            Puzzle {quizNumber}
                        </span>

                        {startError ? (
                            <div className="relative w-full max-w-md rounded-2xl border-2 border-banana-200 bg-white/90 p-5 text-center shadow-game-sm">
                                <XCircle size={24} className="mx-auto mb-2 text-banana-700" />
                                <h2 className="font-display text-xl font-extrabold text-banana-900">
                                    Could not load the next quiz
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-banana-800">{startError}</p>
                                <div className="mt-5 flex flex-wrap justify-center gap-2">
                                    <Button onClick={startQuiz} disabled={busy}>
                                        <RefreshCw
                                            size={17}
                                            className={busy ? 'animate-spin' : ''}
                                        />
                                        Try again
                                    </Button>
                                    <Button variant="secondary" onClick={quit} disabled={busy}>
                                        <ArrowLeft size={17} /> Quit game
                                    </Button>
                                </div>
                            </div>
                        ) : session ? (
                            <img
                                src={session.imageUrl}
                                alt="Calculate the banana value in this puzzle"
                                className="relative max-h-[calc(100dvh-380px)] max-w-full rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-amber-50 to-white p-3 shadow-game-sm object-contain"
                            />
                        ) : feedback ? (
                            <ResultFeedback result={feedback} celebrate={celebrate} />
                        ) : (
                            <div className="relative flex flex-col items-center gap-3 py-10 text-center">
                                <BananaLogo size={56} />
                                <p className="font-display text-lg font-extrabold text-banana-800">Loading the next quiz</p>
                            </div>
                        )}
                    </Card>

                    {/* Answer pad */}
                    <Card className="flex flex-col justify-center !p-4 md:!p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-banana-800">Your answer</p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-banana-700">
                                    {autoSubmit ? (
                                        <>
                                            <Sparkles size={14} className="flex-shrink-0" />
                                            Tap a number to submit it
                                        </>
                                    ) : (
                                        <>
                                            <Clock3 size={14} className="flex-shrink-0" />
                                            Type or tap, then submit
                                        </>
                                    )}
                                </p>
                            </div>
                            <span className="hidden flex-shrink-0 items-center rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800 tabular-nums sm:inline-flex">
                                {entry.length}/{MAX_DIGITS}
                            </span>
                        </div>

                        <div
                            className={`mb-3 overflow-hidden rounded-2xl border-2 px-4 py-3 text-center font-display text-4xl font-extrabold tabular-nums shadow-game-sm ${
                                entry
                                    ? 'border-banana-400 bg-gradient-to-b from-banana-50 to-white text-banana-900'
                                    : 'border-dashed border-banana-300 bg-white/80 text-banana-300'
                            }`}
                            aria-live="polite"
                            aria-label={`Current answer ${entry || 'empty'}`}
                        >
                            {entryValue}
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {KEYS.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => appendDigit(key)}
                                    disabled={busy || Boolean(feedback)}
                                    className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 py-3 font-display text-2xl font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5 disabled:opacity-50"
                                >
                                    {key}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={clearEntry}
                                disabled={busy || Boolean(feedback) || !entry}
                                className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 py-3 font-display text-base font-bold text-banana-800 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5 disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => appendDigit(0)}
                                disabled={busy || Boolean(feedback)}
                                className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 py-3 font-display text-2xl font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5 disabled:opacity-50"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={backspace}
                                disabled={busy || Boolean(feedback) || !entry}
                                aria-label="Delete last digit"
                                className="flex items-center justify-center rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 py-3 text-banana-800 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5 disabled:opacity-50"
                            >
                                <Delete size={22} />
                            </button>
                        </div>

                        {autoSubmit && session && entry && !feedback && (
                            <div className="mt-3" aria-live="polite">
                                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-banana-800">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles size={13} />
                                        Sending shortly
                                    </span>
                                    <span>Enter to send now</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full border-2 border-banana-200 bg-banana-100">
                                    <div
                                        key={`${session.sessionId}-${entry}`}
                                        className="auto-submit-bar h-full rounded-full bg-banana-500"
                                    />
                                </div>
                            </div>
                        )}

                        {!autoSubmit && (
                            <Button
                                onClick={() => submit(false)}
                                disabled={busy || Boolean(feedback) || !entry}
                                className="mt-3 w-full !py-3.5 !text-xl"
                            >
                                <CheckCircle2 size={20} /> Submit answer
                            </Button>
                        )}

                        {showKeyboardHints && (
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold text-banana-800">
                                <kbd className="rounded-lg border-2 border-banana-200 bg-white/80 px-1.5 py-0.5 font-body text-[11px] font-bold text-banana-900 shadow-game-sm">
                                    0–9
                                </kbd>
                                type
                                <kbd className="rounded-lg border-2 border-banana-200 bg-white/80 px-1.5 py-0.5 font-body text-[11px] font-bold text-banana-900 shadow-game-sm">
                                    Backspace
                                </kbd>
                                delete
                                <kbd className="rounded-lg border-2 border-banana-200 bg-white/80 px-1.5 py-0.5 font-body text-[11px] font-bold text-banana-900 shadow-game-sm">
                                    Enter
                                </kbd>
                                submit
                            </div>
                        )}

                        {error && (
                            <p
                                className="mt-3 rounded-2xl border-2 border-banana-300 bg-banana-100 px-3 py-2 text-center text-sm font-bold text-banana-900"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                    </Card>

                    <aside className="flex flex-col gap-4">
                        <Card className="!p-4" style={{ flex: '3 1 0' }}>
                            <h2 className="mb-3 font-display text-lg font-extrabold text-banana-800">This round</h2>
                            <dl className="space-y-2 text-sm">
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-banana-800">Score</dt>
                                    <dd className="font-semibold text-banana-900 tabular-nums">{score}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-banana-800">Correct</dt>
                                    <dd className="font-semibold text-banana-900 tabular-nums">{correctCount}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-banana-800">Streak</dt>
                                    <dd className="font-semibold text-banana-900 tabular-nums">{currentStreak}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <dt className="text-banana-800">Answered</dt>
                                    <dd className="font-semibold text-banana-900 tabular-nums">
                                        {answers.length}/{config.quizCount}
                                    </dd>
                                </div>
                            </dl>
                        </Card>
                        <Card className="!p-4" style={{ flex: '4 1 0' }}>
                            <h2 className="mb-2 font-display text-lg font-extrabold text-banana-800">Scoring</h2>
                            <ul className="space-y-2 text-sm font-semibold text-banana-800">
                                <li>A correct answer starts at 50 points, with speed and streak bonuses added when earned.</li>
                                <li>Each continued correct answer can add 5 points to your run.</li>
                                <li>Wrong, skipped and timed-out quizzes earn 0 points.</li>
                            </ul>
                        </Card>
                        <Card className="!p-4" style={{ flex: '2 1 0' }}>
                            <h2 className="mb-2 font-display text-lg font-extrabold text-banana-800">Mode</h2>
                            <p className="text-sm font-semibold text-banana-800">
                                {CONFIG_MODE_LABELS[config.mode] || config.mode} · {config.time}s per quiz
                            </p>
                            <p className="mt-1 text-sm font-semibold text-banana-800">
                                {config.leaderboardEligible !== false ? 'Ranked game' : 'Practice game'}
                            </p>
                        </Card>
                    </aside>
                </div>
            </main>

            {showQuitConfirm && (
                <QuitConfirmDialog
                    busy={busy}
                    onCancel={() => {
                        play('pop');
                        setShowQuitConfirm(false);
                    }}
                    onConfirm={() => {
                        setShowQuitConfirm(false);
                        quit();
                    }}
                />
            )}
        </div>
    );
}

function QuizPips({ answers, total }) {
    const styles = {
        correct: 'bg-emerald-500',
        wrong: 'bg-red-400',
        skipped: 'bg-amber-300',
        timeout: 'bg-orange-400',
        current: 'bg-banana-500 ring-2 ring-banana-300',
        upcoming: 'bg-banana-200',
    };

    const states = Array.from({ length: total }, (_, index) => {
        const item = answers[index];
        if (item) {
            if (item.timedOut) return 'timeout';
            if (item.skipped) return 'skipped';
            return item.isCorrect ? 'correct' : 'wrong';
        }
        return index === answers.length ? 'current' : 'upcoming';
    });

    return (
        <div className="mt-3 flex items-center gap-3">
            <span className="hidden font-display text-xs font-bold text-banana-800 sm:block">Progress</span>
            <div
                className="flex min-w-0 flex-1 items-center gap-1"
                role="img"
                aria-label={`${answers.length} of ${total} quizzes answered`}
            >
                {states.map((state, index) => (
                    <span key={index} className={`h-2 min-w-[4px] flex-1 rounded-full ${styles[state]}`} />
                ))}
            </div>
            <span className="text-xs font-semibold text-banana-800 tabular-nums">
                {answers.length}/{total}
            </span>
        </div>
    );
}

function QuitConfirmDialog({ busy, onCancel, onConfirm }) {
    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onCancel();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="quit-dialog-title"
                className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 shadow-game"
            >
                <div className="flex items-center gap-3 border-b-2 border-banana-200 bg-banana-50/70 px-5 py-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                        <LogOut size={18} />
                    </span>
                    <h2
                        id="quit-dialog-title"
                        className="font-display text-xl font-extrabold leading-tight text-banana-900"
                    >
                        Quit this game?
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm font-semibold text-banana-800">
                        Your answered quizzes are saved, but quitting early applies a small
                        penalty and ends this run.
                    </p>
                    <div className="mt-4 grid gap-2">
                        <Button variant="danger" onClick={onConfirm} disabled={busy}>
                            <LogOut size={16} /> {busy ? 'Quitting…' : 'Quit game'}
                        </Button>
                        <Button variant="secondary" onClick={onCancel} disabled={busy}>
                            Keep playing
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HudChip({ icon: Icon, label, value, className = '' }) {
    return (
        <span
            title={`${label}: ${value}`}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-3 py-1.5 shadow-game-sm ${className}`}
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                <Icon size={14} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
                <span className="font-display text-sm font-extrabold leading-none text-banana-900 tabular-nums">{value}</span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-banana-700">{label}</span>
            </span>
        </span>
    );
}

function ResultFeedback({ result, celebrate = false }) {
    const correct = Boolean(result.isCorrect);
    const timedOut = Boolean(result.timedOut);
    const skipped = Boolean(result.skipped);
    const points = Number(result.pointsAwarded) || 0;

    return (
        <div
            className={`relative w-full max-w-md rounded-2xl border-2 p-6 text-center shadow-game ${
                correct
                    ? 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-white'
                    : timedOut || skipped
                      ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white'
                      : 'border-red-300 bg-gradient-to-b from-red-50 to-white'
            } ${correct && celebrate ? 'animate-pop' : ''}`}
        >
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 shadow-game-sm ${
                correct ? 'border-emerald-300 bg-white text-emerald-600' : timedOut || skipped ? 'border-amber-300 bg-white text-amber-600' : 'border-red-300 bg-white text-red-600'
            }`}>
                {correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-banana-900">
                {correct ? 'Correct' : timedOut ? 'Time out' : skipped ? 'Skipped' : 'Incorrect'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-banana-800">
                {skipped
                    ? 'Quiz skipped'
                    : timedOut
                      ? 'Time ran out'
                      : correct
                        ? 'Answer locked in'
                        : 'Keep going'}
            </p>

            <div className="mt-4 inline-flex items-baseline gap-2 rounded-full border-2 border-banana-200 bg-white/80 px-4 py-2 font-display shadow-game-sm">
                <span className="font-display text-2xl leading-none text-banana-900 tabular-nums">
                    {points > 0 ? `+${points}` : '0'}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-banana-800">points</span>
            </div>

            {result.solution != null && (
                <p className="mt-3 text-sm font-semibold text-banana-800">
                    Correct answer <span className="font-extrabold text-banana-900">{result.solution}</span>
                </p>
            )}
        </div>
    );
}

function CelebrationFlow() {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
            aria-hidden="true"
        >
            <motion.div
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-banana-200/50 to-transparent"
            />
            {CELEBRATION_PIECES.map((piece) => (
                <motion.span
                    key={piece.id}
                    initial={{ y: -40, x: 0, opacity: 0, rotate: 0, scale: 0.9 }}
                    animate={{
                        y: '110vh',
                        x: piece.drift,
                        opacity: [0, 1, 1, 0],
                        rotate: piece.rotate,
                        scale: 1,
                    }}
                    transition={{
                        duration: piece.duration,
                        delay: piece.delay,
                        ease: [0.2, 0.8, 0.3, 1],
                    }}
                    className="absolute top-0 block"
                    style={{ left: `${piece.left}%` }}
                >
                    <span
                        className={`block rounded-sm ${piece.tone}`}
                        style={{ width: piece.size, height: piece.size * 1.4 }}
                    />
                </motion.span>
            ))}
        </div>
    );
}
