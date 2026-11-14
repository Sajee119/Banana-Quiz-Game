import { Link } from 'react-router-dom';
import { ArrowUp, Heart, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import { useAuth } from '../context/auth-context.js';
import { BANANA_API_URL, SITE_NAME, SUPPORT_EMAIL } from '../lib/site.js';

const YEAR = new Date().getFullYear();

const PLAY_LINKS = [
    { to: '/dashboard', label: 'Dashboard', authOnly: true },
    { to: '/play', label: 'Choose a mode', authOnly: true },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/achievements', label: 'Achievements', authOnly: true },
    { to: '/history', label: 'Game history', authOnly: true },
];

const SUPPORT_LINKS = [
    { to: '/help', label: 'Help Centre' },
    { to: '/faq', label: 'FAQ' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/privacy', label: 'Privacy Policy' },
    { href: `mailto:${SUPPORT_EMAIL}`, label: 'Contact support' },
];

export default function SiteFooter({ className = '' }) {
    const { user } = useAuth();

    const playLinks = PLAY_LINKS.map((link) => ({
        ...link,
        to: link.authOnly && !user ? '/login' : link.to,
    }));

    return (
        <footer
            className={`border-t-2 border-banana-200 bg-white/60 backdrop-blur-sm ${className}`}
            aria-labelledby="site-footer-title"
        >
            <div className="mx-auto w-full max-w-[1560px] px-4 py-8 md:px-6 md:py-10">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                    {/* Brand block */}
                    <div className="max-w-md md:col-span-2 lg:col-span-1">
                        <Link
                            to={user ? '/dashboard' : '/'}
                            className="inline-flex items-center gap-2"
                        >
                            <BananaLogo size={40} />
                            <span
                                id="site-footer-title"
                                className="font-display text-xl font-extrabold text-banana-800"
                            >
                                {SITE_NAME}
                            </span>
                        </Link>
                        <p className="mt-2 text-sm text-banana-600">
                            A free banana-value calculation game for quick breaks and long
                            leaderboard climbs. Solve the puzzle, beat the clock and grow your
                            streak.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                            <Link
                                to="/help"
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-banana-50 px-3 py-1 text-banana-700 transition hover:bg-banana-100"
                            >
                                <Mail size={14} /> Help &amp; support
                            </Link>
                            <Link
                                to="/privacy"
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-banana-50 px-3 py-1 text-banana-700 transition hover:bg-banana-100"
                            >
                                <ShieldCheck size={14} /> Privacy
                            </Link>
                            <Link
                                to="/faq"
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-banana-50 px-3 py-1 text-banana-700 transition hover:bg-banana-100"
                            >
                                <Sparkles size={14} /> FAQ
                            </Link>
                        </div>
                    </div>

                    {/* Link groups share the remaining columns evenly on desktop. */}
                    <div className="grid grid-cols-2 gap-8 sm:gap-12 md:col-span-2 lg:col-span-2 lg:gap-10">
                        <FooterColumn title="Play" links={playLinks} />
                        <FooterColumn title="Support & legal" links={SUPPORT_LINKS} />
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-banana-200 pt-4 text-xs font-semibold text-banana-500 sm:flex-row">
                    <p className="flex items-center gap-1.5">
                        © {YEAR} {SITE_NAME} · Made for banana lovers
                        <Heart size={12} className="text-red-400" />
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a
                            href={BANANA_API_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="transition hover:text-banana-700"
                        >
                            Powered by Banana API
                        </a>
                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="inline-flex items-center gap-1 transition hover:text-banana-700"
                        >
                            <ArrowUp size={13} /> Back to top
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div className="min-w-0">
            <p className="mb-2 font-display text-sm font-extrabold uppercase tracking-wide text-banana-700">
                {title}
            </p>
            <ul className="space-y-1.5 text-sm text-banana-600">
                {links.map((link) => (
                    <li key={`${title}-${link.label}`}>
                        {link.href ? (
                            <a
                                href={link.href}
                                className="inline-block transition hover:text-banana-900"
                            >
                                {link.label}
                            </a>
                        ) : (
                            <Link
                                to={link.to}
                                className="inline-block transition hover:text-banana-900"
                            >
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
