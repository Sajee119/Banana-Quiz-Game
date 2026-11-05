import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/Button.jsx';
import { authApi } from '../api/client.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const inputClass =
    'w-full rounded-2xl border-2 border-banana-200 bg-white px-4 py-3 font-semibold text-banana-900 placeholder:text-banana-400 focus:border-banana-400 focus:outline-none';

export default function ForgotPasswordPage() {
    usePageTitle('Forgot password');

    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [devResetUrl, setDevResetUrl] = useState('');

    const devResetPath = (() => {
        if (!devResetUrl) return '';
        try {
            const url = new URL(devResetUrl);
            return `${url.pathname}${url.search}`;
        } catch {
            return devResetUrl;
        }
    })();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError('');
        try {
            const data = await authApi.forgotPassword(email.trim());
            setDevResetUrl(data.devResetUrl || '');
            setSent(true);
        } catch (err) {
            setError(err.friendlyMessage || 'Could not request a reset link. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <AuthShell
                title="Check your email"
                subtitle="If an account exists for that address, a reset link is on its way."
            >
                <div className="mb-5 flex justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <MailCheck size={30} />
                    </span>
                </div>

                <p className="mb-4 text-sm text-banana-700">
                    The link expires in 30 minutes and can only be used once. Check your spam or
                    junk folder if you do not see it within a few minutes.
                </p>

                {devResetUrl && (
                    <div className="mb-5 rounded-2xl border-2 border-dashed border-banana-300 bg-banana-50 p-3 text-left">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-banana-600">
                            <TriangleAlert size={14} /> Development only
                        </p>
                        <p className="mb-2 text-xs text-banana-600">
                            Email delivery is not configured. Use this link to continue:
                        </p>
                        <Link
                            to={devResetPath}
                            className="break-all text-xs font-bold text-banana-700 underline"
                        >
                            Open reset link
                        </Link>
                    </div>
                )}

                <div className="space-y-3">
                    <Link to="/login" className="block">
                        <Button className="w-full !py-3 !text-base">
                            <ArrowLeft size={17} /> Back to sign in
                        </Button>
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            setSent(false);
                            setDevResetUrl('');
                        }}
                        className="text-xs font-bold text-banana-600 underline hover:text-banana-800"
                    >
                        Use a different email
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Forgot your password?"
            subtitle="Enter the email on your account and we will send a secure reset link."
            footer={
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-banana-600">
                    <ShieldCheck size={14} /> Reset links are single-use and expire automatically.
                </p>
            }
        >
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
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (error) setError('');
                        }}
                        className={inputClass}
                    />
                </div>

                <Button type="submit" disabled={submitting} className="w-full !py-3 !text-base">
                    <Send size={17} /> {submitting ? 'Sending…' : 'Send reset link'}
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
