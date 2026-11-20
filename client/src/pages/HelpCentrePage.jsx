import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Award,
    BookOpen,
    Bug,
    ChevronRight,
    CircleCheck,
    Gamepad2,
    HelpCircle,
    KeyRound,
    LifeBuoy,
    Mail,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserRound,
} from 'lucide-react';
import PageShell, { primaryActionClass } from '../components/PageShell.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SUPPORT_EMAIL } from '../lib/site.js';

const QUICK_LINKS = [
    {
        to: '/faq',
        icon: HelpCircle,
        title: 'FAQ',
        text: 'Answers to the most common questions about the game, account and data.',
        color: 'from-banana-300 to-banana-500',
    },
    {
        to: '/contact',
        icon: Mail,
        title: 'Contact form',
        text: 'Send a message through the secure form and get a reply by email.',
        color: 'from-orange-400 to-orange-600',
    },
    {
        to: '/terms',
        icon: BookOpen,
        title: 'Terms of Service',
        text: 'The rules for using Banana Quiz and keeping the game fair.',
        color: 'from-sky-400 to-sky-600',
    },
    {
        to: '/privacy',
        icon: ShieldCheck,
        title: 'Privacy Policy',
        text: 'What we collect, how we use it and the choices you have.',
        color: 'from-emerald-400 to-emerald-600',
    },
    {
        to: '/about',
        icon: UserRound,
        title: 'About the developer',
        text: 'Meet Sajeepan, the GitHub projects and the stack behind the game.',
        color: 'from-violet-400 to-violet-600',
    },
    {
        to: '/contact?subject=Bug%20report',
        icon: Bug,
        title: 'Report a bug',
        text: 'Tell us what went wrong so it can be investigated and fixed.',
        color: 'from-rose-400 to-rose-600',
    },
];

const TOPICS = [
    {
        icon: Sparkles,
        title: 'Getting started',
        text: 'Create an account, verify your email and start your first round.',
        to: '/faq?category=start',
        accent: 'from-banana-300 to-banana-500',
        items: ['Create an account', 'Verify your email', 'Choose a game mode'],
    },
    {
        icon: Gamepad2,
        title: 'Gameplay & controls',
        text: 'Answer faster with auto-submit, keyboard shortcuts and custom controls.',
        to: '/faq?category=gameplay',
        accent: 'from-sky-400 to-sky-600',
        items: ['Auto-submit and manual mode', 'Timer and keyboard hints', 'Easy, Hard and Custom'],
    },
    {
        icon: Trophy,
        title: 'Scoring & leaderboard',
        text: 'Understand points, streaks, tie-breakers and ranked games.',
        to: '/faq?category=progress',
        accent: 'from-amber-300 to-orange-500',
        items: ['How points are earned', 'Why Custom is unranked', 'Leaderboard visibility'],
    },
    {
        icon: Award,
        title: 'Achievements & progress',
        text: 'Track your badges, stats and personal bests over time.',
        to: '/faq?category=progress',
        accent: 'from-violet-400 to-violet-600',
        items: ['Unlocking achievements', 'Reading your dashboard', 'Reviewing game history'],
    },
    {
        icon: KeyRound,
        title: 'Account & security',
        text: 'Passwords, connected providers, sessions and account recovery.',
        to: '/faq?category=account',
        accent: 'from-emerald-400 to-emerald-600',
        items: ['Reset your password', 'Manage active sessions', 'Deactivate your account'],
    },
    {
        icon: ShieldCheck,
        title: 'Privacy & data',
        text: 'Cookies, exports, leaderboard privacy and deletion requests.',
        to: '/faq?category=data',
        accent: 'from-rose-400 to-rose-600',
        items: ['Export your data', 'Hide your profile', 'Cookie choices'],
    },
];

const CONTACT_TIPS = [
    'Use the email address linked to your account.',
    'Describe what you were doing when the issue happened.',
    'Include any error message you saw.',
    'Screenshots help when they do not contain private information.',
];

export default function HelpCentrePage() {
    usePageTitle('Help Centre');

    return (
        <PageShell
            icon={LifeBuoy}
            eyebrow="Support"
            title="Help Centre"
            subtitle="Guides, answers and contact details for everything Banana Quiz. Pick a topic below or search the FAQ."
            chips={[
                { icon: HelpCircle, label: `${TOPICS.length} help topics`, tone: 'violet' },
                { icon: Sparkles, label: 'Plain-language guides', tone: 'emerald' },
                { icon: Mail, label: 'Contact form', tone: 'orange' },
            ]}
            actions={
                <Link to="/faq" className={primaryActionClass}>
                    <HelpCircle size={16} /> Browse the FAQ
                </Link>
            }
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_LINKS.map((item) => (
                    <QuickLink key={item.title} item={item} />
                ))}
            </div>

            <section className="border-y-2 border-banana-200 bg-banana-100/60 py-8 md:py-10">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="font-display text-2xl font-extrabold text-banana-900">
                            Browse help topics
                        </h2>
                        <p className="text-sm font-semibold text-banana-800">
                            Jump straight to the answers for your question.
                        </p>
                    </div>
                    <Link
                        to="/faq"
                        className="inline-flex items-center gap-1 text-sm font-extrabold text-banana-800 transition hover:text-banana-900"
                    >
                        View all FAQ <ArrowRight size={15} />
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {TOPICS.map((topic) => (
                        <TopicCard key={topic.title} topic={topic} />
                    ))}
                </div>
            </section>

            <section className="banana-promo-panel relative mt-6 overflow-hidden rounded-2xl border-2 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-amber-500 p-5 shadow-game md:p-7">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full border-[14px] border-white/25"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full border-[14px] border-white/20"
                />
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-900/25 bg-banana-50/80 text-banana-900">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h2 className="font-display text-2xl font-extrabold text-banana-900">
                                    Contact support
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-banana-800">
                                    Use the contact form or email{' '}
                                    <a
                                        href={`mailto:${SUPPORT_EMAIL}`}
                                        className="font-bold text-banana-900 underline decoration-banana-900/40 underline-offset-2 hover:decoration-banana-900"
                                    >
                                        {SUPPORT_EMAIL}
                                    </a>{' '}
                                    and we will get back to you as soon as we can.
                                </p>
                            </div>
                        </div>

                        <ul className="mt-4 grid gap-2 text-sm font-semibold text-banana-800 sm:grid-cols-2">
                            {CONTACT_TIPS.map((tip) => (
                                <li key={tip} className="flex items-start gap-2">
                                    <CircleCheck
                                        size={16}
                                        className="mt-0.5 flex-shrink-0 text-banana-900"
                                    />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Link
                        to="/contact"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/50 bg-white/90 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-white active:translate-y-0.5 md:w-auto"
                    >
                        <Mail size={18} /> Open contact form
                    </Link>
                </div>
            </section>

            <section className="py-8 md:py-10">
                <div className="mb-3">
                    <h2 className="font-display text-2xl font-extrabold text-banana-900">
                        Looking for the rules or privacy details?
                    </h2>
                    <p className="text-sm font-semibold text-banana-800">
                        The Terms of Service and Privacy Policy are short, plain-language reads.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <LegalLink
                        to="/terms"
                        icon={BookOpen}
                        tone="border-sky-300 bg-sky-100 text-sky-700"
                        title="Terms of Service"
                        text="Rules for using Banana Quiz"
                    />
                    <LegalLink
                        to="/privacy"
                        icon={ShieldCheck}
                        tone="border-emerald-300 bg-emerald-100 text-emerald-700"
                        title="Privacy Policy"
                        text="How your data is handled"
                    />
                </div>
            </section>
        </PageShell>
    );
}

function QuickLink({ item }) {
    const Icon = item.icon;
    const className =
        'group relative flex flex-col overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-300';

    const content = (
        <>
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.color}`}
            />
            <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-game-sm ${item.color}`}
            >
                <Icon size={21} />
            </div>
            <p className="font-display text-lg font-extrabold text-banana-900">{item.title}</p>
            <p className="mt-1 flex-1 text-sm text-banana-800">{item.text}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 font-display text-sm font-bold text-banana-800 group-hover:text-banana-900">
                Open <ArrowRight size={15} />
            </span>
        </>
    );

    if (item.href) {
        return (
            <a href={item.href} className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link to={item.to} className={className}>
            {content}
        </Link>
    );
}

function TopicCard({ topic }) {
    const Icon = topic.icon;

    return (
        <Link
            to={topic.to}
            className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-300"
        >
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${topic.accent}`}
            />
            <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-game-sm ${topic.accent}`}
            >
                <Icon size={21} />
            </div>
            <h3 className="font-display text-xl font-extrabold text-banana-900">{topic.title}</h3>
            <p className="mt-1 text-sm text-banana-800">{topic.text}</p>
            <ul className="mt-3 space-y-1 text-sm font-semibold text-banana-800">
                {topic.items.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                        <ChevronRight size={14} className="flex-shrink-0 text-banana-500" />
                        {item}
                    </li>
                ))}
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 font-display text-sm font-bold text-banana-800 group-hover:text-banana-900">
                Browse answers <ArrowRight size={15} />
            </span>
        </Link>
    );
}

function LegalLink({ to, icon: Icon, tone, title, text }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-300"
        >
            <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 ${tone}`}
            >
                <Icon size={21} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold text-banana-900">{title}</p>
                <p className="text-sm font-semibold text-banana-800">{text}</p>
            </div>
            <ArrowRight
                size={18}
                className="flex-shrink-0 text-banana-500 transition group-hover:translate-x-0.5"
            />
        </Link>
    );
}
