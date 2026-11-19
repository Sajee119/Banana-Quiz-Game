import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    CircleAlert,
    Clock3,
    Mail,
    MailCheck,
    RefreshCw,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import OtpInput from '../components/OtpInput.jsx';
import PublicPageHeader from '../components/PublicPageHeader.jsx';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const INITIAL_STATUS = {
    loading: true,
    active: null,
    email: '',
    expiresAt: null,
    resendAvailableAt: null,
    resendCount: 0,
    resendLimit: 5,
    attemptsRemaining: 5,
};

const VERIFY_POINTS = [
    {
        icon: Mail,
        title: 'Six digits, nothing else',
        text: 'Type the code exactly as it appears in the email — no spaces or dashes.',
    },
    {
        icon: Clock3,
        title: 'Codes expire quickly',
        text: 'Each code is single-use and stops working on a short timer. Resend if it runs out.',
    },
    {
        icon: ShieldCheck,
        title: 'Stored as a hash',
        text: 'Verification codes are hashed on the server, so nobody can read them back.',
    },
];

function formatCountdown(seconds) {
    if (seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function VerifyEmailPage() {
    usePageTitle('Verify email');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading, signIn, setUser } = useAuth();

    const verificationId = searchParams.get('verificationId') || '';
    const isRegistration = searchParams.get('purpose') !== 'email_verification';
    const purpose = isRegistration ? 'registration' : 'email_verification';

    const [status, setStatus] = useState({
        ...INITIAL_STATUS,
        loading: Boolean(verificationId),
        email: location.state?.email || '',
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [devOtp, setDevOtp] = useState(location.state?.devOtp || '');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        let active = true;

        if (!verificationId) {
            setStatus((prev) => ({ ...prev, loading: false, active: false }));
            setError('This verification link is missing or invalid. Please start again.');
            return undefined;
        }

        authApi
            .verificationStatus({ verificationId, kind: purpose })
            .then((data) => {
                if (!active) return;
                setStatus({
                    loading: false,
                    active: Boolean(data.active),
                    email: data.email || location.state?.email || '',
                    expiresAt: data.expiresAt || null,
                    resendAvailableAt: data.resendAvailableAt || null,
                    resendCount: data.resendCount || 0,
                    resendLimit: data.resendLimit || 5,
                    attemptsRemaining: data.attemptsRemaining ?? 5,
                });
                if (!data.active) {
                    setError(data.message || 'This verification link is invalid or has expired.');
                }
            })
            .catch((err) => {
                if (!active) return;
                setStatus((prev) => ({ ...prev, loading: false, active: null }));
                setError(err.friendlyMessage || 'Could not check this verification link.');
            });

        return () => {
            active = false;
        };
    }, [verificationId, purpose, location.state?.email]);

    const secondsLeft = status.expiresAt
        ? Math.max(0, Math.ceil((new Date(status.expiresAt).getTime() - now) / 1000))
        : 0;
    const resendWait = status.resendAvailableAt
        ? Math.max(0, Math.ceil((new Date(status.resendAvailableAt).getTime() - now) / 1000))
        : 0;
    const expired =
        status.active === false || Boolean(status.expiresAt && secondsLeft <= 0);
    const resendLimitReached = status.resendCount >= status.resendLimit;
    const requiresSignIn = !isRegistration && !authLoading && !user;

    const maskedEmail = useMemo(
        () => status.email || location.state?.email || 'your email address',
        [status.email, location.state?.email]
    );

    const handleVerify = async (event) => {
        event.preventDefault();
        if (submitting || expired) return;

        setError('');
        setMessage('');

        if (!/^\d{6}$/.test(otp)) {
            setError('Enter the full 6-digit code from your email.');
            return;
        }

        setSubmitting(true);
        try {
            const data = isRegistration
                ? await authApi.verifyRegistration({ verificationId, otp })
                : await authApi.confirmEmailVerification({ verificationId, otp });

            if (isRegistration) {
                await signIn(async () => data);
                navigate('/dashboard', { replace: true, state: { justVerified: true } });
            } else {
                if (data.user) setUser(data.user);
                navigate('/profile?tab=security&verified=1', { replace: true });
            }
        } catch (err) {
            const payload = err.response?.data || {};
            setError(err.friendlyMessage || 'That code could not be verified. Please try again.');
            if (payload.attemptsRemaining !== undefined) {
                setStatus((prev) => ({ ...prev, attemptsRemaining: payload.attemptsRemaining }));
            }
            if (payload.expired || payload.locked) {
                setStatus((prev) => ({ ...prev, active: false }));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!verificationId || resending || resendWait > 0 || resendLimitReached) return;

        setResending(true);
        setError('');
        setMessage('');

        try {
            const data = isRegistration
                ? await authApi.resendRegistration(verificationId)
                : await authApi.resendEmailVerification(verificationId);

            setOtp('');
            setDevOtp(data.devOtp || '');
            setStatus((prev) => ({
                ...prev,
                active: true,
                email: data.email || prev.email,
                expiresAt: data.expiresAt || prev.expiresAt,
                resendAvailableAt:
                    data.resendAvailableAt ||
                    new Date(Date.now() + (data.resendAfterSeconds || 30) * 1000).toISOString(),
                resendCount: (prev.resendCount || 0) + 1,
            }));
            setMessage(data.message || 'A new verification code is on its way.');
        } catch (err) {
            const payload = err.response?.data || {};
            if (payload.retryAfter) {
                setStatus((prev) => ({
                    ...prev,
                    resendAvailableAt: new Date(
                        Date.now() + payload.retryAfter * 1000
                    ).toISOString(),
                }));
            }
            setError(err.friendlyMessage || 'Could not resend the code. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const headline = expired && !status.loading ? 'Code expired' : 'Check your inbox';
    const subtitle =
        expired && !status.loading
            ? 'This verification code can no longer be used. Request a fresh one to continue.'
            : isRegistration
              ? 'Confirm your email address to finish creating your Banana Quiz account.'
              : 'Confirm your email address to unlock recovery and security emails.';

    return (
        <div className="flex min-h-screen flex-col px-3 py-4 sm:px-6 sm:py-5">
            <PublicPageHeader />

            <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col py-4 sm:py-6">
                <motion.section
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="grid w-full flex-1 overflow-hidden rounded-[1.75rem] border-2 border-banana-400 bg-gradient-to-b from-white to-banana-50/70 shadow-game lg:grid-cols-[1fr_1.05fr]"
                >
                    {/* Desktop verification panel */}
                    <aside className="banana-promo-panel relative hidden overflow-hidden border-r-2 border-banana-400/30 bg-gradient-to-br from-banana-300 via-banana-400 to-amber-500 p-8 lg:flex lg:flex-col xl:p-10">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[20px] border-white/20" />
                        <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full border-[20px] border-white/15" />
                        <BananaLogo
                            size={240}
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-12 -right-10 rotate-12 opacity-15"
                        />

                        <div className="relative flex flex-1 flex-col">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-banana-900/20 bg-banana-900/10 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-banana-900">
                                <ShieldCheck size={14} /> Secure verification
                            </span>

                            <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.03] text-banana-900 xl:text-5xl">
                                One code.
                                <br />
                                <span className="text-white drop-shadow-[0_3px_0_rgba(107,50,0,0.28)]">
                                    Then you&apos;re in.
                                </span>
                            </h2>
                            <p className="mt-4 max-w-md text-lg font-semibold text-banana-900/80">
                                We only need a quick round trip through your inbox to prove the
                                address is really yours.
                            </p>

                            <ul className="mt-7 space-y-3">
                                {VERIFY_POINTS.map(({ icon: Icon, title, text }) => (
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

                            <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-8 text-[11px] font-extrabold uppercase tracking-wide text-banana-900/75">
                                <span className="rounded-full border-2 border-white/50 bg-banana-50/70 px-3 py-1.5">
                                    6-digit code
                                </span>
                                <span className="rounded-full border-2 border-white/50 bg-banana-50/70 px-3 py-1.5">
                                    Single use
                                </span>
                                <span className="rounded-full border-2 border-white/50 bg-banana-50/70 px-3 py-1.5">
                                    Expires automatically
                                </span>
                            </div>
                        </div>
                    </aside>

                    {/* Verification panel */}
                    <div className="relative flex flex-col justify-center bg-white/90 p-5 text-center sm:p-8 lg:p-10 xl:p-12">
                        {/* Compact brand strip for small screens */}
                        <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-banana-300 bg-gradient-to-br from-banana-200 to-banana-400 p-3.5 text-left lg:hidden">
                            <BananaLogo size={46} className="animate-wiggle" />
                            <div className="min-w-0">
                                <p className="font-display text-lg font-extrabold leading-none text-banana-900">
                                    Banana Quiz
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-banana-800">
                                    One quick code and you&apos;re in.
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-md">
                            <div
                                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-4 shadow-game-sm ${
                                    expired && !status.loading
                                        ? 'border-red-200 bg-red-50 text-red-500'
                                        : 'border-banana-300 bg-banana-100 text-banana-700'
                                }`}
                            >
                                {expired && !status.loading ? (
                                    <CircleAlert size={30} />
                                ) : (
                                    <Mail size={30} />
                                )}
                            </div>

                            <p className="flex items-center justify-center gap-1.5 font-display text-xs font-extrabold uppercase tracking-[0.2em] text-banana-500">
                                <Sparkles size={13} />{' '}
                                {isRegistration ? 'One last step' : 'Account security'}
                            </p>
                            <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight text-banana-800">
                                {headline}
                            </h1>
                            <p className="mt-2 text-sm font-semibold text-banana-700 sm:text-base">
                                {subtitle}
                            </p>

                            {status.loading && (
                                <div className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl border-2 border-banana-200 bg-banana-50 px-4 py-3">
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin text-banana-500"
                                    />
                                    <p className="text-sm font-semibold text-banana-700">
                                        Checking your verification link…
                                    </p>
                                </div>
                            )}

                            {!status.loading && !expired && (
                                <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-banana-200 bg-banana-50 px-4 py-3 text-left">
                                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-200 text-banana-700">
                                        <Mail size={17} />
                                    </span>
                                    <p className="text-sm font-semibold text-banana-700">
                                        We sent a 6-digit code to{' '}
                                        <strong className="break-all text-banana-900">
                                            {maskedEmail}
                                        </strong>
                                        . Enter it below to{' '}
                                        {isRegistration
                                            ? 'create your account'
                                            : 'confirm your email address'}
                                        .
                                    </p>
                                </div>
                            )}

                            {!status.loading && expired && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-left">
                                    <Clock3
                                        size={18}
                                        className="mt-0.5 flex-shrink-0 text-red-500"
                                    />
                                    <p className="text-sm font-semibold text-red-700">
                                        This verification code can no longer be used. Resend a
                                        fresh code below, or start the process again.
                                    </p>
                                </div>
                            )}

                            {requiresSignIn && (
                                <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                                    Your session has expired. Please{' '}
                                    <Link to="/login" className="underline">
                                        sign in
                                    </Link>{' '}
                                    and request a new code from your profile.
                                </div>
                            )}

                            {devOtp && !expired && (
                                <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-left">
                                    <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                                        Development code
                                    </p>
                                    <p className="mt-1 font-mono text-2xl font-bold tracking-[0.35em] text-amber-900">
                                        {devOtp}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-amber-700">
                                        Shown only when SMTP is unavailable in local development.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <p
                                    role="alert"
                                    aria-live="polite"
                                    className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700"
                                >
                                    <CircleAlert size={17} className="mt-0.5 flex-shrink-0" />
                                    {error}
                                </p>
                            )}

                            {message && (
                                <p
                                    role="status"
                                    className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-700"
                                >
                                    <Check size={17} className="mt-0.5 flex-shrink-0" />
                                    {message}
                                </p>
                            )}

                            {!status.loading && !expired && !requiresSignIn && (
                                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                                    <OtpInput
                                        id="verification-code"
                                        value={otp}
                                        onChange={setOtp}
                                        autoFocus
                                        disabled={submitting}
                                        invalid={Boolean(error)}
                                    />

                                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-extrabold">
                                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-50 px-2.5 py-1 text-banana-700">
                                            <Clock3 size={12} />
                                            {status.expiresAt
                                                ? `Expires in ${formatCountdown(secondsLeft)}`
                                                : 'Codes expire shortly'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full border-2 border-banana-200 bg-banana-50 px-2.5 py-1 text-banana-700">
                                            <ShieldCheck size={12} />
                                            {status.attemptsRemaining} attempt
                                            {status.attemptsRemaining === 1 ? '' : 's'} left
                                        </span>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting || otp.length !== 6}
                                        className="w-full !py-3.5 !text-base"
                                    >
                                        <ShieldCheck size={18} />
                                        {submitting ? 'Verifying…' : 'Verify code'}
                                    </Button>
                                </form>
                            )}

                            {!status.loading && (
                                <div className="mt-5 rounded-2xl border-2 border-dashed border-banana-200 bg-banana-50/70 px-4 py-3.5">
                                    <p className="text-xs font-semibold text-banana-600">
                                        Didn&apos;t get the email? Check your spam folder or request a
                                        new code.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={
                                            resending ||
                                            resendWait > 0 ||
                                            resendLimitReached ||
                                            !verificationId ||
                                            requiresSignIn
                                        }
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-banana-300 bg-white px-3 py-1.5 text-sm font-extrabold text-banana-700 shadow-game-sm transition hover:bg-banana-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={15}
                                            className={resending ? 'animate-spin' : ''}
                                        />
                                        {resendLimitReached
                                            ? 'Resend limit reached'
                                            : resendWait > 0
                                              ? `Resend in ${resendWait}s`
                                              : resending
                                                ? 'Sending…'
                                                : 'Resend code'}
                                    </button>
                                    <p className="mt-1.5 text-[11px] font-semibold text-banana-500">
                                        {status.resendCount}/{status.resendLimit} resends used
                                    </p>
                                </div>
                            )}

                            <div className="mt-5 flex flex-col items-center gap-2 text-xs font-bold">
                                {expired ? (
                                    <>
                                        <Link
                                            to={
                                                isRegistration
                                                    ? '/login?mode=register'
                                                    : '/profile?tab=security'
                                            }
                                            className="text-banana-700 underline hover:text-banana-900"
                                        >
                                            {isRegistration
                                                ? 'Start the sign-up again'
                                                : 'Request a new code from your profile'}
                                        </Link>
                                        {isRegistration && (
                                            <Link
                                                to="/login"
                                                className="inline-flex items-center gap-1 text-banana-600 underline hover:text-banana-800"
                                            >
                                                <ArrowLeft size={13} /> Back to sign in
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to={isRegistration ? '/login' : '/profile?tab=security'}
                                        className="inline-flex items-center gap-1 text-banana-600 underline hover:text-banana-800"
                                    >
                                        <ArrowLeft size={13} />{' '}
                                        {isRegistration ? 'Back to sign in' : 'Back to profile'}
                                    </Link>
                                )}
                            </div>

                            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-banana-600">
                                <MailCheck size={14} /> Codes are stored as one-way hashes and
                                expire automatically.
                            </p>
                        </div>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
