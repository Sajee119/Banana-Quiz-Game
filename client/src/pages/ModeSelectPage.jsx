import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Banana,
    CheckCircle2,
    Gamepad2,
    Play,
    Settings2,
    ShieldCheck,
    Timer,
    Trophy,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/auth-context.js';
import { MODE_LIST, normalizeModeId } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MODE_ICONS = { easy: Banana, hard: Timer, custom: Settings2 };
const MODE_ACCENTS = {
    easy: 'from-emerald-300 to-emerald-500',
    hard: 'from-orange-300 to-orange-500',
    custom: 'from-sky-300 to-sky-500',
};
const QUIZ_COUNTS = [5, 10, 20, 30];
const TIMES = [10, 15, 20, 30, 45, 60];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || min));
}

export default function ModeSelectPage() {
    usePageTitle('Choose a game');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const initialMode = useMemo(
        () =>
            normalizeModeId(
                searchParams.get('mode') ||
                    user?.preferences?.defaultMode ||
                    user?.favoriteMode
            ),
        [searchParams, user?.preferences?.defaultMode, user?.favoriteMode]
    );

    const [mode, setMode] = useState(initialMode);
    const [quizCount, setQuizCount] = useState(10);
    const [time, setTime] = useState(30);
    const [error, setError] = useState('');

    const begin = () => {
        const nextQuizCount = mode === 'custom' ? clamp(quizCount, 1, 30) : 10;
        const nextTime =
            mode === 'easy' ? 30 : mode === 'hard' ? 15 : clamp(time, 10, 60);

        if (mode === 'custom' && !TIMES.includes(nextTime)) {
            setError('Choose a valid time limit.');
            return;
        }
        if (nextQuizCount < 1 || nextQuizCount > 30) {
            setError('Quiz count must be between 1 and 30.');
            return;
        }

        const config = {
            mode: normalizeModeId(mode),
            quizCount: nextQuizCount,
            time: nextTime,
            leaderboardEligible: mode !== 'custom',
        };
        sessionStorage.setItem('banana-game-config', JSON.stringify(config));
        navigate('/play/game');
    };

    const selected = MODE_LIST.find((item) => item.id === mode) || MODE_LIST[0];
    const ranked = mode !== 'custom';

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
                <div className="mb-8 text-center">
                    <p className="font-extrabold uppercase tracking-widest text-banana-600">
                        New game
                    </p>
                    <h1 className="font-display text-4xl font-extrabold text-banana-900 md:text-5xl">
                        Choose your challenge
                    </h1>
                    <p className="mx-auto mt-2 max-w-2xl text-banana-700">
                        Pick a standard pace or build a custom practice session. Standard games
                        count toward the leaderboard; custom games are saved for practice.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {MODE_LIST.map((item) => (
                        <ModeCard
                            key={item.id}
                            mode={item}
                            selected={mode === item.id}
                            onClick={() => {
                                setMode(item.id);
                                setError('');
                            }}
                        />
                    ))}
                </div>

                {mode === 'custom' && (
                    <Card className="mx-auto mt-6 max-w-2xl">
                        <div className="mb-4 flex items-center gap-2">
                            <Settings2 size={20} className="text-banana-500" />
                            <h2 className="font-display text-2xl font-extrabold text-banana-900">
                                Custom settings
                            </h2>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Choice
                                label="Number of quizzes"
                                values={QUIZ_COUNTS}
                                value={quizCount}
                                onChange={setQuizCount}
                                suffix="quizzes"
                            />
                            <Choice
                                label="Time per quiz"
                                values={TIMES}
                                value={time}
                                onChange={setTime}
                                suffix="seconds"
                            />
                        </div>
                        <p className="mt-5 rounded-2xl bg-banana-100 px-4 py-3 text-center text-sm font-bold text-banana-700">
                            Custom scores are for practice and are not added to the leaderboard.
                        </p>
                    </Card>
                )}

                <Card className="mx-auto mt-6 max-w-2xl !p-5">
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <Summary
                            icon={<Gamepad2 size={17} />}
                            label="Mode"
                            value={selected.label}
                        />
                        <Summary
                            icon={<Gamepad2 size={17} />}
                            label="Quizzes"
                            value={`${mode === 'custom' ? clamp(quizCount, 1, 30) : 10}`}
                        />
                        <Summary
                            icon={<Timer size={17} />}
                            label="Time per quiz"
                            value={`${mode === 'easy' ? 30 : mode === 'hard' ? 15 : clamp(time, 10, 60)}s`}
                        />
                    </div>
                    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-banana-100 p-3 text-sm font-bold text-banana-700">
                        {ranked ? (
                            <Trophy size={18} className="mt-0.5 flex-shrink-0 text-banana-500" />
                        ) : (
                            <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-sky-500" />
                        )}
                        {ranked
                            ? 'This game is leaderboard eligible. Points and streaks count toward your ranking.'
                            : 'This is a practice game. It is saved in your history but does not change leaderboard points.'}
                    </p>
                </Card>

                {error && (
                    <p className="mx-auto mt-4 max-w-2xl rounded-2xl bg-red-50 px-4 py-3 text-center font-bold text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-8 flex justify-center">
                    <Button onClick={begin} className="!px-10 !py-4 !text-xl">
                        <Play size={22} /> Start game
                    </Button>
                </div>

                <Card className="mx-auto mt-8 max-w-3xl !p-6">
                    <h2 className="font-display text-2xl font-extrabold text-banana-900">
                        How a game works
                    </h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <WorkflowStep
                            number="1"
                            title="Choose a challenge"
                            text="Pick Easy, Hard, or Custom settings for your session."
                        />
                        <WorkflowStep
                            number="2"
                            title="Calculate the value"
                            text="Study the banana puzzle, enter its value, and submit before the timer runs out."
                        />
                        <WorkflowStep
                            number="3"
                            title="Review your results"
                            text="See correctness, response time, points, and the full game analysis when finished."
                        />
                    </div>
                    <p className="mt-4 flex items-start gap-2 rounded-2xl bg-banana-100 p-3 text-sm font-bold text-banana-700">
                        <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                        Standard scores can appear on the leaderboard. Custom games are saved for
                        practice but do not change leaderboard points.
                    </p>
                </Card>
            </main>
        </div>
    );
}

function ModeCard({ mode, selected, onClick }) {
    const Icon = MODE_ICONS[mode.id] || Banana;
    const accent = MODE_ACCENTS[mode.id] || MODE_ACCENTS.easy;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`rounded-3xl border-4 p-6 text-left shadow-game transition hover:-translate-y-1 ${
                selected ? 'border-banana-500 bg-banana-100' : 'border-banana-200 bg-white/80'
            }`}
        >
            <div className="mb-5 flex items-center justify-between">
                <span className={`inline-flex rounded-2xl bg-gradient-to-br p-3 text-white ${accent}`}>
                    <Icon size={24} />
                </span>
                {selected && (
                    <span className="rounded-full bg-banana-400 px-2.5 py-1 text-[11px] font-extrabold uppercase text-banana-900">
                        Selected
                    </span>
                )}
            </div>
            <h2 className="font-display text-2xl font-extrabold text-banana-900">{mode.label}</h2>
            <p className="mt-1 font-bold text-banana-700">{mode.tagline}</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-banana-600">
                {mode.description}
            </p>
        </button>
    );
}

function Choice({ label, values, value, onChange, suffix }) {
    return (
        <fieldset>
            <legend className="mb-2 font-display text-xl font-extrabold text-banana-800">
                {label}
            </legend>
            <div className="flex flex-wrap gap-2">
                {values.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onChange(item)}
                        aria-pressed={item === value}
                        className={`rounded-xl border-2 px-3 py-2 font-bold transition ${
                            item === value
                                ? 'border-banana-500 bg-banana-400 text-banana-900'
                                : 'border-banana-200 bg-white text-banana-700 hover:border-banana-300'
                        }`}
                    >
                        {item} {suffix}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

function Summary({ icon, label, value }) {
    return (
        <div className="rounded-xl bg-banana-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-banana-500">
                {icon} {label}
            </p>
            <p className="mt-0.5 font-display text-lg font-extrabold text-banana-900">{value}</p>
        </div>
    );
}

function WorkflowStep({ number, title, text }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-white/80 p-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-banana-300 font-display font-extrabold text-banana-900">
                {number}
            </span>
            <h3 className="mt-3 font-display text-lg font-extrabold text-banana-800">{title}</h3>
            <p className="mt-1 text-sm font-semibold leading-5 text-banana-600">{text}</p>
        </div>
    );
}
