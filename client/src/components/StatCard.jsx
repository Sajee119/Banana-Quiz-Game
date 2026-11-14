export default function StatCard({
    icon,
    label,
    value,
    hint,
    color = 'from-banana-300 to-banana-500',
    className = '',
}) {
    return (
        <div
            className={`rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm md:p-5 ${className}`}
        >
            <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${color}`}
            >
                {icon}
            </div>
            <div className="text-xs font-bold uppercase tracking-wide text-banana-600">
                {label}
            </div>
            <div className="font-display text-3xl font-extrabold leading-tight text-banana-800 md:text-4xl">
                {value}
            </div>
            {hint && <div className="mt-1 text-xs font-semibold text-banana-500 md:text-sm">{hint}</div>}
        </div>
    );
}
