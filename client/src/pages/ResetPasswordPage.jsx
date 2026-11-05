import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    KeyRound,
    Loader2,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/Button.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { evaluatePassword } from '../lib/passwordStrength.js';

export default function ResetPasswordPage() {
    usePageTitle('Reset password');

    const { setUser, setStats, refresh } = useAuth();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState(token ? 'validating' : 'invalid');
    const [error, setError] = useState(
        token ? '' : 'This reset link is missing its token. Request a new link to continue.'
    );
    const [expiresAt, setExpiresAt] = useState(null);
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;

        if (!token) {
            return undefined;
        }

        const validate = async () => {
            let lastError = null;

            // A single retry covers a cold database or a slow network without
            // pretending a valid link has expired.
            for (let tryIndex = 0; tryIndex < 2; tryIndex += 1) {
                try {
                    const data = await authApi.validateResetToken(token);
                    if (!active) return;
                    setExpiresAt(data.expiresAt || null);
                    setStatus('ready');
                    return;
                } catch (err) {
                    lastError = err;
                    if (err.response || tryIndex === 1) break;
                    await new Promise((resolve) => setTimeout(resolve, 800));
                }
            }

            if (!active) return;
            setStatus(lastError?.response ? 'invalid' : 'error');
            setError(
                lastError?.response
                    ? lastError.friendlyMessage ||
                          'This reset link is invalid or has expired. Request a new one.'
                    : 'We could not check this reset link. Check your connection and try again.'
            );
        };

        validate();

        return () => {
            active = false;
        };
    }, [token, attempt]);

    const retryValidation = () => {
        setStatus('validating');
        setError('');
        setAttempt((current) => current + 1);
    };

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setError('');

        const policy = evaluatePassword(form.password);
        if (!policy.valid) {
            setError(policy.message);
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('The passwords do not match. Please re-enter them.');
            return;
        }

        setSubmitting(true);
        try {
            await authApi.resetPassword({ token, password: form.password });
            // A reset invalidates every session, including this browser. Clear
            // the stale local user immediately so the sign-in page does not
            // bounce us back to the dashboard, then confirm in the background.
            setUser(null);
            setStats(null);
            setDone(true);
            refresh();
        } catch (err) {
            setError(err.friendlyMessage || 'Could not reset your password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'validating') {
        return (
            <AuthShell
                title="Checking your link"
                subtitle="Just a moment while we verify this reset link."
            >
                <div className="flex justify-center py-6 text-banana-500">
                    <Loader2 size={34} className="animate-spin" />
                </div>
            </AuthShell>
        );
    }

    if (status === 'error') {
        return (
            <AuthShell
                title="Could not check link"
                subtitle="The reset link itself may still be fine."
            >
                <div className="mb-5 flex justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                        <ShieldAlert size={30} />
                    </span>
                </div>

                <p
                    role="alert"
                    aria-live="polite"
                    className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                >
                    {error}
                </p>

                <div className="space-y-3">
                    <Button onClick={retryValidation} className="w-full !py-3 !text-base">
                        <RefreshCw size={17} /> Try again
                    </Button>
                    <Link to="/forgot-password" className="block">
                        <Button variant="secondary" className="w-full !py-3 !text-base">
                            <KeyRound size={17} /> Request a new link
                        </Button>
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-xs font-bold text-banana-600 underline hover:text-banana-800"
                    >
                        <ArrowLeft size={13} /> Back to sign in
                    </Link>
                </div>
            </AuthShell>
        );
    }

    if (status === 'invalid') {
        return (
            <AuthShell
                title="Link expired"
                subtitle="Reset links are single-use and expire automatically."
            >
                <div className="mb-5 flex justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <ShieldAlert size={30} />
                    </span>
                </div>

                <p
                    role="alert"
                    aria-live="polite"
                    className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                    {error}
                </p>

                <div className="space-y-3">
                    <Link to="/forgot-password" className="block">
                        <Button className="w-full !py-3 !text-base">
                            <KeyRound size={17} /> Request a new link
                        </Button>
                    </Link>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-xs font-bold text-banana-600 underline hover:text-banana-800"
                    >
                        <ArrowLeft size={13} /> Back to sign in
                    </Link>
                </div>
            </AuthShell>
        );
    }

    if (done) {
        return (
            <AuthShell
                title="Password reset"
                subtitle="Your new password is ready to use."
            >
                <div className="mb-5 flex justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={30} />
                    </span>
                </div>

                <p className="mb-5 text-sm text-banana-700">
                    For your security, every other device has been signed out. Sign in again with
                    your new password.
                </p>

                <Link to="/login" className="block">
                    <Button className="w-full !py-3 !text-base">
                        <ArrowLeft size={17} /> Go to sign in
                    </Button>
                </Link>
            </AuthShell>
        );
    }

    const expiresLabel = expiresAt
        ? new Date(expiresAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <AuthShell
            title="Choose a new password"
            subtitle="Pick something strong that you have not used before."
            footer={
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-banana-600">
                    <ShieldCheck size={14} /> This link can only be used once.
                </p>
            }
        >
            {expiresLabel && (
                <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-banana-100 px-3 py-1 text-xs font-bold text-banana-700">
                    <Clock3 size={13} /> Link valid until {expiresLabel}
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    aria-live="polite"
                    className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <PasswordInput
                    id="newPassword"
                    label="New password"
                    value={form.password}
                    onChange={updateField('password')}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                />
                <PasswordStrengthMeter password={form.password} />

                <PasswordInput
                    id="confirmPassword"
                    label="Confirm new password"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Repeat your new password"
                />
                {form.confirmPassword.length > 0 &&
                    form.password !== form.confirmPassword && (
                        <p className="text-xs font-semibold text-red-600">
                            The passwords do not match yet.
                        </p>
                    )}

                <Button type="submit" disabled={submitting} className="w-full !py-3 !text-base">
                    <KeyRound size={17} /> {submitting ? 'Saving…' : 'Set new password'}
                </Button>
            </form>

            <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-banana-600 underline hover:text-banana-800"
            >
                <ArrowLeft size={13} /> Back to sign in
            </Link>
        </AuthShell>
    );
}
