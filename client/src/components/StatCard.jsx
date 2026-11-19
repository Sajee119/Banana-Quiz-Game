export default function StatCard({ icon, label, value, hint, className = '' }) {
    return (
        <div
            className={`rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/80 p-4 shadow-game ${className}`}
        >
            <div className="mb-2 flex items-center gap-2 text-banana-700 [&>svg]:h-4 [&>svg]:w-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-banana-300 bg-banana-100 text-banana-700">
                    {icon}
                </span>
                <span className="text-sm font-semibold text-banana-800">{label}</span>
            </div>
            <div className="font-display text-3xl leading-tight text-banana-900 tabular-nums">
                {value}
            </div>
            {hint && <div className="mt-1 text-xs text-banana-700">{hint}</div>}
        </div>
    );
}
