import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Award,
    Flame,
    ShieldCheck,
    Sparkles,
    Trophy,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Card from '../components/Card.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { evaluatePassword } from '../lib/passwordStrength.js';

const inputClass =
    'w-full rounded-2xl border-2 border-banana-200 bg-white px-4 py-3 font-semibold text-banana-900 placeholder:text-banana-400 focus:border-banana-400 focus:outline-none';

const BENEFITS = [
    {
        icon: Flame,
        title: 'Keep your streaks',
        text: 'Every correct answer is saved, so your best run is always waiting for you.',
    },
    {
        icon: Trophy,
        title: 'Climb the leaderboard',
        text: 'Compare points, wins and best streaks with banana counters around the world.',
    },
    {
        icon: Award,
        title: 'Unlock achievements',
        text: 'Fourteen badges reward speed, accuracy, persistence and mode mastery.',
    },
    {
        icon: ShieldCheck,
        title: 'Your account, your rules',
        text: 'Password or social sign-in, plus controls for privacy, audio and motion.',
    },
];

export default function LoginPage() {
    const { user, loading, signIn } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState(
        searchParams.get('error') === 'oauth_failed' ? 'Login failed. Please try again.' : ''
    );
    const [submitting, setSubmitting] = useState(false);

    usePageTitle(mode === 'register' ? 'Create account' : 'Sign in');

    useEffect(() => {
        if (!loading && user) navigate('/dashboard', { replace: true });
    }, [user, loading, navigate]);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
        if (error) setError('');
    };

    const switchMode = (nextMode) => {
        if (submitting || nextMode === mode) return;
        setMode(nextMode);
        setError('');
        setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        setError('');

        if (mode === 'register') {
            const policy = evaluatePassword(form.password, {
                email: form.email,
                name: form.name,
            });
            if (!policy.valid) {
                setError(policy.message);
                return;
            }
            if (form.password !== form.confirmPassword) {
                setError('The passwords do not match. Please re-enter them.');
                return;
            }
        }

        setSubmitting(true);
        try {
            if (mode === 'register') {
                await signIn(() =>
                    authApi.register({
                        name: form.name,
                        email: form.email,
                        password: form.password,
                    })
                );
            } else {
                await signIn(() =>
                    authApi.login({ email: form.email, password: form.password })
                );
            }
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.friendlyMessage || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isRegister = mode === 'register';

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

            <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-8 lg:grid-cols-2 lg:gap-14">
                {/* Desktop introduction */}
                <section className="hidden lg:block">
                    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-banana-600">
                        <Sparkles size={15} /> Free browser game
                    </p>
                    <h2 className="mt-2 font-display text-5xl font-extrabold leading-[1.05] text-banana-800">
                        Save your streak.
                        <br />
                        <span className="text-banana-500">Climb the board.</span>
                    </h2>
                    <p className="mt-4 max-w-md text-lg text-banana-700">
                        One account keeps your points, achievements and best runs together on
                        every device.
                    </p>

                    <ul className="mt-7 space-y-4">
                        {BENEFITS.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex gap-3">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-banana-200 text-banana-700">
                                    <Icon size={19} />
                                </span>
                                <span>
                                    <span className="block font-display text-lg font-extrabold leading-tight text-banana-800">
                                        {title}
                                    </span>
                                    <span className="block text-sm text-banana-600">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mx-auto w-full max-w-md"
                >
                    <Card className="text-center">
                        <BananaLogo size={92} className="mx-auto mb-3 animate-wiggle" />
                        <p className="mb-1 font-display text-sm font-extrabold uppercase tracking-widest text-banana-500">
                            Banana Quiz
                        </p>
                        <h1 className="mb-2 font-display text-4xl font-extrabold text-banana-800">
                            {isRegister ? 'Join the bunch!' : 'Welcome back!'}
                        </h1>
                        <p className="mb-6 text-banana-700">
                            {isRegister
                                ? 'Create a free account to save your scores and streaks.'
                                : 'Sign in to pick up where you left off.'}
                        </p>

                        <div
                            role="tablist"
                            aria-label="Sign in or create an account"
                            className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-banana-100 p-1"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === 'login'}
                                disabled={submitting}
                                onClick={() => switchMode('login')}
                                className={`rounded-xl px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed ${
                                    mode === 'login'
                                        ? 'bg-white text-banana-800 shadow-game-sm'
                                        : 'text-banana-600 hover:text-banana-800'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === 'register'}
                                disabled={submitting}
                                onClick={() => switchMode('register')}
                                className={`rounded-xl px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed ${
                                    mode === 'register'
                                        ? 'bg-white text-banana-800 shadow-game-sm'
                                        : 'text-banana-600 hover:text-banana-800'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                aria-live="polite"
                                className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3 text-left">
                            {isRegister && (
                                <div>
                                    <label htmlFor="name" className="mb-1 block text-sm font-bold text-banana-700">
                                        Display name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        minLength={2}
                                        maxLength={60}
                                        autoComplete="name"
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={updateField('name')}
                                        className={inputClass}
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="mb-1 block text-sm font-bold text-banana-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    maxLength={254}
                                    inputMode="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={updateField('email')}
                                    className={inputClass}
                                />
                            </div>

                            <PasswordInput
                                id="password"
                                label="Password"
                                value={form.password}
                                onChange={updateField('password')}
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                                minLength={isRegister ? 8 : undefined}
                                placeholder={
                                    isRegister ? 'At least 8 characters' : 'Your password'
                                }
                                labelAction={
                                    !isRegister ? (
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-bold text-banana-600 underline hover:text-banana-800"
                                        >
                                            Forgot password?
                                        </Link>
                                    ) : null
                                }
                            />

                            {isRegister && (
                                <>
                                    <PasswordStrengthMeter
                                        password={form.password}
                                        email={form.email}
                                        name={form.name}
                                    />
                                    <PasswordInput
                                        id="confirmPassword"
                                        label="Confirm password"
                                        value={form.confirmPassword}
                                        onChange={updateField('confirmPassword')}
                                        autoComplete="new-password"
                                        minLength={8}
                                        placeholder="Repeat your password"
                                    />
                                    {form.confirmPassword.length > 0 &&
                                        form.password !== form.confirmPassword && (
                                            <p className="text-xs font-semibold text-red-600">
                                                The passwords do not match yet.
                                            </p>
                                        )}
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-gradient-to-b from-banana-400 to-banana-600 px-4 py-3 font-display text-lg font-bold text-white shadow-game-sm transition hover:brightness-105 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting
                                    ? 'Please wait…'
                                    : isRegister
                                        ? 'Create Account'
                                        : 'Sign In'}
                            </button>
                        </form>

                        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-banana-400">
                            <span className="h-px flex-1 bg-banana-200" />
                            or continue with
                            <span className="h-px flex-1 bg-banana-200" />
                        </div>

                        <div className="space-y-3">
                            <a
                                href={authApi.googleLoginUrl}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 shadow-game-sm transition hover:bg-gray-50 active:translate-y-1 active:shadow-none"
                            >
                                <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.3 35.4 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
                                </svg>
                                Continue with Google
                            </a>
                            <a
                                href={authApi.facebookLoginUrl}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-4 py-3 font-bold text-white shadow-game-sm transition hover:bg-[#166fe0] active:translate-y-1 active:shadow-none"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                                    <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z"/>
                                </svg>
                                Continue with Facebook
                            </a>
                        </div>

                        <p className="mt-6 text-xs text-banana-600">
                            Passwords are hashed and never stored in plain text.
                        </p>
                        <Link
                            to="/"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-banana-600 underline hover:text-banana-800"
                        >
                            <ArrowLeft size={13} /> Back to home
                        </Link>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
