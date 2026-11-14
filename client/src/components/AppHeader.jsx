import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    Flame,
    Trophy,
    X,
    LayoutDashboard,
    Gamepad2,
    Award,
    History,
    LogOut,
} from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import AudioControls from './AudioControls.jsx';
import Button from './Button.jsx';
import FullscreenButton from './FullscreenButton.jsx';
import { useAuth } from '../context/auth-context.js';
import { useSound } from '../hooks/useSound.js';
import { getLevel, initials } from '../lib/format.js';

const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
    { to: '/play', label: 'Play', icon: Gamepad2, authOnly: true },
    { to: '/history', label: 'History', icon: History, authOnly: true },
    { to: '/achievements', label: 'Achievements', icon: Award, authOnly: true },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    // { to: '/profile', label: 'Account', icon: User, authOnly: true },
];

export default function AppHeader({ className = '' }) {
    const { user, stats, logout, logoutAllDevices, logoutOtherDevices } = useAuth();
    const { play } = useSound();
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    const level = getLevel(stats?.totalPoints ?? 0);

    const handleLogout = async (allDevices = false) => {
        if (loggingOut) return;
        setLoggingOut(true);
        setLogoutError('');

        try {
            if (allDevices) await logoutAllDevices();
            else await logout();
            navigate('/', { replace: true });
        } catch (err) {
            setLogoutError(err.friendlyMessage || 'Could not log out. Please try again.');
            setLoggingOut(false);
        }
    };

    const handleLogoutOtherDevices = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        setLogoutError('');

        try {
            await logoutOtherDevices();
            setShowLogoutDialog(false);
        } catch (err) {
            setLogoutError(err.friendlyMessage || 'Could not sign out other devices. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    };

    const items = NAV.filter((item) => user || !item.authOnly);

    return (
        <header
            className={`sticky top-0 z-40 border-b-2 border-banana-300/70 bg-banana-50/85 shadow-[0_2px_0_rgba(107,50,0,0.06)] backdrop-blur-md ${className}`}
        >
            <div className="mx-auto flex w-full max-w-[1560px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5 lg:px-8">
                <Link to={user ? '/dashboard' : '/'} className="flex flex-shrink-0 items-center gap-2">
                    <BananaLogo size={40} className="animate-wiggle" />
                    <span className="hidden font-display text-xl font-extrabold text-banana-800 sm:inline">
                        Banana Quiz
                    </span>
                    {user && (
                        <span className="hidden rounded-full border-2 border-banana-400 bg-banana-300 px-2 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-banana-900 md:inline-flex">
                            Lv {level.level}
                        </span>
                    )}
                </Link>

                <nav
                    className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1"
                    aria-label="Main navigation"
                >
                    {items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            title={label}
                            onClick={() => play('click')}
                            className={({ isActive }) =>
                                `flex flex-shrink-0 items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-sm font-bold transition sm:px-2.5 md:px-3 ${
                                    isActive
                                        ? 'border-banana-400 bg-banana-300 text-banana-900 shadow-game-sm'
                                        : 'border-transparent text-banana-700 hover:border-banana-200 hover:bg-banana-200/60'
                                }`
                            }
                        >
                            <Icon size={18} />
                            <span className="hidden xl:inline">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="flex flex-shrink-0 items-center gap-1.5">
                    {user && (
                        <div className="hidden items-center gap-1.5 lg:flex">
                            <HudStat
                                icon={Trophy}
                                label="Total points"
                                value={stats?.totalPoints ?? 0}
                            />
                            <HudStat
                                icon={Flame}
                                label="Current streak"
                                value={stats?.currentStreak ?? 0}
                                tone="orange"
                            />
                        </div>
                    )}
                    <FullscreenButton />
                    <AudioControls compact />
                    {user ? (
                        <>
                            <Link
                                to="/profile"
                                title="Account settings"
                                className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-banana-300 bg-banana-200 font-display text-sm font-extrabold text-banana-700 sm:flex"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    initials(user.displayName)
                                )}
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    play('click');
                                    setLogoutError('');
                                    setShowLogoutDialog(true);
                                }}
                                title="Log out"
                                aria-label="Log out"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-banana-700 transition hover:bg-banana-200/60"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-xl bg-gradient-to-b from-banana-400 to-banana-600 px-4 py-2 font-display font-bold text-white shadow-game-sm transition hover:brightness-105 active:translate-y-0.5"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
            {showLogoutDialog && (
                <LogoutDialog
                    loading={loggingOut}
                    error={logoutError}
                    onClose={() => {
                        if (!loggingOut) setShowLogoutDialog(false);
                    }}
                    onLogout={() => handleLogout(false)}
                    onLogoutOtherDevices={handleLogoutOtherDevices}
                    onLogoutAll={() => handleLogout(true)}
                />
            )}
        </header>
    );
}

function HudStat({ icon: Icon, label, value, tone = 'banana' }) {
    const tones = {
        banana: 'border-banana-300 bg-banana-100 text-banana-800',
        orange: 'border-orange-300 bg-orange-100 text-orange-800',
    };

    return (
        <div
            title={label}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1 shadow-game-sm ${tones[tone]}`}
        >
            <Icon size={15} />
            <span className="font-display text-sm font-extrabold leading-none">{value}</span>
        </div>
    );
}

function LogoutDialog({ loading, error, onClose, onLogout, onLogoutOtherDevices, onLogoutAll }) {
    return (
        <div
            className="absolute right-3 top-full z-50 w-[min(calc(100vw-1.5rem),24rem)] pt-2 md:right-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-dialog-title"
                className="rounded-3xl border-4 border-banana-300 bg-banana-50 p-5 shadow-game"
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 id="logout-dialog-title" className="font-display text-2xl font-extrabold text-banana-900">
                            Log out?
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-banana-700">
                            Choose whether to end this session or sign out everywhere.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close logout dialog"
                        className="rounded-xl p-2 text-banana-700 hover:bg-banana-200 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700" role="alert">
                        {error}
                    </p>
                )}

                <div className="grid gap-3">
                    <Button onClick={onLogout} disabled={loading}>
                        <LogOut size={18} /> {loading ? 'Logging out…' : 'Log out'}
                    </Button>
                    <Button variant="secondary" onClick={onLogoutOtherDevices} disabled={loading}>
                        <LogOut size={18} /> Sign out other devices
                    </Button>
                    <Button variant="danger" onClick={onLogoutAll} disabled={loading}>
                        <LogOut size={18} /> Log out all devices
                    </Button>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
