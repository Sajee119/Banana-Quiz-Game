import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Gamepad2,
    Award,
    Trophy,
    User,
    LogOut,
    History,
    X,
} from 'lucide-react';
import BananaLogo from './BananaLogo.jsx';
import AudioControls from './AudioControls.jsx';
import Button from './Button.jsx';
import { useAuth } from '../context/auth-context.js';
import { initials } from '../lib/format.js';

const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
    { to: '/play', label: 'Play', icon: Gamepad2, authOnly: true },
    { to: '/history', label: 'History', icon: History, authOnly: true },
    { to: '/achievements', label: 'Achievements', icon: Award, authOnly: true },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'Account', icon: User, authOnly: true },
];

export default function AppHeader({ className = '' }) {
    const { user, logout, logoutAllDevices, logoutOtherDevices } = useAuth();
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

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
        <header className={`sticky top-0 z-30 border-b-2 border-banana-200/80 bg-banana-50/90 backdrop-blur ${className}`}>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 md:px-6">
                <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
                    <BananaLogo size={38} className="animate-wiggle" />
                    <span className="hidden font-display text-xl font-extrabold text-banana-800 sm:inline">
                        Banana Quiz
                    </span>
                </Link>

                <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
                    {items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            title={label}
                            className={({ isActive }) =>
                                `flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold transition sm:px-2.5 md:px-3 ${
                                    isActive
                                        ? 'bg-banana-300 text-banana-900 shadow-game-sm'
                                        : 'text-banana-700 hover:bg-banana-200/60'
                                }`
                            }
                        >
                            <Icon size={18} />
                            <span className="hidden lg:inline">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-1.5">
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
