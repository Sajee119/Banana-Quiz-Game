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
    correct: '#34d399',
    incorrect: '#f87171',
    expired: '#fb923c',
    skipped: '#facc15',
};

const chartTooltipStyle = {
    background: '#fffceb',
    border: '2px solid #ffec85',
    borderRadius: 12,
    boxShadow: '0 10px 24px rgba(107,50,0,.12)',
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e1d7" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: compact ? 10 : 12, fill: '#4a4236' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="points"
                        allowDecimals={false}
                        tick={{ fontSize: compact ? 10 : 12, fill: '#4a4236' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <YAxis
                        yAxisId="seconds"
                        orientation="right"
                        unit="s"
                        tick={{ fontSize: compact ? 10 : 12, fill: '#4a4236' }}
                        axisLine={false}
                        tickLine={false}
                        width={compact ? 24 : 32}
                    />
                    <Tooltip content={<QuizChartTooltip />} />
                    {!compact && <Legend wrapperStyle={{ fontSize: 12, color: '#4a4236' }} />}
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
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ r: compact ? 2 : 3, fill: '#60a5fa' }}
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
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-banana-700">
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
                    <h2 className="flex items-center gap-2 font-display text-xl text-banana-900">
                        <BarChart3 size={20} className="text-banana-700" />
                        {title}
                    </h2>
                    <p className="text-xs text-banana-800">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {showBest && (
                        <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-semibold text-banana-700">
                            Best: {best.label} · {best.points} pts
                        </span>
                    )}
                    {action}
                </div>
            </div>

            {chart}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-banana-700">
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
            className="min-w-[160px] px-3 py-2 text-sm font-bold text-banana-800"
        >
            <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-banana-500">
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
            <p className="mt-1 text-xs capitalize text-banana-500">{status}</p>
        </div>
    );
}
