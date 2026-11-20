import { motion } from 'framer-motion';
import { Clock3, KeyRound, ShieldCheck } from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import PublicPageHeader from './PublicPageHeader.jsx';

const RECOVERY_POINTS = [
    {
        icon: Clock3,
        title: 'Links expire fast',
        text: 'Reset links stop working after 30 minutes or as soon as they have been used.',
    },
    {
        icon: ShieldCheck,
        title: 'Nothing stored in plain text',
        text: 'Passwords are hashed before they ever touch our database.',
    },
    {
        icon: KeyRound,
        title: 'Back to the bunch',
        text: 'Set a new password and return to your streak in under a minute.',
    },
];

/**
 * Shared frame for the public account-recovery pages. It mirrors the sign-in
 * cabinet so moving between login and recovery never feels like a different app.
 */
export default function AuthShell({
    eyebrow = 'Account recovery',
    title,
    subtitle,
    children,
    footer,
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicPageHeader />

            <main className="mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:px-6">
                <motion.section
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="grid w-full flex-1 overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 shadow-game lg:grid-cols-[1.05fr_1fr]"
                >
                    {/* Desktop recovery panel */}
                    <aside className="banana-promo-panel relative hidden overflow-hidden bg-gradient-to-br from-banana-300 via-banana-400 to-banana-600 p-8 lg:flex lg:flex-col xl:p-10">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[14px] border-white/25" />
                        <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full border-[14px] border-white/20" />
                        <BananaLogo
                            size={240}
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-12 -right-10 rotate-12 opacity-15"
                        />

                        <div className="relative flex flex-1 flex-col">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-white/40 bg-white/20 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                                <ShieldCheck size={14} /> Secure account recovery
                            </span>

                            <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.03] text-white xl:text-5xl">
                                Locked out?
                                <br />
                                <span className="text-banana-50 drop-shadow-[0_3px_0_rgba(107,50,0,0.28)]">
                                    Let&apos;s get you back in.
                                </span>
                            </h2>
                            <p className="mt-4 max-w-md text-lg font-semibold text-banana-50">
                                Recovery links are private, single-use and expire quickly, so only
                                you can open the door to your account.
                            </p>

                            <ul className="mt-7 space-y-3">
                                {RECOVERY_POINTS.map(({ icon: Icon, title: pointTitle, text }) => (
                                    <li
                                        key={pointTitle}
                                        className="flex gap-3 rounded-2xl border-2 border-white/40 bg-white/20 p-3.5 backdrop-blur-sm"
                                    >
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-white/40 bg-white/20 text-white">
                                            <Icon size={19} />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-display text-base font-extrabold leading-tight text-white">
                                                {pointTitle}
                                            </span>
                                            <span className="mt-0.5 block text-xs font-semibold leading-snug text-banana-50">
                                                {text}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-8 text-[11px] font-bold uppercase tracking-wide text-banana-50">
                                <span className="inline-flex items-center rounded-full border-2 border-white/40 bg-white/20 px-2.5 py-1">
                                    Single-use links
                                </span>
                                <span className="inline-flex items-center rounded-full border-2 border-white/40 bg-white/20 px-2.5 py-1">
                                    30-minute expiry
                                </span>
                                <span className="inline-flex items-center rounded-full border-2 border-white/40 bg-white/20 px-2.5 py-1">
                                    Encrypted passwords
                                </span>
                            </div>
                        </div>
                    </aside>

                    {/* Recovery panel */}
                    <div className="relative flex flex-col justify-center bg-white/90 p-5 sm:p-8 lg:p-10 xl:p-12">
                        <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-100 via-white to-amber-50 p-3.5 shadow-game-sm lg:hidden">
                            <BananaLogo size={46} className="h-12 w-12 rounded-xl border-2 border-banana-400 bg-gradient-to-b from-banana-200 to-banana-300 p-1.5 shadow-game-sm" />
                            <div className="min-w-0">
                                <p className="font-display text-lg font-extrabold leading-none text-banana-900">
                                    Banana Quiz
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-banana-800">
                                    Account recovery, minus the fuss.
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-md">
                            <p className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                                {eyebrow}
                            </p>
                            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-banana-900 sm:text-4xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-2 text-sm font-semibold leading-relaxed text-banana-800 sm:text-base">
                                    {subtitle}
                                </p>
                            )}

                            <div className="mt-5">{children}</div>
                            {footer}
                        </div>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
