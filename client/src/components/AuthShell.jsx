import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import Card from './Card.jsx';

/**
 * Shared frame for the public account-recovery pages so they match the sign-in
 * screen without duplicating the header/card markup.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className="flex min-h-screen flex-col px-4 py-5 sm:px-6">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
                <Link to="/" className="flex items-center gap-2">
                    <BananaLogo size={38} className="animate-wiggle" />
                    <span className="font-display text-xl font-extrabold text-banana-800">
                        Banana Quiz
                    </span>
                </Link>
                <Link
                    to="/leaderboard"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-banana-700 transition hover:bg-banana-200/60"
                >
                    <Trophy size={17} /> Leaderboard
                </Link>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-8">
                <div className="w-full max-w-md">
                    <Card className="text-center">
                        <BananaLogo size={82} className="mx-auto mb-3 animate-wiggle" />
                        <p className="mb-1 font-display text-sm font-extrabold uppercase tracking-widest text-banana-500">
                            Banana Quiz
                        </p>
                        <h1 className="mb-2 font-display text-3xl font-extrabold text-banana-800 sm:text-4xl">
                            {title}
                        </h1>
                        {subtitle && <p className="mb-6 text-banana-700">{subtitle}</p>}
                        {children}
                    </Card>
                    {footer}
                </div>
            </main>
        </div>
    );
}
