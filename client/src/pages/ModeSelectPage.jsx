import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banana, Settings2, Timer, Play } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const TIMES = [10, 15, 20, 30, 45, 60];

export default function ModeSelectPage() {
    usePageTitle('Choose a game');
    const navigate = useNavigate();
    const [mode, setMode] = useState('easy');
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
            </main>
        </div>
    );
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
