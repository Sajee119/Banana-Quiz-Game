import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Sparkles } from 'lucide-react';
import AppHeader from './AppHeader.jsx';
import BananaLogo from './BananaLogo.jsx';

const CHIP_TONES = {
    banana: 'border-banana-200 bg-white/80 text-banana-800',
    emerald: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    amber: 'border-amber-300 bg-amber-50 text-banana-900',
    sky: 'border-sky-300 bg-sky-100 text-sky-800',
    violet: 'border-violet-300 bg-violet-100 text-violet-800',
    orange: 'border-orange-300 bg-orange-100 text-orange-800',
};

export const secondaryActionClass =
    'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-400 bg-white/90 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5';

export const primaryActionClass =
    'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-500 bg-gradient-to-b from-banana-400 to-banana-500 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:brightness-[1.02] active:translate-y-0.5';

/**
 * Shared frame for public information pages (FAQ, help, terms, privacy).
 * Keeps the header, hero and content width consistent across the site.
 */
export default function PageShell({
    icon: Icon,
    eyebrow,
    title,
    subtitle,
    meta,
    chips = [],
    actions,
    children,
}) {
    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto w-full px-4 py-6 sm:px-6 md:py-8">
                <motion.section
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative mb-5 overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-white to-amber-50 p-5 shadow-game sm:p-7"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[14px] border-banana-300/40"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[14px] border-white/70"
                    />
                    <BananaLogo
                        size={190}
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-12 right-6 rotate-12 opacity-10 animate-float"
                    />

                    <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                                {Icon ? <Icon size={13} /> : <Sparkles size={13} />}
                                {eyebrow || 'Banana Quiz'}
                            </p>
                            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-banana-900 sm:text-5xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-banana-800 sm:text-base">
                                    {subtitle}
                                </p>
                            )}

                            {(meta || chips.length > 0) && (
                                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                                    {meta && (
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 ${CHIP_TONES.banana}`}
                                        >
                                            <CalendarDays size={12} /> {meta}
                                        </span>
                                    )}
                                    {chips.map(({ icon: ChipIcon, label, tone = 'banana' }) => (
                                        <span
                                            key={label}
                                            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 ${CHIP_TONES[tone] || CHIP_TONES.banana}`}
                                        >
                                            {ChipIcon && <ChipIcon size={12} />} {label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Link to="/" className={secondaryActionClass}>
                                <ArrowLeft size={16} /> Back to home
                            </Link>
                            {actions}
                        </div>
                    </div>
                </motion.section>

                <div>{children}</div>
            </main>
        </div>
    );
}
