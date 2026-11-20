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
        <header className="sticky top-0 z-40 mx-auto flex w-full items-center justify-between gap-3 border-b-2 border-banana-200 bg-banana-50/95 px-4 py-3 shadow-game-sm backdrop-blur-md sm:px-6">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2">
                <BananaLogo size={40} className="h-10 w-10 rounded-xl border-2 border-banana-400 bg-gradient-to-b from-banana-200 to-banana-300 p-1.5 shadow-game-sm" />
                <span className="font-display text-xl font-extrabold text-banana-900 sm:text-2xl">
                    Banana Quiz
                </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
                {showLeaderboard && (
                    <Link
                        to="/leaderboard"
                        className="hidden items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-2 font-display text-sm font-semibold text-banana-800 transition hover:border-banana-300 hover:bg-banana-100 hover:text-banana-900 sm:inline-flex"
                    >
                        <Trophy size={17} /> Leaderboard
                    </Link>
                )}
                <FullscreenButton />
                <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-400 bg-white/90 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-100 active:translate-y-0.5"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>
        </header>
    );
}
