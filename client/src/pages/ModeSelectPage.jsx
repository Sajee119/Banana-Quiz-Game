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
import {
    MODE_LIST,
    QUIZ_COUNT_OPTIONS,
    TIME_LIMIT_OPTIONS,
    normalizeModeId,
} from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MODE_ICONS = { easy: Banana, hard: Timer, custom: Settings2 };
const QUIZ_COUNTS = QUIZ_COUNT_OPTIONS;
const TIMES = TIME_LIMIT_OPTIONS;

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
    const [quizCount, setQuizCount] = useState(() => {
        const stored = Number(user?.preferences?.defaultQuizCount);
        return QUIZ_COUNTS.includes(stored) ? stored : 10;
    });
    const [time, setTime] = useState(() => {
        const stored = Number(user?.preferences?.defaultTime);
        return TIMES.includes(stored) ? stored : 30;
    });
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
    const quizCountValue = mode === 'custom' ? clamp(quizCount, 1, 30) : 10;
    const timeValue =
        mode === 'easy' ? 30 : mode === 'hard' ? 15 : clamp(time, 10, 60);
    const totalSeconds = quizCountValue * timeValue;
    const durationLabel =
        totalSeconds >= 60 ? `≈ ${Math.round(totalSeconds / 60)} min` : `${totalSeconds}s`;

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto w-full px-4 py-6 sm:px-6 md:py-8">
                <section className="mb-6 overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-white to-amber-50 p-5 shadow-game sm:p-7">
                    <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                        <Gamepad2 size={13} /> New game
                    </p>
                    <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-banana-900 md:text-4xl">
                        Choose your challenge
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-banana-800">
                        Pick a standard pace or build a custom practice session. Standard games count toward the
                        leaderboard; custom games are saved for practice.
                    </p>
                </section>

                <div className="grid items-start gap-4 lg:grid-cols-[4fr_2fr]">
                    <div className="space-y-4">
                        <Card className="!p-4 md:!p-5">
                            <header className="mb-3 flex items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-banana-800">
                                    <Gamepad2 size={18} className="text-banana-700" />
                                    Mode
                                </h2>
                                <span className="text-xs text-banana-700">{selected.label} selected</span>
                            </header>
                            <div className="grid gap-3 sm:grid-cols-3">
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
                        </Card>

                        {mode === 'custom' && (
                            <CustomSettings
                                quizCount={quizCount}
                                setQuizCount={setQuizCount}
                                time={time}
                                setTime={setTime}
                            />
                        )}

                        <HowItWorks />
                    </div>

                    <div className="space-y-4 lg:sticky lg:top-24">
                        <LaunchCard
                            selected={selected}
                            ranked={ranked}
                            quizCountValue={quizCountValue}
                            timeValue={timeValue}
                            durationLabel={durationLabel}
                            error={error}
                            onStart={begin}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function ModeCard({ mode, selected, onClick }) {
    const Icon = MODE_ICONS[mode.id] || Banana;
    const ranked = mode.multiplier !== 'Practice';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`flex h-full flex-col rounded-2xl border-2 p-4 text-left shadow-game transition-all ${
                selected
                    ? 'border-banana-500 bg-gradient-to-b from-banana-100 to-banana-50 -translate-y-0.5 shadow-game'
                    : 'border-banana-300 bg-gradient-to-b from-white to-banana-50/60 hover:-translate-y-0.5 hover:border-banana-400 hover:shadow-game'
            }`}
        >
            <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    <Icon size={18} aria-hidden="true" />
                </span>
                {selected && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                        <CheckCircle2 size={11} /> Selected
                    </span>
                )}
            </div>
            <h3 className="font-display text-lg font-extrabold leading-tight text-banana-800">{mode.label}</h3>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-banana-500">{mode.tagline}</p>
            <p className="mt-2 flex-1 text-sm font-semibold text-banana-700">{mode.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-banana-700">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-bold uppercase tracking-wide">{mode.time}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-bold uppercase tracking-wide">
                    {mode.multiplier === 'Practice' ? 'Practice' : `${mode.multiplier} points`}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 font-bold uppercase tracking-wide">
                    {ranked ? <Trophy size={11} /> : <ShieldCheck size={11} />}
                    {ranked ? 'Leaderboard' : 'Practice only'}
                </span>
            </div>
        </button>
    );
}

function CustomSettings({ quizCount, setQuizCount, time, setTime }) {
    return (
        <Card className="!p-4 md:!p-5">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    <Settings2 size={16} />
                </span>
                <h2 className="font-display text-lg font-extrabold text-banana-800">Custom settings</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

            <p className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-banana-200 bg-banana-50/80 p-3 text-sm font-semibold text-banana-800">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-banana-700" />
                Custom scores are for practice and are not added to the leaderboard.
            </p>
        </Card>
    );
}

function LaunchCard({
    selected,
    ranked,
    quizCountValue,
    timeValue,
    durationLabel,
    error,
    onStart,
}) {
    const Icon = MODE_ICONS[selected.id] || Banana;

    return (
        <Card className="!p-4 md:!p-5">
            <div className="mb-3 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    <Icon size={16} aria-hidden="true" />
                </span>
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-banana-500">Ready to start</p>
                    <h2 className="font-display text-lg font-extrabold leading-tight text-banana-800">{selected.label}</h2>
                </div>
            </div>

            <dl className="grid gap-2 text-sm">
                <SummaryRow label="Mode" value={selected.label} />
                <SummaryRow label="Quizzes" value={quizCountValue} />
                <SummaryRow label="Time per quiz" value={`${timeValue}s`} />
                <SummaryRow label="Estimated run" value={durationLabel} />
                <SummaryRow label="Type" value={ranked ? 'Ranked' : 'Practice'} />
            </dl>

            <p className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-banana-200 bg-banana-50/80 px-3 py-2 text-xs font-semibold text-banana-800">
                {ranked ? (
                    <Trophy size={14} className="mt-0.5 flex-shrink-0 text-banana-700" />
                ) : (
                    <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-banana-700" />
                )}
                {ranked
                    ? 'Points and streaks count toward your leaderboard ranking.'
                    : 'Saved in your history, but it does not change leaderboard points.'}
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-3 rounded-2xl border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                >
                    {error}
                </p>
            )}

            <Button onClick={onStart} className="mt-4 w-full !py-3 !text-base">
                <Play size={18} /> Start game
            </Button>
        </Card>
    );
}

function HowItWorks() {
    return (
        <Card className="!p-4 md:!p-5">
            <h2 className="mb-3 font-display text-lg font-extrabold text-banana-800">How a game works</h2>
            <div className="grid gap-3 sm:grid-cols-3">
                <WorkflowStep
                    number="1"
                    title="Choose a challenge"
                    text="Pick Easy, Hard, or Custom settings for your session."
                />
                <WorkflowStep
                    number="2"
                    title="Solve the puzzle"
                    text="Study the banana puzzle, enter its value, and submit before time runs out."
                />
                <WorkflowStep
                    number="3"
                    title="Review results"
                    text="See correctness, response time, points, and full game analysis when finished."
                />
            </div>
        </Card>
    );
}

function Choice({ label, values, value, onChange, suffix }) {
    return (
        <fieldset>
            <legend className="mb-2 font-display text-sm font-bold text-banana-900">{label}</legend>
            <div className="flex flex-wrap gap-1.5">
                {values.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onChange(item)}
                        aria-pressed={item === value}
                        aria-label={`${item} ${suffix}`}
                        className={`min-w-[2.75rem] rounded-2xl border-2 px-2.5 py-1.5 font-display text-sm font-bold shadow-game-sm transition active:translate-y-0.5 ${
                            item === value
                                ? 'border-banana-500 bg-banana-100 text-banana-900'
                                : 'border-banana-200 bg-white/80 text-banana-800 hover:bg-banana-100'
                        }`}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-banana-700">
                {value} {suffix} selected
            </p>
        </fieldset>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-banana-100 py-1.5 last:border-0">
            <dt className="font-semibold text-banana-800">{label}</dt>
            <dd className="text-right font-extrabold text-banana-900 tabular-nums">{value}</dd>
        </div>
    );
}

function WorkflowStep({ number, title, text }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-banana-50/70 p-3 shadow-game-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-banana-300 bg-banana-200 font-display text-sm font-extrabold text-banana-900">
                {number}
            </span>
            <h3 className="mt-2 font-display text-base font-extrabold text-banana-800">{title}</h3>
            <p className="mt-0.5 text-sm font-semibold text-banana-700">{text}</p>
        </div>
    );
}
