import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import FullscreenButton from './FullscreenButton.jsx';

/**
 * Header used by the public landing and account pages. Keeping one component
 * means the brand, fullscreen control and escape hatches never drift apart.
 */
export default function PublicPageHeader({ showLeaderboard = true }) {
    return (
        <header className="mx-auto flex w-full max-w-[1560px] items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
                <BananaLogo size={40} className="animate-wiggle" />
                <span className="font-display text-xl font-extrabold text-banana-800 sm:text-2xl">
                    Banana Quiz
                </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
                {showLeaderboard && (
                    <Link
                        to="/leaderboard"
                        className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-banana-700 transition hover:bg-banana-200/60 sm:inline-flex"
                    >
                        <Trophy size={17} /> Leaderboard
                    </Link>
                )}
                <FullscreenButton />
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 px-3 py-2 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:from-banana-50 hover:to-banana-100 active:translate-y-[1px]"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>
        </header>
    );
}
