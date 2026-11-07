import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock3, LogOut, SkipForward, XCircle } from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const KEYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const FEEDBACK_MS = 900;

export default function GamePage() {
    const navigate = useNavigate();
    const { setStats } = useAuth();
    const [config, setConfig] = useState(null);
    const [session, setSession] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [seconds, setSeconds] = useState(0);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState('');
    const deadline = useRef(0);
    const busyRef = useRef(false);
    const finishedRef = useRef(false);

    usePageTitle('Playing');

    useEffect(() => {
        const saved = sessionStorage.getItem('banana-game-config');
        if (!saved) navigate('/play', { replace: true });
        else setConfig(JSON.parse(saved));
        window.history.pushState(null, '', window.location.href);
        const blockBack = () => window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', blockBack);
        return () => window.removeEventListener('popstate', blockBack);
    }, [navigate]);

    const finishGame = useCallback(async (_entries, quit = false) => {
        if (quit) {
            const response = await gameApi.quit(sessionStorage.getItem('banana-game-id'));
            if (response.data?.stats) setStats(response.data.stats);
        }
        const gameId = sessionStorage.getItem('banana-game-id');
        sessionStorage.removeItem('banana-game-config');
        sessionStorage.removeItem('banana-game-id');
        navigate(`/game-overview/${gameId}`, { replace: true });
    }, [config, navigate, setStats]);

    const startQuiz = useCallback(async () => {
        if (!config || answers.length >= config.quizCount || feedback) return;
        busyRef.current = true;
        setBusy(true);
        setError('');
        try {
            const { data } = await gameApi.start(config.mode, {
                gameId: sessionStorage.getItem('banana-game-id') || crypto.randomUUID(),
                quizCount: config.quizCount,
                quizTimeSeconds: config.time,
                leaderboardEligible: config.leaderboardEligible,
            });
            sessionStorage.setItem('banana-game-id', data.gameId || sessionStorage.getItem('banana-game-id') || crypto.randomUUID());
            setSession({ ...data, startedAt: new Date().toISOString() });
            deadline.current = Date.now() + (data.remainingMs || config.time * 1000);
            setSeconds(Math.ceil((data.remainingMs || config.time * 1000) / 1000));
        } catch (err) {
            setError(err.friendlyMessage || 'Could not load the next quiz.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, [answers.length, config, feedback]);

    useEffect(() => {
        if (config && !session && !feedback && answers.length < config.quizCount && !finishedRef.current) startQuiz();
    }, [answers.length, config, feedback, session, startQuiz]);

    const record = useCallback((result, timedOut = false, skipped = false) => {
        const entry = {
            quiz: answers.length + 1,
            quizImage: session.imageUrl,
            startedAt: session.startedAt,
            completedAt: new Date().toISOString(),
            responseTimeMs: result.answerMs ?? (config.time * 1000),
            response: result.playerAnswer ?? null,
            correctAnswer: result.solution ?? null,
            isCorrect: Boolean(result.isCorrect),
            timedOut,
            skipped,
            points: result.pointsAwarded || 0,
            leaderboardEligible: config.leaderboardEligible,
        };
        const next = [...answers, entry];
        setAnswers(next);
        setSession(null);
        setFeedback({ ...result, timedOut, skipped });
        if (result.stats) setStats(result.stats);
        window.setTimeout(() => {
            setFeedback(null);
            if (next.length >= config.quizCount) {
                finishedRef.current = true;
                finishGame(next);
            }
        }, FEEDBACK_MS);
    }, [answers, config, finishGame, session, setStats]);

    const submit = useCallback(async (selectedAnswer, timedOut = false) => {
        if (!session || busyRef.current || feedback) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const response = timedOut
                ? await gameApi.expire(session.sessionId)
                : await gameApi.answer(session.sessionId, Number(selectedAnswer));
            record(response.data, timedOut);
        } catch (err) {
            if (timedOut && err.response?.data) record(err.response.data, true);
            else setError(err.friendlyMessage || 'Could not submit that answer.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    }, [feedback, record, session]);

    useEffect(() => {
        if (!session || feedback) return undefined;
        const timer = window.setInterval(() => {
            const left = Math.max(0, deadline.current - Date.now());
            setSeconds(Math.ceil(left / 1000));
            if (!left) submit(null, true);
        }, 200);
        return () => window.clearInterval(timer);
    }, [feedback, session, submit]);

    const skip = async () => {
        if (!session || busyRef.current || feedback) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const response = await gameApi.skip(session.sessionId);
            record(response.data, false, true);
        } catch (err) {
            setError(err.friendlyMessage || 'Could not skip this quiz.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const quit = async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            if (session) {
                try {
                    await gameApi.skip(session.sessionId);
                } catch (err) {
                    const status = err.response?.status;
                    if (status !== 409 && status !== 410) throw err;
                }
            }
            await finishGame(answers, true);
        } catch (err) {
            setError(err.friendlyMessage || 'Could not quit this game.');
            busyRef.current = false;
            setBusy(false);
        }
    };

    if (!config || (!session && !feedback)) {
        return <div className="flex min-h-screen items-center justify-center"><BananaLogo size={90} className="animate-float" /></div>;
    }

    const progress = session ? Math.max(0, Math.min(100, (seconds / config.time) * 100)) : 0;
    return (
        <div className="min-h-screen bg-banana-50">
            <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 md:px-8">
                <header className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="font-extrabold uppercase tracking-widest text-banana-600">Full game</p>
                        <h1 className="font-display text-3xl font-extrabold text-banana-900">
                            Quiz {answers.length + (feedback ? 0 : 1)} of {config.quizCount}
                        </h1>
                    </div>
                    <Button variant="secondary" onClick={quit} disabled={busy}><LogOut size={18} /> Quit game</Button>
                </header>

                <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-banana-200 bg-white/80 px-4 py-3">
                    <span className="font-bold text-banana-700">{seconds}s remaining</span>
                    <div className="h-3 flex-1 mx-4 overflow-hidden rounded-full bg-banana-200">
                        <div className="h-full rounded-full bg-banana-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <Button variant="secondary" className="!px-4 !py-2 !text-sm" onClick={skip} disabled={busy || Boolean(feedback)}>
                        <SkipForward size={16} /> Skip
                    </Button>
                </div>

                <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <Card className="flex min-h-[520px] items-center justify-center !p-5 md:!p-10">
                        {session && <img src={session.imageUrl} alt="Calculate the banana value in this puzzle" className="max-h-[560px] max-w-full rounded-2xl border-4 border-banana-300 object-contain shadow-game-sm" />}
                        {feedback && <ResultFeedback result={feedback} />}
                    </Card>

                    <Card className="flex flex-col justify-center !p-5 md:!p-7">
                        <div className="mb-5 text-center">
                            <p className="text-sm font-extrabold uppercase tracking-widest text-banana-600">Select your answer</p>
                            <p className="mt-1 flex items-center justify-center gap-2 font-bold text-banana-700"><Clock3 size={17} /> Pick a number to submit instantly</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {KEYS.map((key) => (
                                <button key={key} type="button" onClick={() => submit(key)} disabled={busy || Boolean(feedback)} className="rounded-2xl border-2 border-banana-200 bg-banana-100 py-5 font-display text-3xl font-extrabold text-banana-800 shadow-game-sm transition hover:bg-banana-300 active:translate-y-1 disabled:opacity-50">{key}</button>
                            ))}
                        </div>
                        {error && <p className="mt-4 text-center font-bold text-red-600" role="alert">{error}</p>}
                    </Card>
                </div>
                <Card className="mt-5 !p-5">
                    <h2 className="font-display text-2xl font-extrabold text-banana-800">How scoring works</h2>
                    <div className="mt-3 grid gap-3 text-sm font-semibold text-banana-700 sm:grid-cols-3">
                        <div className="rounded-2xl bg-banana-100 p-3"><strong className="text-banana-900">Quick response:</strong> a correct answer starts at 50 points, with speed and streak bonuses added when earned.</div>
                        <div className="rounded-2xl bg-banana-100 p-3"><strong className="text-banana-900">Keep your streak:</strong> each continued correct answer can add 5 points to your run.</div>
                        <div className="rounded-2xl bg-banana-100 p-3"><strong className="text-banana-900">No time-out points:</strong> wrong, skipped and timed-out quizzes earn 0 points; custom scores stay off the leaderboard.</div>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function ResultFeedback({ result }) {
    const correct = result.isCorrect;
    const timedOut = result.timedOut;
    return (
        <div className={`w-full max-w-md rounded-3xl border-4 p-8 text-center ${correct ? 'border-emerald-300 bg-emerald-50' : timedOut ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
            {correct ? <CheckCircle2 size={64} className="mx-auto text-emerald-500" /> : <XCircle size={64} className={`mx-auto ${timedOut ? 'text-orange-500' : 'text-red-500'}`} />}
            <h2 className={`mt-4 font-display text-4xl font-extrabold ${correct ? 'text-emerald-700' : timedOut ? 'text-orange-700' : 'text-red-700'}`}>
                {correct ? 'Correct!' : timedOut ? 'Time out' : result.skipped ? 'Skipped' : 'Wrong answer'}
            </h2>
            <p className="mt-3 font-display text-3xl font-extrabold text-banana-900">
                {result.pointsAwarded > 0 ? `+${result.pointsAwarded}` : '0'} points
            </p>
            {result.solution != null && <p className="mt-2 font-bold text-banana-700">Correct answer: {result.solution}</p>}
        </div>
    );
}
