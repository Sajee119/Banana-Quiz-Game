import { BarChart3 } from 'lucide-react';
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Card from './Card.jsx';

const STATUS_COLORS = {
    correct: 'var(--color-correct)',
    incorrect: 'var(--color-incorrect)',
    expired: 'var(--color-expired)',
    skipped: 'var(--color-warning)',
};

const chartTooltipStyle = {
    background: 'var(--color-banana-100)',
    border: '2px solid var(--color-banana-300)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-game)',
    color: 'var(--color-banana-900)',
};

function buildChartData(quizzes, timeLimit) {
    return quizzes.map((quiz, index) => {
        const expired = quiz?.status === 'expired';
        const skipped = quiz?.playerAnswer == null && !expired;
        const seconds = expired
            ? Number(quiz?.quizTimeSeconds) || Number(timeLimit) || 0
            : Math.round(((Number(quiz?.timeToAnswerMs) || 0) / 1000) * 10) / 10;

        return {
            label: `Q${index + 1}`,
            points: Number(quiz?.pointsAwarded) || 0,
            seconds,
            status: expired
                ? 'expired'
                : skipped
                  ? 'skipped'
                  : quiz?.isCorrect
                    ? 'correct'
                    : 'incorrect',
        };
    });
}

export default function QuizPerformanceChart({
    quizzes = [],
    timeLimit,
    title = 'Quiz performance',
    subtitle = 'Points and response time for every quiz in this game.',
    showBest = true,
    action = null,
    className = '',
    compact = false,
}) {
    const data = buildChartData(Array.isArray(quizzes) ? quizzes : [], timeLimit);

    if (data.length === 0) return null;

    const best = data.reduce((top, row) => (row.points > top.points ? row : top), data[0]);
    const chartHeight = compact ? 170 : 288;

    const chart = (
        <div
            role="img"
            aria-label="Bar chart of points and line chart of response time for each quiz"
            className="w-full"
            style={{ height: chartHeight }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: compact ? -24 : -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-chart-grid)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="points"
                        allowDecimals={false}
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <YAxis
                        yAxisId="seconds"
                        orientation="right"
                        unit="s"
                        tick={{ fontSize: compact ? 10 : 12, fill: 'var(--color-chart-label)' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <Tooltip content={<QuizChartTooltip />} />
                    {!compact && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-chart-label)' }} />}
                    <Bar
                        yAxisId="points"
                        dataKey="points"
                        name="Points"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={compact ? 20 : 48}
                    >
                        {data.map((row, index) => (
                            <Cell
                                key={`${row.label}-${index}`}
                                fill={STATUS_COLORS[row.status]}
                            />
                        ))}
                    </Bar>
                    <Line
                        yAxisId="seconds"
                        type="monotone"
                        dataKey="seconds"
                        name="Response time (s)"
                        stroke="var(--color-info)"
                        strokeWidth={2}
                        dot={{ r: compact ? 2 : 3, fill: 'var(--color-info)' }}
                        activeDot={{ r: compact ? 3 : 5 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );

    if (compact) {
        return (
            <div className={className}>
                {chart}
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold text-banana-700">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" />Correct</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" />Incorrect</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-orange-400" />Timed out</span>
                </div>
            </div>
        );
    }

    return (
        <Card className={`!p-5 ${className}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-banana-900">
                        <BarChart3 size={20} className="text-banana-700" />
                        {title}
                    </h2>
                    <p className="text-xs font-semibold text-banana-800">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {showBest && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                            Best: {best.label} · {best.points} pts
                        </span>
                    )}
                    {action}
                </div>
            </div>

            {chart}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-banana-700">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Correct
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Incorrect
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-orange-400" /> Timed out
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-yellow-400" /> Skipped
                </span>
            </div>
        </Card>
    );
}

function QuizChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
    const status = payload[0]?.payload?.status;

    return (
        <div
            style={chartTooltipStyle}
            className="min-w-[160px] rounded-2xl px-3 py-2 text-sm font-bold text-banana-900"
        >
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-banana-700">
                {label}
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-emerald-600">Points</span>
                <span>{Number(values.points) || 0}</span>
            </p>
            <p className="flex items-center justify-between gap-5">
                <span className="text-sky-600">Response</span>
                <span>{Number(values.seconds) || 0}s</span>
            </p>
            <p className="mt-1 text-xs font-semibold capitalize text-banana-700">{status}</p>
        </div>
    );
}
