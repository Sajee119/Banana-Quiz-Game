export default function StatCard({ icon, label, value, hint, className = '' }) {
    return (
        <div
            className={`rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm ${className}`}
        >
            <div className="mb-2 flex items-center gap-2 text-banana-700 [&>svg]:h-4 [&>svg]:w-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                    {icon}
                </span>
                <span className="text-sm font-bold text-banana-800">{label}</span>
            </div>
            <div className="font-display text-3xl font-extrabold leading-tight text-banana-900 tabular-nums">
                {value}
            </div>
            {hint && <div className="mt-1 text-xs font-semibold text-banana-700">{hint}</div>}
        </div>
    );
}
