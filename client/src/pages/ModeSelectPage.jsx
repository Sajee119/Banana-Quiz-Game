import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banana, Settings2, Timer, Play, CheckCircle2 } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/auth-context.js';
import { normalizeModeId } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const TIMES = [10, 15, 20, 30, 45, 60];

export default function ModeSelectPage() {
    usePageTitle('Choose a game');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [mode, setMode] = useState(() =>
        normalizeModeId(
            searchParams.get('mode') ||
                user?.preferences?.defaultMode ||
                user?.favoriteMode
        )
    );
    const [quizCount, setQuizCount] = useState(10);
    const [time, setTime] = useState(30);

    const begin = () => {
        const config = {
            mode,
            quizCount: mode === 'easy' || mode === 'hard' ? 10 : quizCount,
            time: mode === 'easy' ? 30 : mode === 'hard' ? 15 : time,
            leaderboardEligible: mode !== 'custom',
        };
        sessionStorage.setItem('banana-game-config', JSON.stringify(config));
        navigate('/play/game');
    };

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
                <div className="mb-8 text-center">
                    <p className="font-extrabold uppercase tracking-widest text-banana-600">New game</p>
                    <h1 className="font-display text-5xl font-extrabold text-banana-900">Choose your challenge</h1>
                    <p className="mt-2 text-banana-700">Every game is a full 10, 5, 20 or 30 quiz session.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                    <ModeCard selected={mode === 'easy'} onClick={() => setMode('easy')} icon={<Banana />} title="Standard · Easy" detail="10 quizzes · 30 seconds each" />
                    <ModeCard selected={mode === 'hard'} onClick={() => setMode('hard')} icon={<Timer />} title="Standard · Hard" detail="10 quizzes · 15 seconds each" />
                    <ModeCard selected={mode === 'custom'} onClick={() => setMode('custom')} icon={<Settings2 />} title="Custom" detail="Choose quizzes and time" />
                </div>
                {mode === 'custom' && (
                    <Card className="mx-auto mt-6 max-w-2xl">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Choice label="Number of quizzes" values={[5, 10, 20, 30]} value={quizCount} onChange={setQuizCount} suffix="quizzes" />
                            <Choice label="Time per quiz" values={TIMES} value={time} onChange={setTime} suffix="seconds" />
                        </div>
                        <p className="mt-5 rounded-2xl bg-banana-100 px-4 py-3 text-center text-sm font-bold text-banana-700">
                            Custom scores are for practice and are not added to the leaderboard.
                        </p>
                    </Card>
                )}
                <div className="mt-8 flex justify-center">
                    <Button onClick={begin} className="!px-10 !py-4 !text-xl"><Play size={22} /> Start game</Button>
                </div>
                <Card className="mx-auto mt-8 max-w-3xl !p-6">
                    <h2 className="font-display text-2xl font-extrabold text-banana-900">How a game works</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <WorkflowStep number="1" title="Choose a challenge" text="Pick Easy, Hard, or Custom settings for your session." />
                        <WorkflowStep number="2" title="Calculate the value" text="Study the banana puzzle, select its value, and submit your answer immediately." />
                        <WorkflowStep number="3" title="Review your results" text="See correctness, response time, points, and the full game analysis when finished." />
                    </div>
                    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-banana-100 p-3 text-sm font-bold text-banana-700"><CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-500" /> Standard scores can appear on the leaderboard. Custom games are saved for practice but do not change leaderboard points.</p>
                </Card>
            </main>
        </div>
    );
}

function WorkflowStep({ number, title, text }) {
    return <div className="rounded-2xl border-2 border-banana-200 bg-white/80 p-4"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-banana-300 font-display font-extrabold text-banana-900">{number}</span><h3 className="mt-3 font-display text-lg font-extrabold text-banana-800">{title}</h3><p className="mt-1 text-sm font-semibold leading-5 text-banana-600">{text}</p></div>;
}

function ModeCard({ selected, onClick, icon, title, detail }) {
    return <button type="button" onClick={onClick} className={`rounded-3xl border-4 p-6 text-left shadow-game transition hover:-translate-y-1 ${selected ? 'border-banana-500 bg-banana-100' : 'border-banana-200 bg-white/80'}`}>
        <span className="mb-5 inline-flex rounded-2xl bg-banana-300 p-3 text-banana-900">{icon}</span>
        <h2 className="font-display text-2xl font-extrabold text-banana-900">{title}</h2>
        <p className="mt-1 font-bold text-banana-700">{detail}</p>
    </button>;
}

function Choice({ label, values, value, onChange, suffix }) {
    return <fieldset><legend className="mb-2 font-display text-xl font-extrabold text-banana-800">{label}</legend><div className="flex flex-wrap gap-2">{values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`rounded-xl border-2 px-3 py-2 font-bold ${item === value ? 'border-banana-500 bg-banana-400 text-banana-900' : 'border-banana-200 bg-white text-banana-700'}`}>{item} {suffix}</button>)}</div></fieldset>;
}
