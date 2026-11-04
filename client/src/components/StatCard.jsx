export default function StatCard({ icon, label, value, hint, color = 'from-banana-300 to-banana-500' }) {
    return (
        <div className="rounded-2xl border-2 border-banana-200 bg-white/90 p-3.5 shadow-game-sm">
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white ${color}`}>
                {icon}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-banana-600">{label}</div>
            <div className="font-display text-2xl font-extrabold leading-tight text-banana-800">{value}</div>
            {hint && <div className="mt-0.5 text-xs text-banana-500">{hint}</div>}
        </div>
    );
}
