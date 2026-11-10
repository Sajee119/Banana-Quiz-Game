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
}) {
    const data = buildChartData(Array.isArray(quizzes) ? quizzes : [], timeLimit);

    if (data.length === 0) return null;

    const best = data.reduce((top, row) => (row.points > top.points ? row : top), data[0]);

    return (
        <Card className={`!p-5 ${className}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                        <BarChart3 size={20} className="text-banana-500" />
                        {title}
                    </h2>
                    <p className="text-xs font-semibold text-banana-500">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {showBest && (
                        <span className="rounded-full bg-banana-100 px-3 py-1 text-xs font-extrabold text-banana-700">
                            Best: {best.label} · {best.points} pts
                        </span>
                    )}
                    {action}
                </div>
            </div>

            <div
                role="img"
                aria-label="Bar chart of points and line chart of response time for each quiz"
                className="h-72 w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5d875" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: '#b56000' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="points"
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: '#b56000' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="seconds"
                            orientation="right"
                            unit="s"
                            tick={{ fontSize: 12, fill: '#b56000' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<QuizChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#b56000' }} />
                        <Bar
                            yAxisId="points"
                            dataKey="points"
                            name="Points"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
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
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#60a5fa' }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-banana-600">
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
