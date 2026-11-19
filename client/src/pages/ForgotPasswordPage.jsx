import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck, Send, ShieldCheck } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/Button.jsx';
import { authApi } from '../api/client.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const inputClass =
    'w-full rounded-2xl border-2 border-banana-200 bg-white py-3 pl-11 pr-4 font-semibold text-banana-900 placeholder:text-banana-400 transition focus:border-banana-400 focus:outline-none focus:ring-2 focus:ring-banana-300/60';

const NEXT_STEPS = [
    'Open the email from Banana Quiz.',
    'Follow the secure reset link.',
    'Choose and confirm a new password.',
];

export default function ForgotPasswordPage() {
    usePageTitle('Forgot password');

    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError('');
        try {
            await authApi.forgotPassword(email.trim());
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
                eyebrow="Check your inbox"
                title="Check your email"
                subtitle={
                    email.trim()
                        ? `If an account exists for ${email.trim()}, a reset link is on its way.`
                        : 'If an account exists for that address, a reset link is on its way.'
                }
            >
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex gap-3">
                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-100 text-emerald-700">
                            <MailCheck size={26} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-display text-lg font-extrabold leading-tight text-emerald-900">
                                Reset link sent
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-emerald-800">
                                The link expires in 30 minutes and can only be used once.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-banana-500">
                    What happens next
                </p>
                <ol className="mt-2 space-y-2.5">
                    {NEXT_STEPS.map((step, index) => (
                        <li
                            key={step}
                            className="flex items-center gap-3 rounded-2xl border-2 border-banana-100 bg-banana-50/70 px-3.5 py-2.5"
                        >
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-banana-300 bg-banana-200 font-display text-xs font-extrabold text-banana-800">
                                {index + 1}
                            </span>
                            <span className="text-sm font-semibold text-banana-800">{step}</span>
                        </li>
                    ))}
                </ol>

                <p className="mt-3 text-xs font-semibold leading-relaxed text-banana-600">
                    Cannot find it? Check your spam or junk folder before requesting another link.
                </p>

                <div className="mt-5 space-y-2.5">
                    <Link to="/login" className="block">
                        <Button className="w-full !py-3.5 !text-base">
                            <ArrowLeft size={17} /> Back to sign in
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        onClick={() => setSent(false)}
                        className="w-full !py-3 !text-base"
                    >
                        <Mail size={17} /> Use a different email
                    </Button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Account recovery"
            title="Forgot your password?"
            subtitle="Enter the email on your account and we will send a secure reset link."
        >
            {error && (
                <p
                    role="alert"
                    aria-live="polite"
                    className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-bold text-banana-700">
                        Email
                    </label>
                    <div className="relative">
                        <Mail
                            size={18}
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-banana-400"
                        />
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
                </div>

                <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full !py-3.5 !text-base"
                >
                    <Send size={17} /> {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
            </form>

            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border-2 border-banana-100 bg-banana-50/70 px-4 py-3 text-xs font-semibold leading-relaxed text-banana-700">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-banana-500" />
                <span>
                    We only send a link when an account exists for that address. Reset links are
                    single-use and expire after 30 minutes.
                </span>
            </div>

            <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-banana-600 underline hover:text-banana-800"
            >
                <ArrowLeft size={13} /> Back to sign in
            </Link>
        </AuthShell>
    );
}
