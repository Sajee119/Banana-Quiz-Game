import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    ChevronDown,
    CircleAlert,
    Crown,
    EyeOff,

    LocateFixed,
    Medal,
    Play,
    RefreshCw,
    Search,
    Target,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import StatCard from '../components/StatCard.jsx';
import { userApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { initials } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MEDALS = { 1: '1', 2: '2', 3: '3' };
const PAGE_SIZE = 25;
const MAX_FETCH = 100;

const PODIUM_STYLES = {
    1: {
        ring: 'border-yellow-400',
        badge: 'bg-yellow-300 text-yellow-900',
        bg: 'bg-gradient-to-b from-yellow-50 to-white',
        height: 'md:min-h-[238px]',
        order: 'order-2',
        label: 'Champion',
    },
    2: {
        ring: 'border-slate-300',
        badge: 'bg-slate-200 text-slate-700',
        bg: 'bg-gradient-to-b from-slate-50 to-white',
        height: 'md:min-h-[200px]',
        order: 'order-1',
        label: 'Runner-up',
    },
    3: {
        ring: 'border-amber-400',
        badge: 'bg-amber-200 text-amber-800',
        bg: 'bg-gradient-to-b from-amber-50 to-white',
        height: 'md:min-h-[180px]',
        order: 'order-3',
        label: 'Third place',
    },
};

function formatPoints(value) {
    return (Number(value) || 0).toLocaleString();
}

export default function LeaderboardPage() {
    usePageTitle('Leaderboard');
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [me, setMe] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadToken, setReloadToken] = useState(0);
    const [query, setQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const myRowRef = useRef(null);
    const pendingScroll = useRef(false);

    useEffect(() => {
        let active = true;
        userApi
            .leaderboard(MAX_FETCH)
            .then((res) => {
                if (!active) return;
                setEntries(Array.isArray(res.data) ? res.data : []);
                setMe(res.me || null);
                setTotal(res.total || 0);
            })
            .catch((err) => {
                if (!active) return;
                setError(err.friendlyMessage || 'Could not load the leaderboard.');
                setEntries([]);
                setMe(null);
                setTotal(0);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reloadToken]);

    const searchTerm = query.trim().toLowerCase();
    const isSearching = searchTerm.length > 0;

    const filtered = useMemo(
        () =>
            isSearching
                ? entries.filter((entry) =>
                      String(entry.displayName || '')
                          .toLowerCase()
                          .includes(searchTerm)
                  )
                : entries,
        [entries, isSearching, searchTerm]
    );

    const podium = isSearching ? [] : entries.slice(0, 3);
    const listEntries = isSearching
        ? filtered.slice(0, visibleCount)
        : entries.slice(3, visibleCount);
    const hasMore = (isSearching ? filtered.length : entries.length) > visibleCount;
    const shownCount = Math.min(
        visibleCount,
        isSearching ? filtered.length : entries.length
    );

    const myRank = me && !me.hidden && me.rank ? me.rank : null;
    const above =
        myRank && myRank > 1 ? entries.find((entry) => entry.rank === myRank - 1) : null;
    const gapToNext =
        above && me
            ? Math.max(
                  1,
                  (Number(above.totalPoints) || 0) - (Number(me.totalPoints) || 0) + 1
              )
            : 0;
    const percentile =
        myRank && total ? Math.max(1, Math.round((myRank / total) * 100)) : null;

    const topScore = Number(entries[0]?.totalPoints) || 0;
    const averagePoints = entries.length
        ? Math.round(
              entries.reduce((sum, entry) => sum + (Number(entry.totalPoints) || 0), 0) /
                  entries.length
          )
        : 0;

    const refresh = () => {
        setLoading(true);
        setError('');
        setVisibleCount(PAGE_SIZE);
        setReloadToken((token) => token + 1);
    };

    // Scroll to the signed-in player's row once it is rendered.
    useEffect(() => {
        if (!pendingScroll.current) return;
        const node = myRowRef.current;
        if (!node) return;
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pendingScroll.current = false;
    }, [visibleCount, query, entries]);

    const jumpToMe = () => {
        if (!myRank) return;
        setQuery('');

        if (myRank <= 3) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        pendingScroll.current = true;
        setVisibleCount((count) => Math.max(count, myRank));

        window.requestAnimationFrame(() => {
            if (!myRowRef.current) return;
            myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            pendingScroll.current = false;
        });
    };

    const clearSearch = () => {
        setQuery('');
        setVisibleCount(PAGE_SIZE);
    };

    return (
        <div className="min-h-screen">
            <AppHeader />

            <main className="mx-auto w-full max-w-[1560px] px-4 py-6 md:px-6 md:py-8">
                <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <section className="mb-5 overflow-hidden rounded-[1.75rem] border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 p-5 shadow-game sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-300 bg-banana-100 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                    <Trophy size={13} /> Rankings
                                </p>
                                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-banana-900 md:text-4xl">
                                    Leaderboard
                                </h1>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-banana-800">
                                    Ranked by total points. Ties are broken by wins, then best streak.
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-bold text-banana-800">
                                    <span className="inline-flex items-center gap-1 rounded-full border border-banana-300 bg-white px-2.5 py-1 shadow-game-sm">
                                        <Users size={12} /> {total} ranked {total === 1 ? 'player' : 'players'}
                                    </span>
                                    {entries.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-banana-300 bg-white px-2.5 py-1 shadow-game-sm">
                                            <BarChart3 size={12} /> Top {entries.length} loaded
                                        </span>
                                    )}
                                    {myRank && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-emerald-800">
                                            <LocateFixed size={12} /> You are #{myRank}
                                        </span>
                                    )}
                                    {me?.hidden && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-amber-900">
                                            <EyeOff size={12} /> Hidden from board
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={refresh}
                                    className="!px-3 !py-2 !text-sm"
                                    aria-label="Refresh leaderboard"
                                >
                                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                                    Refresh
                                </Button>
                                {myRank && (
                                    <Button
                                        variant="secondary"
                                        onClick={jumpToMe}
                                        className="!px-3 !py-2 !text-sm"
                                    >
                                        <LocateFixed size={15} /> Jump to me
                                    </Button>
                                )}
                                <Link to={user ? '/play' : '/login'}>
                                    <Button className="!px-3 !py-2 !text-sm">
                                        <Play size={15} /> {user ? 'Play a round' : 'Sign in to play'}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Summary stats */}
                    {!loading && entries.length > 0 && (
                        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <StatCard
                                icon={<Crown size={18} />}
                                label="Top score"
                                value={formatPoints(topScore)}
                                hint={entries[0]?.displayName}
                                color="from-yellow-300 to-amber-500"
                            />
                            <StatCard
                                icon={<BarChart3 size={18} />}
                                label="Average"
                                value={formatPoints(averagePoints)}
                                hint={`Across top ${entries.length}`}
                                color="from-sky-300 to-sky-500"
                            />
                            <StatCard
                                icon={<Users size={18} />}
                                label="Players"
                                value={formatPoints(total)}
                                hint={total > entries.length ? `Top ${entries.length} shown` : 'All ranked'}
                                color="from-banana-300 to-banana-500"
                            />
                            <StatCard
                                icon={<LocateFixed size={18} />}
                                label="Your rank"
                                value={
                                    me?.hidden ? 'Hidden' : myRank ? `#${myRank}` : '—'
                                }
                                hint={
                                    me?.hidden
                                        ? 'Visibility is off'
                                        : percentile
                                          ? `Top ${percentile}%`
                                          : 'Play to get ranked'
                                }
                                color="from-emerald-300 to-emerald-500"
                            />
                        </div>
                    )}

                    {/* Your position */}
                    {user && (
                        <div className="mb-5">
                            {me && !me.hidden && (
                                <Card className="relative overflow-hidden !p-4 md:!p-5">
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-banana-300 to-banana-500"
                                    />
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl border-4 border-banana-300 bg-gradient-to-br from-banana-300 to-banana-500 font-display text-white shadow-game-sm">
                                            <span className="text-[9px] font-extrabold uppercase tracking-wide text-white/80">
                                                Rank
                                            </span>
                                            <span className="text-xl font-extrabold leading-none">
                                                #{me.rank}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-banana-500">
                                                Your position
                                            </p>
                                            <p className="flex flex-wrap items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                                                {me.rank === 1
                                                    ? 'You are the top banana!'
                                                    : `You are #${me.rank} of ${total}`}
                                                {percentile && (
                                                    <span className="rounded-full border-2 border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">
                                                        Top {percentile}%
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs font-semibold text-banana-600">
                                                {formatPoints(me.totalPoints)} pts · {me.gamesWon}{' '}
                                                wins · best streak {me.bestStreak}
                                            </p>
                                            {myRank === 1 ? (
                                                <p className="mt-1 text-xs font-semibold text-emerald-600">
                                                    Defend your crown — keep the streak alive.
                                                </p>
                                            ) : gapToNext > 0 ? (
                                                <p className="mt-1 text-xs font-semibold text-banana-600">
                                                    {formatPoints(gapToNext)} pts to reach #
                                                    {myRank - 1}
                                                    {above?.displayName
                                                        ? ` · ${above.displayName}`
                                                        : ''}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="secondary"
                                                onClick={jumpToMe}
                                                className="!py-2.5 !text-base"
                                            >
                                                <LocateFixed size={16} /> Jump to me
                                            </Button>
                                            <Link to="/play">
                                                <Button className="!py-2.5 !text-base">
                                                    <Play size={16} /> Play a round
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {me?.hidden && (
                                <Card className="relative overflow-hidden !p-4 md:!p-5">
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-banana-200 to-banana-400"
                                    />
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-600">
                                            <EyeOff size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-lg font-extrabold text-banana-800">
                                                You are hidden from the public board
                                            </p>
                                            <p className="text-xs font-semibold text-banana-600">
                                                Your {formatPoints(me.totalPoints)} points still
                                                count — turn visibility back on in account settings to
                                                appear in the rankings.
                                            </p>
                                        </div>
                                        <Link to="/profile">
                                            <Button
                                                variant="secondary"
                                                className="!py-2.5 !text-base"
                                            >
                                                Account settings <ArrowRight size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            )}

                            {!me && !loading && (
                                <Card className="relative overflow-hidden !p-4 md:!p-5">
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-banana-200 to-banana-400"
                                    />
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-600">
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
                        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
                            <CircleAlert size={18} className="text-red-500" />
                            <p className="flex-1 text-sm font-semibold text-red-700">{error}</p>
                            <Button
                                variant="secondary"
                                onClick={refresh}
                                className="!py-1.5 !text-sm"
                            >
                                <RefreshCw size={14} /> Try again
                            </Button>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 items-end gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-44 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60"
                                    />
                                ))}
                            </div>
                            <div className="h-64 animate-pulse rounded-3xl border-2 border-banana-200 bg-white/60" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && entries.length === 0 && (
                        <Card className="py-12 text-center">
                            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-500">
                                <Medal size={34} />
                            </span>
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

                    {/* Search + board toolbar */}
                    {!loading && entries.length > 0 && (
                        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-banana-200 bg-white p-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-banana-500"
                                />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setVisibleCount(PAGE_SIZE);
                                    }}
                                    placeholder="Search players by name…"
                                    aria-label="Search players"
                                    autoComplete="off"
                                    className="w-full rounded-lg border border-banana-200 bg-banana-50 py-2 pl-9 pr-9 text-sm text-banana-900 outline-none transition focus:border-banana-400 focus:bg-white"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-banana-600 transition hover:bg-banana-100"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-banana-700 sm:text-right">
                                <span className="inline-flex items-center gap-1 rounded-md bg-banana-100 px-2 py-1">
                                    {isSearching
                                        ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`
                                        : `Showing ${shownCount} of ${entries.length}`}
                                </span>
                                {!isSearching && total > entries.length && (
                                    <span className="mt-1 block text-banana-600">
                                        Top {entries.length} of {total} ranked
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No search results */}
                    {!loading && isSearching && filtered.length === 0 && (
                        <Card className="py-10 text-center">
                            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-500">
                                <Search size={30} />
                            </span>
                            <h2 className="font-display text-2xl font-extrabold text-banana-800">
                                No players found
                            </h2>
                            <p className="mt-1 text-banana-600">
                                Nobody in the top {entries.length} matches “{query.trim()}”.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={clearSearch}
                                className="mt-4 !py-2 !text-base"
                            >
                                <X size={16} /> Clear search
                            </Button>
                        </Card>
                    )}

                    {/* Podium */}
                    {!loading && podium.length > 0 && (
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                            {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => {
                                const isTop = entry.rank === 1;
                                return (
                                    <motion.div
                                        key={entry.rank}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: entry.rank * 0.04 }}
                                        className={`relative flex flex-col items-center rounded-2xl border-2 p-4 text-center shadow-game-sm ${
                                            isTop
                                                ? 'border-banana-400 bg-gradient-to-b from-banana-100 to-white'
                                                : 'border-banana-300 bg-gradient-to-b from-white to-banana-50/60'
                                        } ${PODIUM_STYLES[entry.rank]?.order || ''} ${
                                            entry.isCurrentUser ? 'ring-2 ring-banana-500 ring-offset-1' : ''
                                        }`}
                                    >
                                        <span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm font-bold shadow-game-sm ${isTop ? 'border-yellow-400 bg-yellow-300 text-yellow-900' : 'border-banana-300 bg-banana-100 text-banana-900'}`}>
                                            {MEDALS[entry.rank] || entry.rank}
                                        </span>
                                        <Avatar entry={entry} size="lg" />
                                        <p className="mt-2 line-clamp-2 font-display text-base leading-tight text-banana-900">
                                            {entry.displayName}
                                            {entry.isCurrentUser && (
                                                <span className="ml-1 rounded-full bg-banana-200 px-1.5 py-0.5 text-[10px] text-banana-900">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-1 font-display text-2xl leading-none text-banana-900 tabular-nums">
                                            {formatPoints(entry.totalPoints)}
                                        </p>
                                        <p className="text-xs text-banana-700">points</p>
                                        <p className="mt-2 text-xs text-banana-700">
                                            {entry.gamesWon} wins · best streak {entry.bestStreak}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Ranked list */}
                    {!loading && listEntries.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/40 shadow-game-sm">
                            <div className="flex items-center gap-3 border-b-2 border-banana-200 bg-banana-100/70 px-3 py-2.5 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 md:px-4">
                                <span className="w-7 text-center md:w-9">#</span>
                                <span className="flex-1">Player</span>
                                <span className="hidden w-16 text-right sm:block">Wins</span>
                                <span className="hidden w-20 text-right sm:block">Best</span>
                                <span className="hidden w-14 text-right lg:block">Win %</span>
                                <span className="w-16 text-right md:w-20">Points</span>
                            </div>

                            {listEntries.map((entry, index) => (
                                <div
                                    key={entry.rank}
                                    ref={entry.isCurrentUser ? myRowRef : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 md:px-4 transition-colors ${
                                        index !== listEntries.length - 1 ? 'border-b border-banana-200' : ''
                                    } ${
                                        entry.isCurrentUser ? 'bg-banana-100/90 border-l-4 border-l-banana-500' : 'hover:bg-banana-50/80'
                                    }`}
                                >
                                    <div className="w-7 text-center font-display text-base text-banana-900 tabular-nums md:w-9">
                                        {entry.rank}
                                    </div>
                                    <Avatar entry={entry} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-banana-900">
                                            {entry.displayName}
                                            {entry.isCurrentUser && (
                                                <span className="ml-1.5 rounded-full bg-banana-200 px-1.5 py-0.5 text-[10px] text-banana-900">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-banana-700 sm:hidden">
                                            {entry.gamesWon} wins · best {entry.bestStreak} · {entry.winRate}%
                                        </p>
                                    </div>
                                    <div className="hidden w-16 text-right text-sm text-banana-900 tabular-nums sm:block">
                                        {entry.gamesWon}
                                    </div>
                                    <div className="hidden w-20 text-right text-sm text-banana-900 tabular-nums sm:block">
                                        {entry.bestStreak}
                                    </div>
                                    <div className="hidden w-14 text-right text-sm text-banana-900 tabular-nums lg:block">
                                        {entry.winRate}%
                                    </div>
                                    <div className="w-16 text-right font-display text-base text-banana-900 tabular-nums md:w-20">
                                        {formatPoints(entry.totalPoints)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load more */}
                    {!loading && hasMore && (
                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                                className="!py-2 !text-sm"
                            >
                                <ChevronDown size={15} /> Show more players
                            </Button>
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

                    <p className="mt-4 text-center text-[11px] font-semibold text-banana-500">
                        Only players who share their profile appear on the public board.
                    </p>
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
