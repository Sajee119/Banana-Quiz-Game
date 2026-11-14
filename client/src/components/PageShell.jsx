import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppHeader from './AppHeader.jsx';
import BananaLogo from './BananaLogo.jsx';

/**
 * Shared frame for public information pages (FAQ, help, terms, privacy).
 * Keeps the header, hero and content width consistent across the site.
 */
export default function PageShell({ icon: Icon, eyebrow, title, subtitle, meta, children }) {
    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-[1560px] px-4 py-6 md:px-6 md:py-10">
                <div className="relative overflow-hidden rounded-3xl border-4 border-banana-300 bg-gradient-to-br from-banana-100 via-banana-50 to-amber-100 p-5 shadow-game md:p-8">
                    <BananaLogo
                        size={150}
                        className="pointer-events-none absolute -right-6 -top-6 opacity-10"
                    />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                        {Icon && (
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-banana-300 to-banana-500 text-white shadow-game-sm">
                                <Icon size={28} />
                            </div>
                        )}
                        <div className="min-w-0">
                            {eyebrow && (
                                <p className="text-xs font-extrabold uppercase tracking-widest text-banana-600">
                                    {eyebrow}
                                </p>
                            )}
                            <h1 className="font-display text-3xl font-extrabold leading-tight text-banana-800 md:text-4xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-1 max-w-2xl text-banana-700">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {meta && (
                        <p className="relative mt-4 text-xs font-bold text-banana-500">{meta}</p>
                    )}
                </div>

                <div className="mt-5">{children}</div>

                <div className="mt-6 flex justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-banana-600 transition hover:bg-banana-200/60 hover:text-banana-900"
                    >
                        <ArrowLeft size={16} /> Back to home
                    </Link>
                </div>
            </main>
        </div>
    );
}
