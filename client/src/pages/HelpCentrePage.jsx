import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Award,
    BookOpen,
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
} from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
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
        to: '/terms',
        icon: BookOpen,
        title: 'Terms of Service',
        text: 'The rules for using Banana Quiz and keeping the game fair.',
        color: 'from-sky-300 to-sky-500',
    },
    {
        to: '/privacy',
        icon: ShieldCheck,
        title: 'Privacy Policy',
        text: 'What we collect, how we use it and the choices you have.',
        color: 'from-emerald-300 to-emerald-500',
    },
    {
        href: `mailto:${SUPPORT_EMAIL}`,
        icon: Mail,
        title: 'Contact support',
        text: 'Send us a message and we will help you get back to playing.',
        color: 'from-orange-300 to-orange-500',
    },
];

const TOPICS = [
    {
        icon: Sparkles,
        title: 'Getting started',
        text: 'Create an account, verify your email and start your first round.',
        to: '/faq?category=start',
        items: ['Create an account', 'Verify your email', 'Choose a game mode'],
    },
    {
        icon: Gamepad2,
        title: 'Gameplay & controls',
        text: 'Answer faster with auto-submit, keyboard shortcuts and custom controls.',
        to: '/faq?category=gameplay',
        items: ['Auto-submit and manual mode', 'Timer and keyboard hints', 'Easy, Hard and Custom'],
    },
    {
        icon: Trophy,
        title: 'Scoring & leaderboard',
        text: 'Understand points, streaks, tie-breakers and ranked games.',
        to: '/faq?category=progress',
        items: ['How points are earned', 'Why Custom is unranked', 'Leaderboard visibility'],
    },
    {
        icon: Award,
        title: 'Achievements & progress',
        text: 'Track your badges, stats and personal bests over time.',
        to: '/faq?category=progress',
        items: ['Unlocking achievements', 'Reading your dashboard', 'Reviewing game history'],
    },
    {
        icon: KeyRound,
        title: 'Account & security',
        text: 'Passwords, connected providers, sessions and account recovery.',
        to: '/faq?category=account',
        items: ['Reset your password', 'Manage active sessions', 'Deactivate your account'],
    },
    {
        icon: ShieldCheck,
        title: 'Privacy & data',
        text: 'Cookies, exports, leaderboard privacy and deletion requests.',
        to: '/faq?category=data',
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
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {QUICK_LINKS.map((item) => (
                    <QuickLink key={item.title} item={item} />
                ))}
            </div>

            <section className="mt-7">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="font-display text-2xl font-extrabold text-banana-800">
                            Browse help topics
                        </h2>
                        <p className="text-sm font-semibold text-banana-600">
                            Jump straight to the answers for your question.
                        </p>
                    </div>
                    <Link
                        to="/faq"
                        className="inline-flex items-center gap-1 text-sm font-extrabold text-banana-600 transition hover:text-banana-900"
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

            <Card className="mt-6 !p-5 md:!p-7">
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-banana-200 text-banana-700">
                                <Mail size={22} />
                            </div>
                            <div>
                                <h2 className="font-display text-2xl font-extrabold text-banana-800">
                                    Contact support
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-banana-600">
                                    Email{' '}
                                    <a
                                        href={`mailto:${SUPPORT_EMAIL}`}
                                        className="font-bold text-banana-700 underline decoration-banana-300 underline-offset-2 hover:text-banana-900"
                                    >
                                        {SUPPORT_EMAIL}
                                    </a>{' '}
                                    and we will get back to you as soon as we can.
                                </p>
                            </div>
                        </div>

                        <ul className="mt-4 grid gap-2 text-sm font-semibold text-banana-700 sm:grid-cols-2">
                            {CONTACT_TIPS.map((tip) => (
                                <li key={tip} className="flex items-start gap-2">
                                    <CircleCheck
                                        size={16}
                                        className="mt-0.5 flex-shrink-0 text-emerald-500"
                                    />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=Banana%20Quiz%20support`}
                        className="md:self-center"
                    >
                        <Button className="w-full !py-3 md:w-auto">
                            <Mail size={18} /> Email support
                        </Button>
                    </a>
                </div>
            </Card>

            <Card className="mt-4 !p-5">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                        <BookOpen size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-extrabold text-banana-800">
                            Looking for the rules or privacy details?
                        </p>
                        <p className="text-sm font-semibold text-banana-600">
                            The Terms of Service and Privacy Policy are short, plain-language reads.
                        </p>
                    </div>
                    <Link to="/terms">
                        <Button variant="secondary" className="!py-2 !text-base">
                            Terms
                        </Button>
                    </Link>
                    <Link to="/privacy">
                        <Button variant="secondary" className="!py-2 !text-base">
                            Privacy
                        </Button>
                    </Link>
                </div>
            </Card>
        </PageShell>
    );
}

function QuickLink({ item }) {
    const Icon = item.icon;
    const className =
        'group flex flex-col rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-300';

    const content = (
        <>
            <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${item.color}`}
            >
                <Icon size={21} />
            </div>
            <p className="font-display text-lg font-extrabold text-banana-800">{item.title}</p>
            <p className="mt-1 flex-1 text-sm text-banana-700">{item.text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-banana-600 group-hover:text-banana-800">
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
            className="group flex flex-col rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-300"
        >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-banana-300 to-banana-500 text-white">
                <Icon size={21} />
            </div>
            <h3 className="font-display text-xl font-extrabold text-banana-800">{topic.title}</h3>
            <p className="mt-1 text-sm text-banana-700">{topic.text}</p>
            <ul className="mt-3 space-y-1 text-sm font-semibold text-banana-600">
                {topic.items.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                        <ChevronRight size={14} className="flex-shrink-0 text-banana-400" />
                        {item}
                    </li>
                ))}
            </ul>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-banana-600 group-hover:text-banana-800">
                Browse answers <ArrowRight size={15} />
            </span>
        </Link>
    );
}
