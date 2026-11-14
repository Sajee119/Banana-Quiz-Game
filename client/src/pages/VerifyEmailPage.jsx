import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    CircleAlert,
    Mail,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Trophy,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import OtpInput from '../components/OtpInput.jsx';
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

    return (
        <div className="flex min-h-screen flex-col px-4 py-5 sm:px-6">
            <header className="mx-auto flex w-full max-w-[1560px] items-center justify-between gap-3">
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

            <main className="mx-auto flex w-full max-w-lg flex-1 items-center py-8">
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full"
                >
                    <Card className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-banana-200 text-banana-700">
                            {expired && !status.loading ? (
                                <CircleAlert size={30} />
                            ) : (
                                <Mail size={30} />
                            )}
                        </div>

                        <p className="mb-1 flex items-center justify-center gap-1.5 font-display text-xs font-extrabold uppercase tracking-widest text-banana-500">
                            <Sparkles size={13} /> {isRegistration ? 'One last step' : 'Account security'}
                        </p>
                        <h1 className="font-display text-4xl font-extrabold text-banana-800">
                            {expired && !status.loading ? 'Code expired' : 'Check your inbox'}
                        </h1>

                        {status.loading ? (
                            <p className="mt-3 text-banana-700">Checking your verification link…</p>
                        ) : (
                            <p className="mt-2 text-banana-700">
                                {expired ? (
                                    'This verification code can no longer be used.'
                                ) : (
                                    <>
                                        We sent a 6-digit code to{' '}
                                        <strong className="break-all text-banana-900">{maskedEmail}</strong>.
                                        Enter it below to{' '}
                                        {isRegistration
                                            ? 'create your account'
                                            : 'confirm your email address'}
                                        .
                                    </>
                                )}
                            </p>
                        )}

                        {requiresSignIn && (
                            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
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
                                className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700"
                            >
                                <CircleAlert size={17} className="mt-0.5 flex-shrink-0" />
                                {error}
                            </p>
                        )}

                        {message && (
                            <p
                                role="status"
                                className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-700"
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

                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-banana-600">
                                    <span>
                                        {status.expiresAt
                                            ? `Expires in ${formatCountdown(secondsLeft)}`
                                            : 'Codes expire shortly'}
                                    </span>
                                    <span>
                                        {status.attemptsRemaining} attempt
                                        {status.attemptsRemaining === 1 ? '' : 's'} left
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting || otp.length !== 6}
                                    className="w-full !py-3"
                                >
                                    <ShieldCheck size={18} />
                                    {submitting ? 'Verifying…' : 'Verify code'}
                                </Button>
                            </form>
                        )}

                        {!status.loading && (
                            <div className="mt-5 border-t border-banana-200 pt-4">
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
                                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold text-banana-700 transition hover:bg-banana-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                <p className="mt-1 text-[11px] font-semibold text-banana-500">
                                    {status.resendCount}/{status.resendLimit} resends used
                                </p>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col items-center gap-2 text-xs font-bold">
                            {expired ? (
                                <>
                                    <Link
                                        to={isRegistration ? '/login?mode=register' : '/profile?tab=security'}
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
                    </Card>

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-banana-600">
                        <ShieldCheck size={14} /> Codes are stored as one-way hashes and expire
                        automatically.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
