import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    ChevronDown,
    CircleAlert,
    CircleCheck,
    Clock3,
    Globe,
    HelpCircle,
    Loader2,
    Mail,
    MessageSquare,
    Send,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import PageShell, {
    primaryActionClass,
    secondaryActionClass,
} from '../components/PageShell.jsx';
import { GitHubIcon, XIcon } from '../components/BrandIcons.jsx';
import { contactApi } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { CONTACT_SUBJECTS, SUPPORT_EMAIL } from '../lib/site.js';

const inputClass =
    'w-full rounded-2xl border-2 border-banana-300 bg-white/90 px-4 py-3 font-body font-semibold text-banana-900 shadow-game-sm transition placeholder:text-banana-500 focus:border-banana-500 focus:outline-none';
const labelClass =
    'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-banana-800';
const errorInputClass =
    'border-red-400 focus:border-red-500';

const WRITING_TIPS = [
    'Check the FAQ first — the answer may already be there.',
    'Use the email address linked to your account.',
    'Describe what you were doing when the issue happened.',
    'Paste any error message or attach a screenshot if it is safe to share.',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(form) {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (name.length < 2) errors.name = 'Please enter at least 2 characters.';
    else if (name.length > 80) errors.name = 'Please keep your name under 80 characters.';

    if (!email) errors.email = 'Please enter your email address.';
    else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!form.subject) errors.subject = 'Choose a topic so I can route your message.';

    if (message.length < 20) errors.message = 'Please write at least 20 characters.';
    else if (form.message.length > 4000) {
        errors.message = 'Please keep your message under 4,000 characters.';
    }

    return errors;
}

export default function ContactPage() {
    usePageTitle('Contact');
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const requestedSubject = searchParams.get('subject');
    const [form, setForm] = useState(() => ({
        // Null means "not edited yet", so signed-in players get their details
        // even when the session finishes loading after this page mounts.
        name: null,
        email: null,
        subject: CONTACT_SUBJECTS.includes(requestedSubject) ? requestedSubject : '',
        message: '',
        website: '',
    }));
    const [errors, setErrors] = useState({});
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState('idle');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const nameValue = form.name ?? user?.displayName ?? '';
    const emailValue = form.email ?? user?.email ?? '';

    const updateField = (field) => (event) => {
        const { value } = event.target;
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
        if (status === 'error') {
            setStatus('idle');
            setFeedback('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        const values = { ...form, name: nameValue, email: emailValue };
        const nextErrors = validateContact(values);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setStatus('error');
            setFeedback('Please fix the highlighted fields and try again.');
            document.getElementById(`contact-${Object.keys(nextErrors)[0]}`)?.focus();
            return;
        }

        setSubmitting(true);
        setStatus('idle');
        setFeedback('');

        try {
            const data = await contactApi.send({
                name: values.name.trim(),
                email: values.email.trim(),
                subject: values.subject,
                message: values.message.trim(),
                website: values.website,
            });
            setSent(true);
            setFeedback(data.message || 'Thanks! Your message has been sent.');
            setForm((prev) => ({ ...prev, subject: '', message: '' }));
        } catch (err) {
            setStatus('error');
            setFeedback(err.friendlyMessage || 'Your message could not be sent. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageShell
            icon={Mail}
            eyebrow="Contact"
            title="Get in touch"
            subtitle="Questions, bug reports, feedback or a project idea — send a message and it will go straight to Sajeepan's inbox."
            chips={[
                { icon: Clock3, label: 'Replies in 1–2 days', tone: 'emerald' },
                { icon: ShieldCheck, label: 'Secure SMTP delivery', tone: 'sky' },
                { icon: Sparkles, label: 'Read personally', tone: 'violet' },
            ]}
            actions={
                <Link to="/faq" className={primaryActionClass}>
                    <HelpCircle size={16} /> Check the FAQ
                </Link>
            }
        >
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
                <motion.section
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 p-5 shadow-game sm:p-7"
                    aria-labelledby="contact-form-title"
                >
                    {sent ? (
                        <div className="py-6 text-center" aria-live="polite">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-100 text-emerald-700 shadow-game-sm">
                                <CircleCheck size={32} />
                            </div>
                            <h2 className="font-display text-3xl font-extrabold text-banana-900">
                                Message sent
                            </h2>
                            <p className="mx-auto mt-2 max-w-md font-semibold text-banana-800">
                                {feedback}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-banana-800">
                                A reply will go to{' '}
                                <span className="font-extrabold text-banana-900">{emailValue}</span>.
                            </p>
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSent(false);
                                        setFeedback('');
                                        setStatus('idle');
                                    }}
                                    className={primaryActionClass}
                                >
                                    <Send size={16} /> Send another message
                                </button>
                                <Link to="/help" className={secondaryActionClass}>
                                    Visit the Help Centre
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-100 text-banana-800">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                                        Send a message
                                    </p>
                                    <h2
                                        id="contact-form-title"
                                        className="font-display text-2xl font-extrabold text-banana-900 sm:text-3xl"
                                    >
                                        What can I help with?
                                    </h2>
                                    <p className="mt-1 text-sm font-semibold text-banana-800">
                                        Fill in the form and I&apos;ll reply by email. Fields marked with
                                        * are required.
                                    </p>
                                </div>
                            </div>

                            {status === 'error' && feedback && (
                                <div
                                    role="alert"
                                    className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                                >
                                    <CircleAlert size={18} className="mt-0.5 flex-shrink-0" />
                                    {feedback}
                                </div>
                            )}

                            <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                                >
                                    <label htmlFor="contact-website">Website</label>
                                    <input
                                        id="contact-website"
                                        name="website"
                                        type="text"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={form.website}
                                        onChange={updateField('website')}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contact-name" className={labelClass}>
                                            Your name *
                                        </label>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            maxLength={80}
                                            placeholder="Your name"
                                            value={nameValue}
                                            onChange={updateField('name')}
                                            className={`${inputClass} ${errors.name ? errorInputClass : ''}`}
                                            aria-invalid={Boolean(errors.name)}
                                            aria-describedby={errors.name ? 'contact-name-error' : undefined}
                                        />
                                        <FieldError id="contact-name-error">{errors.name}</FieldError>
                                    </div>

                                    <div>
                                        <label htmlFor="contact-email" className={labelClass}>
                                            Email address *
                                        </label>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            maxLength={254}
                                            placeholder="you@example.com"
                                            value={emailValue}
                                            onChange={updateField('email')}
                                            className={`${inputClass} ${errors.email ? errorInputClass : ''}`}
                                            aria-invalid={Boolean(errors.email)}
                                            aria-describedby={
                                                errors.email ? 'contact-email-error' : undefined
                                            }
                                        />
                                        <FieldError id="contact-email-error">{errors.email}</FieldError>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="contact-subject" className={labelClass}>
                                        Topic *
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="contact-subject"
                                            name="subject"
                                            value={form.subject}
                                            onChange={updateField('subject')}
                                            className={`${inputClass} appearance-none pr-10 ${
                                                form.subject ? '' : 'text-banana-500'
                                            } ${errors.subject ? errorInputClass : ''}`}
                                            aria-invalid={Boolean(errors.subject)}
                                            aria-describedby={
                                                errors.subject ? 'contact-subject-error' : undefined
                                            }
                                        >
                                            <option value="">Choose a topic…</option>
                                            {CONTACT_SUBJECTS.map((subject) => (
                                                <option key={subject} value={subject}>
                                                    {subject}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={18}
                                            aria-hidden="true"
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-banana-500"
                                        />
                                    </div>
                                    <FieldError id="contact-subject-error">{errors.subject}</FieldError>
                                </div>

                                <div>
                                    <div className="flex items-end justify-between gap-2">
                                        <label htmlFor="contact-message" className={labelClass}>
                                            Message *
                                        </label>
                                        <span
                                            className={`mb-1.5 text-[11px] font-bold ${
                                                form.message.length > 4000
                                                    ? 'text-red-600'
                                                    : 'text-banana-800'
                                            }`}
                                        >
                                            {form.message.length} / 4000
                                        </span>
                                    </div>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows={7}
                                        maxLength={4000}
                                        placeholder="Tell me what happened, what you expected, and anything else that helps."
                                        value={form.message}
                                        onChange={updateField('message')}
                                        className={`${inputClass} resize-y ${errors.message ? errorInputClass : ''}`}
                                        aria-invalid={Boolean(errors.message)}
                                        aria-describedby={
                                            errors.message ? 'contact-message-error' : undefined
                                        }
                                    />
                                    <FieldError id="contact-message-error">{errors.message}</FieldError>
                                </div>

                                <p className="text-xs font-semibold text-banana-800">
                                    Your name, email and message are used only to reply to this
                                    enquiry. Read the{' '}
                                    <Link
                                        to="/privacy"
                                        className="font-extrabold text-banana-900 underline decoration-banana-700/40 underline-offset-2 hover:decoration-banana-900"
                                    >
                                        Privacy Policy
                                    </Link>
                                    .
                                </p>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`${primaryActionClass} w-full !py-3.5 !text-lg disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={19} className="animate-spin" /> Sending…
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} /> Send message
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </motion.section>

                <aside className="space-y-4">
                    <div className="banana-promo-panel relative overflow-hidden rounded-2xl border-2 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-amber-500 p-5 shadow-game">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[12px] border-white/25"
                        />
                        <div className="relative flex items-start gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-900/25 bg-banana-50/80 text-banana-900">
                                <Clock3 size={22} />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-extrabold text-banana-900">
                                    Usually replies in 1–2 days
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-banana-800">
                                    Every message is read personally. Account and bug reports are
                                    prioritised.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 p-5 shadow-game">
                        <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                            Direct contact
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-extrabold text-banana-900">
                            Prefer email or socials?
                        </h2>
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-banana-200 bg-white/90 p-3 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-50"
                        >
                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                <Mail size={17} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-banana-800">
                                    Email
                                </span>
                                <span className="block break-all text-sm font-extrabold text-banana-900">
                                    {SUPPORT_EMAIL}
                                </span>
                            </span>
                        </a>

                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2">
                            <ContactLink
                                href="https://github.com/Sajee119"
                                icon={GitHubIcon}
                                label="GitHub"
                                value="github.com/Sajee119"
                            />
                            <ContactLink
                                href="https://x.com/SSajeepan3492"
                                icon={XIcon}
                                label="X / Twitter"
                                value="@SSajeepan3492"
                            />
                            <ContactLink
                                href="https://sajeepan-portfolio.vercel.app/"
                                icon={Globe}
                                label="Portfolio"
                                value="sajeepan-portfolio.vercel.app"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm">
                        <div className="flex items-center gap-2">
                            <Sparkles size={17} className="flex-shrink-0 text-banana-700" />
                            <h2 className="font-display text-xl font-extrabold text-banana-900">
                                Before you write
                            </h2>
                        </div>
                        <ul className="mt-3 space-y-2 text-sm font-semibold text-banana-800">
                            {WRITING_TIPS.map((tip) => (
                                <li key={tip} className="flex items-start gap-2">
                                    <CircleCheck
                                        size={15}
                                        className="mt-0.5 flex-shrink-0 text-banana-500"
                                    />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                to="/faq"
                                className="inline-flex items-center gap-1 text-sm font-extrabold text-banana-800 transition hover:text-banana-900"
                            >
                                Browse the FAQ <ArrowRight size={14} />
                            </Link>
                            <Link
                                to="/help"
                                className="inline-flex items-center gap-1 text-sm font-extrabold text-banana-800 transition hover:text-banana-900"
                            >
                                Help Centre <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck
                                size={19}
                                className="mt-0.5 flex-shrink-0 text-emerald-700"
                            />
                            <p className="text-sm font-semibold text-emerald-700">
                                Your details are only used to reply to this message. You can read
                                how data is handled in the{' '}
                                <Link
                                    to="/privacy"
                                    className="font-extrabold underline decoration-emerald-700/40 underline-offset-2 hover:decoration-emerald-800"
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </PageShell>
    );
}

function FieldError({ id, children }) {
    if (!children) return null;
    return (
        <p id={id} className="mt-1.5 text-xs font-bold text-status-danger">
            {children}
        </p>
    );
}

function ContactLink({ href, icon: Icon, label, value }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border-2 border-banana-200 bg-white/90 p-3 shadow-game-sm transition hover:border-banana-300 hover:bg-banana-50"
        >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                <Icon size={17} />
            </span>
            <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-banana-800">
                    {label}
                </span>
                <span className="block break-all text-sm font-extrabold leading-tight text-banana-900">
                    {value}
                </span>
            </span>
        </a>
    );
}
