import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const GRID = 'var(--color-banana-200)';
const LABEL = 'var(--color-banana-800)';
const ACCENT = 'var(--color-banana-500)';
const MUTED = 'var(--color-banana-300)';

const tooltipStyle = {
    background: 'var(--color-banana-100)',
    border: '1px solid var(--color-banana-200)',
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(36,33,27,.07)',
    color: 'var(--color-banana-900)',
    fontSize: 12,
};

export function buildQuizRows(quizzes, timeLimit) {
    return (Array.isArray(quizzes) ? quizzes : []).map((quiz, index) => {
        const expired = quiz?.status === 'expired';
        const skipped = quiz?.playerAnswer == null && !expired;
        const seconds = expired
            ? Number(quiz?.quizTimeSeconds) || Number(timeLimit) || 0
            : Math.round(((Number(quiz?.timeToAnswerMs) || 0) / 1000) * 10) / 10;

        return {
            label: `Q${index + 1}`,
            points: Number(quiz?.pointsAwarded) || 0,
            seconds,
            status: expired ? 'expired' : skipped ? 'skipped' : quiz?.isCorrect ? 'correct' : 'incorrect',
        };
    });
}

export function QuizPointsChart({ rows }) {
    return (
        <section className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-4 shadow-game">
            <header className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-banana-900">Points per quiz</h2>
                <span className="text-xs text-banana-800 tabular-nums">{rows.length} quizzes</span>
            </header>
            <div className="h-56 w-full" role="img" aria-label="Points earned on each quiz">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: LABEL }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: LABEL }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--color-banana-50)' }} />
                        <Bar dataKey="points" name="Points" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            {rows.map((row, index) => (
                                <Cell
                                    key={`${row.label}-${index}`}
                                    fill={row.status === 'correct' ? ACCENT : MUTED}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

export function ResponseTimeChart({ rows }) {
    return (
        <section className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-4 shadow-game">
            <header className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-banana-900">Response time</h2>
                <span className="text-xs text-banana-800">seconds per quiz</span>
            </header>
            <div className="h-40 w-full" role="img" aria-label="Response time for each quiz">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: LABEL }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: LABEL }} axisLine={false} tickLine={false} unit="s" />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line
                            type="monotone"
                            dataKey="seconds"
                            name="Response time"
                            stroke={ACCENT}
                            strokeWidth={2}
                            dot={{ r: 2.5, fill: ACCENT }}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

const OUTCOMES = [
    { key: 'correct', label: 'Correct', tone: 'bg-banana-500' },
    { key: 'incorrect', label: 'Incorrect', tone: 'bg-banana-300' },
    { key: 'expired', label: 'Timed out', tone: 'bg-banana-200' },
    { key: 'skipped', label: 'Skipped', tone: 'bg-banana-100' },
];

export function OutcomeBreakdown({ rows }) {
    const total = rows.length || 1;
    const counts = OUTCOMES.map((outcome) => ({
        ...outcome,
        count: rows.filter((row) => row.status === outcome.key).length,
    }));

    return (
        <section className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-4 shadow-game">
            <h2 className="mb-3 font-display text-lg text-banana-900">Outcome mix</h2>
            <dl className="space-y-3">
                {counts.map(({ key, label, count, tone }) => (
                    <div key={key} className="flex items-center gap-3">
                        <dt className="w-20 flex-shrink-0 text-xs text-banana-800">{label}</dt>
                        <dd className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-banana-100">
                                <span
                                    className={`block h-full rounded-full ${tone}`}
                                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                                />
                            </span>
                            <span className="w-6 text-right text-xs text-banana-900 tabular-nums">{count}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
