import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import PublicPageHeader from '../components/PublicPageHeader.jsx';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { evaluatePassword } from '../lib/passwordStrength.js';
import {
    forgetRememberedLogin,
    readRememberedLogin,
    rememberLogin,
} from '../lib/rememberMe.js';

const inputClass =
    'w-full rounded-2xl border-2 border-banana-300 bg-white/90 px-4 py-3 font-body text-banana-900 shadow-game-sm outline-none transition placeholder:text-banana-400 focus:border-banana-500';

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
    const [searchParams, setSearchParams] = useSearchParams();

    const [rememberedLogin] = useState(readRememberedLogin);
    const [mode, setMode] = useState(
        searchParams.get('mode') === 'register' ? 'register' : 'login'
    );
    const [remember, setRemember] = useState(Boolean(rememberedLogin?.email));
    const [form, setForm] = useState({
        name: '',
        email: rememberedLogin?.email || '',
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

    const requestedMode = searchParams.get('mode');
    useEffect(() => {
        if (requestedMode === 'register') setMode('register');
        else if (requestedMode === 'login') setMode('login');
    }, [requestedMode]);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
        if (error) setError('');
    };

    const switchMode = (nextMode) => {
        if (submitting || nextMode === mode) return;
        setMode(nextMode);
        setSearchParams(nextMode === 'register' ? { mode: 'register' } : {}, { replace: true });
        setError('');
        setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    };

    const persistRememberChoice = () => {
        if (remember) rememberLogin({ email: form.email });
        else forgetRememberedLogin();
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
                const data = await authApi.register({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                });

                if (data.requiresVerification && data.verificationId) {
                    navigate(
                        `/verify-email?verificationId=${encodeURIComponent(
                            data.verificationId
                        )}&purpose=registration`,
                        {
                            replace: true,
                            state: {
                                email: data.email,
                                devOtp: data.devOtp,
                                expiresAt: data.expiresAt,
                            },
                        }
                    );
                    return;
                }

                await signIn(async () => data);
            } else {
                const data = await authApi.login({
                    email: form.email,
                    password: form.password,
                    remember,
                });

                // When email two-factor is on, the password is only the first
                // step. The emailed code finishes the sign-in on the next page.
                if (data.requiresVerification && data.verificationId) {
                    persistRememberChoice();
                    navigate(
                        `/verify-email?verificationId=${encodeURIComponent(
                            data.verificationId
                        )}&purpose=login_2fa`,
                        {
                            replace: true,
                            state: {
                                email: data.email,
                                devOtp: data.devOtp,
                                expiresAt: data.expiresAt,
                            },
                        }
                    );
                    return;
                }

                await signIn(async () => data);
                persistRememberChoice();
            }
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.friendlyMessage || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isRegister = mode === 'register';
    const oauthRememberQuery = remember ? '?remember=1' : '';

    return (
        <div className="flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-5">
            <PublicPageHeader />

            <main className="mx-auto flex w-full flex-1 flex-col py-4 sm:py-6">
                <motion.section
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="grid w-full flex-1 overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 shadow-game lg:grid-cols-[1.05fr_1fr]"
                >
                    {/* Desktop introduction panel */}
                    <aside className="banana-promo-panel relative hidden overflow-hidden rounded-2xl border-2 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-amber-500 p-8 lg:flex lg:flex-col xl:p-10">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[20px] border-white/20" />
                        <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full border-[20px] border-white/15" />
                        <BananaLogo
                            size={240}
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-12 -right-10 rotate-12 opacity-15"
                        />

                        <div className="relative flex flex-1 flex-col">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-900 shadow-game-sm">
                                <Sparkles size={14} /> Free browser game
                            </span>

                            <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.03] text-banana-900 xl:text-5xl">
                                Your bunch is
                                <br />
                                <span className="text-white drop-shadow-[0_3px_0_rgba(107,50,0,0.28)]">
                                    waiting for you.
                                </span>
                            </h2>
                            <p className="mt-4 max-w-md text-lg font-semibold text-banana-900/80">
                                One account keeps your points, achievements and best runs
                                together on every device.
                            </p>

                            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                                {BENEFITS.map(({ icon: Icon, title, text }) => (
                                    <li
                                        key={title}
                                        className="flex gap-3 rounded-2xl border-2 border-white/50 bg-banana-50/70 p-3.5 backdrop-blur-sm"
                                    >
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-500/30 bg-white/80 text-banana-700">
                                            <Icon size={19} />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-display text-base font-extrabold leading-tight text-banana-900">
                                                {title}
                                            </span>
                                            <span className="mt-0.5 block text-xs font-semibold leading-snug text-banana-900/75">
                                                {text}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-8 text-[11px] font-bold uppercase tracking-wide text-banana-900">
                                <span className="rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                    3 game modes
                                </span>
                                <span className="rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                    14 achievements
                                </span>
                                <span className="rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                    Global leaderboard
                                </span>
                            </div>
                        </div>
                    </aside>

                    {/* Auth panel */}
                    <div className="relative flex flex-col justify-center bg-white/90 p-5 sm:p-8 lg:p-10 xl:p-12">
                        {/* Compact brand strip for small screens */}
                        <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-banana-400 bg-gradient-to-br from-banana-200 to-banana-300 p-3.5 shadow-game-sm lg:hidden">
                            <BananaLogo size={46} className="animate-wiggle" />
                            <div className="min-w-0">
                                <p className="font-display text-lg font-extrabold leading-none text-banana-900">
                                    Banana Quiz
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-banana-800">
                                    Calculate fast. Climb the board.
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-md">
                            <p className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                                Banana Quiz account
                            </p>
                            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-banana-900 sm:text-4xl">
                                {isRegister ? 'Join the bunch!' : 'Welcome back!'}
                            </h1>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-banana-800 sm:text-base">
                                {isRegister
                                    ? 'Create a free account to save your scores and streaks.'
                                    : 'Sign in to pick up where you left off.'}
                            </p>

                            <div
                                role="tablist"
                                aria-label="Sign in or create an account"
                                className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl border-2 border-banana-300 bg-banana-100/60 p-1.5"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === 'login'}
                                    disabled={submitting}
                                    onClick={() => switchMode('login')}
                                    className={`rounded-2xl border-2 px-3 py-2.5 font-display text-sm font-bold shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5 disabled:cursor-not-allowed ${
                                        mode === 'login'
                                            ? 'border-banana-400 bg-white text-banana-900'
                                            : 'border-banana-200 bg-white/70 text-banana-700'
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
                                    className={`rounded-2xl border-2 px-3 py-2.5 font-display text-sm font-bold shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5 disabled:cursor-not-allowed ${
                                        mode === 'register'
                                            ? 'border-banana-400 bg-white text-banana-900'
                                            : 'border-banana-200 bg-white/70 text-banana-700'
                                    }`}
                                >
                                    Create Account
                                </button>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    aria-live="polite"
                                    className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                                >
                                    {error}
                                </p>
                            )}

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-left">
                                {isRegister && (
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-1 block text-sm font-bold text-banana-800"
                                        >
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
                                    <label
                                        htmlFor="email"
                                        className="mb-1 block text-sm font-bold text-banana-800"
                                    >
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
                                    inputClassName={inputClass}
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
                                            inputClassName={inputClass}
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

                                {!isRegister && (
                                    <label
                                        htmlFor="remember"
                                        className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-banana-200 bg-white/80 px-3 py-2.5 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-50 active:translate-y-0.5"
                                    >
                                        <input
                                            id="remember"
                                            name="remember"
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(event) => setRemember(event.target.checked)}
                                            disabled={submitting}
                                            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-lg border-2 border-banana-400 accent-banana-500 focus:ring-banana-400 disabled:cursor-not-allowed"
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-banana-800">
                                                Remember me
                                            </span>
                                            <span className="block text-xs font-semibold text-banana-600">
                                                Keep me signed in on this device for 30 days.
                                            </span>
                                        </span>
                                    </label>
                                )}

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full !py-4 !text-xl"
                                >
                                    {submitting
                                        ? 'Please wait…'
                                        : isRegister
                                            ? 'Create Account'
                                            : 'Sign In'}
                                </Button>
                            </form>

                            <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-banana-600">
                                <span className="h-px flex-1 bg-banana-200" />
                                or continue with
                                <span className="h-px flex-1 bg-banana-200" />
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <a
                                    href={`${authApi.googleLoginUrl}${oauthRememberQuery}`}
                                    onClick={persistRememberChoice}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-banana-300 bg-white px-4 py-3 font-display text-sm font-bold text-banana-800 shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5"
                                >
                                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
                                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.3 35.4 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
                                    </svg>
                                    Google
                                </a>
                                <a
                                    href={`${authApi.facebookLoginUrl}${oauthRememberQuery}`}
                                    onClick={persistRememberChoice}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-banana-300 bg-white px-4 py-3 font-display text-sm font-bold text-banana-800 shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true" className="fill-banana-700">
                                        <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z" />
                                    </svg>
                                    Facebook
                                </a>
                            </div>

                            <p className="mt-5 text-center text-xs font-semibold leading-relaxed text-banana-600">
                                {isRegister
                                    ? 'We email a 6-digit code to confirm your address before your account is created.'
                                    : 'Passwords are hashed and never stored in plain text.'}
                            </p>
                            <p className="mt-2 text-center text-[11px] font-semibold text-banana-600">
                                <Link
                                    to="/terms"
                                    className="font-bold underline hover:text-banana-800"
                                >
                                    Terms
                                </Link>
                                <span className="mx-1.5">·</span>
                                <Link
                                    to="/privacy"
                                    className="font-bold underline hover:text-banana-800"
                                >
                                    Privacy
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
