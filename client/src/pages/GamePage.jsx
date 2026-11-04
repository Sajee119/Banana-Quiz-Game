import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Trophy,
    LayoutDashboard,
    Timer,
    Banana,
    Leaf,
    ArrowLeftRight,
    Play,
    Sparkles,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import AppHeader from '../components/AppHeader.jsx';
import { gameApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { useSound } from '../hooks/useSound.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import Confetti from '../components/Confetti.jsx';
import { MODE_INFO, MODE_LIST } from '../lib/format.js';

const MODE_ICONS = { classic: Banana, blitz: Timer, zen: Leaf };
const TICK_INTERVAL_MS = 250;

export default function GamePage() {
    const { stats, setStats } = useAuth();
    const { play } = useSound();
    const [searchParams] = useSearchParams();

    const requestedMode = searchParams.get('mode') || 'classic';
    const mode = MODE_INFO[requestedMode] || MODE_INFO.classic;
    const ModeIcon = MODE_ICONS[mode.id] || Banana;

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle | playing | correct | wrong | expired
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [round, setRound] = useState(0);
    const [timerKey, setTimerKey] = useState(0);

    const timerRef = useRef(null);
    const deadlineRef = useRef(0);
    const inputRef = useRef(null);
    const focusTimerRef = useRef(null);
    const submittingRef = useRef(false);
    const lastTickRef = useRef(null);

    usePageTitle(`${mode.label} mode`);

    // ---- Start game ----
    const startGame = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        setError('');
        setResult(null);
        setAnswer('');
        setSession(null);
        setPhase('idle');
        setTimeLeft(0);
        lastTickRef.current = null;

        try {
            play('click');
            const { data } = await gameApi.start(mode.id);
            const totalMs = data.remainingMs ?? data.timeLimitMs;

            setSession({ ...data, totalMs });
            deadlineRef.current = Date.now() + totalMs;
            setTimeLeft(Math.ceil(totalMs / 1000));
            setPhase('playing');
            setRound((value) => value + 1);

            clearTimeout(focusTimerRef.current);
            focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 120);
        } catch (err) {
            setError(err.friendlyMessage || 'Could not load a puzzle. Try again.');
            setPhase('idle');
        } finally {
            setLoading(false);
        }
    }, [loading, mode.id, play]);

    // ---- End the round when the clock reaches zero ----
    const expireRound = useCallback(
        async (sessionId) => {
            if (!sessionId) return;

            setPhase('expired');
            setError('');
            play('expire');
            setLoading(true);

            try {
                const { data } = await gameApi.expire(sessionId);
                setResult({
                    ...data,
                    isCorrect: false,
                    pointsAwarded: 0,
                    timedOut: true,
                });
                if (data.stats) setStats(data.stats);
            } catch (err) {
                // The server clock is slightly behind the client's: resume.
                if (err.response?.status === 409 && err.response.data?.remainingMs != null) {
                    const remainingMs = err.response.data.remainingMs;
                    deadlineRef.current = Date.now() + remainingMs;
                    setTimeLeft(Math.ceil(remainingMs / 1000));
                    setPhase('playing');
                    return;
                }

                setResult({ isCorrect: false, pointsAwarded: 0, timedOut: true });
            } finally {
                setLoading(false);
            }
        },
        [play, setStats]
    );

    // ---- Countdown ----
    useEffect(() => {
        if (phase !== 'playing' || !session) return undefined;

        const sessionId = session.sessionId;

        const tick = () => {
            const remainingMs = Math.max(0, deadlineRef.current - Date.now());
            const next = Math.ceil(remainingMs / 1000);
            setTimeLeft(next);

            if (remainingMs <= 0) {
                clearInterval(timerRef.current);
                // If an answer is already in flight, let the server decide
                // whether it beat the deadline.
                if (!submittingRef.current) expireRound(sessionId);
                return;
            }

            if (next <= 5 && lastTickRef.current !== next) {
                lastTickRef.current = next;
                play('tick');
            }
        };

        timerRef.current = setInterval(tick, TICK_INTERVAL_MS);
        tick();

        return () => clearInterval(timerRef.current);
    }, [phase, session, play, expireRound, timerKey]);

    useEffect(
        () => () => {
            clearInterval(timerRef.current);
            clearTimeout(focusTimerRef.current);
        },
        []
    );

    // ---- Submit ----
    const submitAnswer = async (event) => {
        event?.preventDefault();
        if (!session || phase !== 'playing' || loading || submittingRef.current) return;

        const num = Number(answer);
        if (!Number.isInteger(num) || num < 0) {
            setError('Enter a whole number.');
            return;
        }

        setError('');
        setLoading(true);
        submittingRef.current = true;

        try {
            const { data } = await gameApi.answer(session.sessionId, num);
            setResult(data);
            setPhase(data.isCorrect ? 'correct' : 'wrong');
            play(data.isCorrect ? 'correct' : 'wrong');
            if (data.stats) setStats(data.stats);
        } catch (err) {
            if (err.response?.status === 410) {
                const payload = err.response.data || {};
                if (payload.stats) setStats(payload.stats);
                setResult({
                    isCorrect: false,
                    pointsAwarded: 0,
                    timedOut: true,
                    solution: payload.solution ?? null,
                });
                setPhase('expired');
                play('expire');
            } else if (err.response?.status === 409) {
                setError('This round was already submitted.');
                if (Date.now() >= deadlineRef.current) {
                    await expireRound(session.sessionId);
                } else {
                    setPhase('wrong');
                    setResult({ isCorrect: false, pointsAwarded: 0 });
                }
            } else {
                setError(err.friendlyMessage || 'Submit failed. Please try again.');
                if (Date.now() >= deadlineRef.current) {
                    await expireRound(session.sessionId);
                } else {
                    // Restart the countdown that was paused by the failed request.
                    setTimerKey((key) => key + 1);
                }
            }
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    };

    const handleImageError = () => {
        setError('The puzzle image could not load. Please start a new round.');
        setSession(null);
        setPhase('idle');
        setTimeLeft(0);
    };

    const totalMs = session?.totalMs ?? 0;
    const timerPct = totalMs
        ? Math.max(0, Math.min(100, (timeLeft / (totalMs / 1000)) * 100))
        : 0;
    const activeMode = session?.mode?.label || mode.label;
    const lowTime = timeLeft <= 5 && phase === 'playing';

    const timerLabel = !session
        ? 'Ready when you are'
        : phase === 'playing'
            ? `${timeLeft}s left`
            : phase === 'expired'
                ? 'Time up'
                : 'Round complete';

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-6">
                <h1 className="sr-only">Banana Quiz — {activeMode} mode</h1>

                {/* HUD */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-xl border-2 border-banana-300 bg-white/90 px-3 py-1.5 text-sm font-extrabold text-banana-800 shadow-game-sm">
                            <ModeIcon size={16} className="text-banana-500" /> {activeMode}
                        </span>
                        {round > 0 && (
                            <span className="rounded-xl bg-banana-200/80 px-2.5 py-1.5 text-xs font-bold text-banana-700">
                                Round {round}
                            </span>
                        )}
                        <Link
                            to="/dashboard"
                            title="Change play mode"
                            className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-banana-600 hover:bg-banana-100"
                        >
                            <ArrowLeftRight size={14} /> Change
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <HUDStat icon={<Trophy size={16} />} label="Points" value={stats?.totalPoints ?? 0} accent />
                        <HUDStat icon={<Flame size={16} />} label="Streak" value={stats?.currentStreak ?? 0} />
                        <Link to="/dashboard" title="Dashboard">
                            <Button variant="ghost" className="!p-2">
                                <LayoutDashboard size={20} />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main game panel */}
                <Card className="flex flex-col !p-5 md:!p-8">
                    {/* Timer */}
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-banana-700">
                        <span className="flex items-center gap-1.5">
                            <Timer size={14} className={lowTime ? 'text-red-500' : 'text-banana-500'} />
                            {timerLabel}
                        </span>
                        <span className={lowTime ? 'text-red-600' : 'text-banana-500'}>
                            {session ? `${Math.round(timerPct)}%` : `${mode.time} per puzzle`}
                        </span>
                    </div>
                    <div className="relative mb-4 h-4 overflow-hidden rounded-full bg-banana-200">
                        <motion.div
                            className={`h-full ${
                                lowTime ? 'bg-red-500' : 'bg-gradient-to-r from-banana-400 to-banana-600'
                            }`}
                            animate={{ width: `${timerPct}%` }}
                            transition={{ ease: 'linear', duration: 0.25 }}
                        />
                    </div>

                    {/* Puzzle area */}
                    <div className="flex min-h-[280px] flex-1 items-center justify-center">
                        {loading && !session && <Spinner />}

                        {!session && !loading && (
                            <div className="text-center">
                                <BananaLogo size={110} className="mx-auto mb-4 animate-float" />
                                <h2 className="mb-1 font-display text-3xl font-extrabold text-banana-800">
                                    {mode.label} mode
                                </h2>
                                <p className="mb-2 text-sm font-bold uppercase tracking-wide text-banana-500">
                                    {mode.time} per puzzle · {mode.multiplier} points
                                </p>
                                <p className="mx-auto mb-5 max-w-md text-banana-700">{mode.description}</p>

                                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                                    {MODE_LIST.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/play?mode=${item.id}`}
                                            className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${
                                                item.id === mode.id
                                                    ? 'border-banana-500 bg-banana-100 text-banana-800'
                                                    : 'border-banana-200 bg-white/70 text-banana-600 hover:border-banana-300'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <Button onClick={startGame} disabled={loading} className="!px-10 !py-4 !text-xl">
                                    <Play size={20} /> Start {mode.label}
                                </Button>
                            </div>
                        )}

                        {session && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={session.sessionId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative w-full"
                                >
                                    <img
                                        src={session.imageUrl}
                                        alt="Count the bananas in the picture"
                                        className="mx-auto max-h-[340px] w-auto max-w-full select-none rounded-2xl border-4 border-banana-300 shadow-game-sm"
                                        draggable={false}
                                        onContextMenu={(event) => event.preventDefault()}
                                        onError={handleImageError}
                                    />

                                    {/* Feedback overlay */}
                                    <AnimatePresence>
                                        {phase === 'correct' && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="rounded-3xl bg-green-500 px-8 py-4 font-display text-3xl font-extrabold text-white shadow-2xl">
                                                    ✅ CORRECT! +{result?.pointsAwarded}
                                                </div>
                                                <Confetti />
                                            </motion.div>
                                        )}
                                        {phase === 'wrong' && (
                                            <motion.div
                                                initial={{ x: -10 }}
                                                animate={{ x: [10, -10, 10, 0] }}
                                                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="rounded-3xl bg-red-500 px-8 py-4 font-display text-3xl font-extrabold text-white shadow-2xl">
                                                    ❌ WRONG
                                                </div>
                                            </motion.div>
                                        )}
                                        {phase === 'expired' && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="rounded-3xl bg-orange-500 px-8 py-4 font-display text-3xl font-extrabold text-white shadow-2xl">
                                                    ⏰ TIME UP
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="mt-3 text-center font-semibold text-red-600" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Answer form / result */}
                    {session && (
                        <div className="mt-6">
                            {phase === 'playing' ? (
                                <form onSubmit={submitAnswer} className="flex flex-col items-stretch gap-3 sm:flex-row">
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        max="1000"
                                        value={answer}
                                        onChange={(event) => {
                                            setAnswer(event.target.value);
                                            setError('');
                                        }}
                                        placeholder="How many?"
                                        aria-label="How many bananas?"
                                        disabled={loading}
                                        className="flex-1 rounded-2xl border-4 border-banana-300 bg-white px-4 py-3 text-center font-display text-3xl font-extrabold outline-none focus:border-banana-500 disabled:opacity-60"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={loading || answer === ''}
                                        className="!text-xl sm:!px-10"
                                    >
                                        {loading ? 'Checking…' : 'Submit'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-3" aria-live="polite">
                                    {phase === 'expired' && loading && !result ? (
                                        <p className="rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3 text-center font-semibold text-orange-700">
                                            Time up — recording your round…
                                        </p>
                                    ) : (
                                        result && (
                                            <div
                                                className={`rounded-2xl border-2 px-4 py-3 text-center ${
                                                    result.isCorrect
                                                        ? 'border-emerald-200 bg-emerald-50'
                                                        : result.timedOut
                                                            ? 'border-orange-200 bg-orange-50'
                                                            : 'border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <p
                                                    className={`font-display text-2xl font-extrabold ${
                                                        result.isCorrect
                                                            ? 'text-emerald-700'
                                                            : result.timedOut
                                                                ? 'text-orange-700'
                                                                : 'text-red-700'
                                                    }`}
                                                >
                                                    {result.isCorrect
                                                        ? `Correct! +${result.pointsAwarded} points`
                                                        : result.timedOut
                                                            ? 'Time up!'
                                                            : 'Not quite'}
                                                </p>

                                                {result.solution != null && (
                                                    <p className="mt-1 text-sm font-semibold text-banana-700">
                                                        Correct answer:{' '}
                                                        <span className="font-extrabold text-banana-900">
                                                            {result.solution}
                                                        </span>
                                                        {!result.isCorrect && result.playerAnswer != null && (
                                                            <> — you said {result.playerAnswer}</>
                                                        )}
                                                    </p>
                                                )}

                                                {result.answerMs != null && (
                                                    <p className="mt-0.5 text-xs text-banana-600">
                                                        Answered in {(result.answerMs / 1000).toFixed(1)}s
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}

                                    <div className="flex flex-wrap justify-center gap-3">
                                        <Button onClick={startGame} disabled={loading} className="!px-8 !py-3 !text-lg">
                                            {loading ? 'Loading…' : '▶ Next Banana'}
                                        </Button>
                                        <Link to="/dashboard">
                                            <Button variant="secondary" className="!px-8 !py-3 !text-lg">
                                                Dashboard
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-banana-500">
                    <Sparkles size={13} /> Tip: type your count and press Enter to submit.
                </p>
            </main>
        </div>
    );
}

function HUDStat({ icon, label, value, accent }) {
    return (
        <div
            className={`flex items-center gap-2 rounded-xl border-2 bg-white/90 px-3 py-1.5 shadow-game-sm ${
                accent ? 'border-banana-400' : 'border-banana-200'
            }`}
        >
            <span className="text-banana-600">{icon}</span>
            <div className="leading-tight">
                <div className="text-[10px] font-bold uppercase tracking-wide text-banana-600">{label}</div>
                <motion.div
                    key={value}
                    initial={{ scale: 1.3, color: '#F5A800' }}
                    animate={{ scale: 1, color: '#6B3200' }}
                    className="font-display text-base font-extrabold"
                >
                    {value}
                </motion.div>
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <div className="text-center">
            <div className="mx-auto mb-3 h-16 w-16 animate-spin rounded-full border-4 border-banana-400 border-t-transparent" />
            <p className="font-display text-lg text-banana-700">Fetching a fresh banana puzzle…</p>
        </div>
    );
}
