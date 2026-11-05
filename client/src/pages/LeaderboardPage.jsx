import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    Medal,
    RefreshCw,
    Flame,
    Target,
    EyeOff,
    Play,
    ArrowRight,
    Sparkles,
    Users,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { userApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { initials } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PODIUM_STYLES = {
    1: {
        ring: 'border-yellow-400',
        badge: 'bg-yellow-300 text-yellow-900',
        height: 'md:min-h-[230px]',
        order: 'order-2',
        label: 'Champion',
    },
    2: {
        ring: 'border-slate-300',
        badge: 'bg-slate-200 text-slate-700',
        height: 'md:min-h-[195px]',
        order: 'order-1',
        label: 'Runner-up',
    },
    3: {
        ring: 'border-amber-400',
        badge: 'bg-amber-200 text-amber-800',
        height: 'md:min-h-[175px]',
        order: 'order-3',
        label: 'Third place',
    },
};

export default function LeaderboardPage() {
    usePageTitle('Leaderboard');
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [me, setMe] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let active = true;
        userApi
            .leaderboard(50)
            .then((res) => {
                if (!active) return;
                setEntries(res.data || []);
                setMe(res.me || null);
                setTotal(res.total || 0);
            })
            .catch((err) => {
                if (!active) return;
                setError(err.friendlyMessage || 'Could not load the leaderboard.');
                setEntries([]);
                setMe(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reloadToken]);

    const refresh = () => {
        setLoading(true);
        setError('');
        setReloadToken((token) => token + 1);
    };

    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    {/* Hero */}
                    <div className="mb-5 rounded-3xl border-4 border-banana-300 bg-gradient-to-br from-banana-100 via-banana-50 to-amber-100 p-5 shadow-game md:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-banana-600">
                                    <Sparkles size={15} /> Hall of bananas
                                </p>
                                <h1 className="font-display text-4xl font-extrabold leading-tight text-banana-800">
                                    Leaderboard
                                </h1>
                                <p className="mt-1 max-w-lg text-banana-700">
                                    Ranked by total points. Ties are broken by wins, then best streak.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl border-2 border-banana-200 bg-white/80 px-4 py-2 text-center">
                                    <p className="font-display text-2xl font-extrabold leading-none text-banana-800">
                                        {total}
                                    </p>
                                    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-banana-500">
                                        <Users size={11} /> ranked
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={refresh}
                                    title="Refresh leaderboard"
                                    aria-label="Refresh leaderboard"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-banana-300 bg-white text-banana-700 shadow-game-sm transition hover:bg-banana-50"
                                >
                                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Your position */}
                    {user && (
                        <div className="mb-5">
                            {me && !me.hidden && (
                                <Card className="!p-4 md:!p-5">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-banana-300 to-banana-500 font-display text-xl font-extrabold text-white shadow-game-sm">
                                            #{me.rank}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-banana-500">
                                                Your position
                                            </p>
                                            <p className="font-display text-xl font-extrabold text-banana-800">
                                                {me.rank === 1 ? 'You are the top banana!' : `You are #${me.rank} of ${total}`}
                                            </p>
                                            <p className="text-xs font-semibold text-banana-600">
                                                {me.totalPoints.toLocaleString()} pts · {me.gamesWon} wins · best streak{' '}
                                                {me.bestStreak}
                                            </p>
                                        </div>
                                        <Link to="/play">
                                            <Button className="!py-2.5 !text-base">
                                                <Play size={16} /> Play a round
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            )}

                            {me?.hidden && (
                                <Card className="!p-4 md:!p-5">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-banana-200 text-banana-600">
                                            <EyeOff size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-lg font-extrabold text-banana-800">
                                                You are hidden from the public board
                                            </p>
                                            <p className="text-xs font-semibold text-banana-600">
                                                Your {me.totalPoints.toLocaleString()} points still count — turn visibility
                                                back on in account settings to appear in the rankings.
                                            </p>
                                        </div>
                                        <Link to="/profile">
                                            <Button variant="secondary" className="!py-2.5 !text-base">
                                                Account settings <ArrowRight size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            )}

                            {!me && !loading && (
                                <Card className="!p-4 md:!p-5">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-banana-200 text-banana-600">
                                            <Target size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-lg font-extrabold text-banana-800">
                                                You are not on the board yet
                                            </p>
                                            <p className="text-xs font-semibold text-banana-600">
                                                Answer your first puzzle correctly to claim a spot.
                                            </p>
                                        </div>
                                        <Link to="/play">
                                            <Button className="!py-2.5 !text-base">
                                                <Play size={16} /> Start playing
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </p>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 items-end gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-44 animate-pulse rounded-2xl border-2 border-banana-200 bg-white/60"
                                    />
                                ))}
                            </div>
                            <div className="h-64 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && entries.length === 0 && (
                        <Card className="py-12 text-center">
                            <Medal size={44} className="mx-auto mb-3 text-banana-400" />
                            <h2 className="font-display text-2xl font-extrabold text-banana-800">
                                No scores yet
                            </h2>
                            <p className="mt-1 text-banana-600">The first crown is up for grabs.</p>
                            <Link to={user ? '/play' : '/login'} className="mt-5 inline-block">
                                <Button className="!px-8">
                                    <Play size={18} /> {user ? 'Be the first' : 'Sign in to play'}
                                </Button>
                            </Link>
                        </Card>
                    )}

                    {/* Podium */}
                    {!loading && podium.length > 0 && (
                        <div className="mb-4 grid grid-cols-3 items-end gap-2 md:gap-4">
                            {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => {
                                const style = PODIUM_STYLES[entry.rank];
                                return (
                                    <motion.div
                                        key={entry.rank}
                                        initial={{ y: 18, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: entry.rank * 0.06 }}
                                        className={`relative flex flex-col items-center rounded-2xl border-4 bg-white/90 p-3 text-center shadow-game ${style.ring} ${style.height} ${style.order} ${
                                            entry.isCurrentUser ? 'ring-4 ring-banana-300' : ''
                                        }`}
                                    >
                                        <span className="absolute -top-3 text-3xl">{MEDALS[entry.rank]}</span>
                                        <span
                                            className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${style.badge}`}
                                        >
                                            {style.label}
                                        </span>
                                        <Avatar entry={entry} size="lg" className="mt-2" />
                                        <p className="mt-2 line-clamp-2 font-display text-sm font-extrabold leading-tight text-banana-800 md:text-base">
                                            {entry.displayName}
                                            {entry.isCurrentUser && (
                                                <span className="ml-1 rounded-full bg-banana-300 px-1.5 py-0.5 text-[9px] uppercase text-banana-900">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="font-display text-2xl font-extrabold leading-none text-banana-700 md:text-3xl">
                                            {entry.totalPoints.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-banana-500">
                                            points
                                        </p>
                                        <p className="mt-auto pt-1 text-[10px] font-semibold text-banana-500 md:text-xs">
                                            🏆 {entry.gamesWon} wins · 🔥 {entry.bestStreak}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Remaining ranks */}
                    {!loading && rest.length > 0 && (
                        <div className="overflow-hidden rounded-3xl border-4 border-banana-300 bg-white/90 shadow-game">
                            <div className="flex items-center gap-3 border-b-2 border-banana-200 bg-banana-100/70 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-banana-600 md:px-4">
                                <span className="w-7 text-center md:w-9">#</span>
                                <span className="flex-1">Player</span>
                                <span className="hidden w-16 text-right sm:block">Wins</span>
                                <span className="hidden w-20 text-right sm:block">Best</span>
                                <span className="w-16 text-right md:w-20">Points</span>
                            </div>

                            {rest.map((entry, index) => (
                                <motion.div
                                    key={entry.rank}
                                    initial={{ x: -14, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                    className={`flex items-center gap-3 px-3 py-2.5 md:px-4 ${
                                        index !== rest.length - 1 ? 'border-b border-banana-100' : ''
                                    } ${
                                        entry.isCurrentUser
                                            ? 'bg-banana-200/80'
                                            : 'hover:bg-banana-50'
                                    }`}
                                >
                                    <div className="w-7 text-center font-display text-lg font-extrabold text-banana-700 md:w-9">
                                        {entry.rank}
                                    </div>
                                    <Avatar entry={entry} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold text-banana-800">
                                            {entry.displayName}
                                            {entry.isCurrentUser && (
                                                <span className="ml-1.5 rounded-full bg-banana-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-banana-900">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-banana-500 sm:hidden">
                                            🏆 {entry.gamesWon} · 🔥 {entry.bestStreak} · {entry.winRate}%
                                        </p>
                                    </div>
                                    <div className="hidden w-16 text-right text-sm font-bold text-banana-700 sm:block">
                                        {entry.gamesWon}
                                    </div>
                                    <div className="hidden w-20 text-right text-sm font-bold text-banana-700 sm:block">
                                        <span className="inline-flex items-center gap-1">
                                            <Flame size={13} className="text-orange-400" /> {entry.bestStreak}
                                        </span>
                                    </div>
                                    <div className="w-16 text-right font-display text-lg font-extrabold text-banana-700 md:w-20">
                                        {entry.totalPoints.toLocaleString()}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Footer CTA */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link to={user ? '/dashboard' : '/login'}>
                            <Button variant="secondary" className="!py-2.5 !text-base">
                                {user ? 'Back to dashboard' : 'Sign in to play'}
                            </Button>
                        </Link>
                        {user && (
                            <Link to="/achievements">
                                <Button variant="ghost" className="!py-2.5 !text-base">
                                    <Trophy size={16} /> View achievements
                                </Button>
                            </Link>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function Avatar({ entry, size = 'md', className = '' }) {
    const box = size === 'lg' ? 'h-14 w-14 md:h-16 md:w-16 text-lg' : 'h-9 w-9 text-sm';
    return (
        <div
            className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-banana-300 bg-banana-200 font-display font-extrabold text-banana-700 ${box} ${className}`}
        >
            {entry.avatar ? (
                <img src={entry.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
                initials(entry.displayName)
            )}
        </div>
    );
}
