import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    ChevronDown,
    HelpCircle,
    LifeBuoy,
    Mail,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { SUPPORT_EMAIL } from '../lib/site.js';

const CATEGORIES = [
    { id: 'all', label: 'All questions' },
    { id: 'start', label: 'Getting started' },
    { id: 'gameplay', label: 'Gameplay & scoring' },
    { id: 'account', label: 'Account & security' },
    { id: 'progress', label: 'Achievements & leaderboard' },
    { id: 'data', label: 'Privacy & data' },
];

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));

const FAQS = [
    // Getting started
    {
        category: 'start',
        q: 'Is Banana Quiz free to play?',
        a: 'Yes. Every mode, achievement and leaderboard feature is free. There are no downloads, subscriptions or paid unlocks.',
    },
    {
        category: 'start',
        q: 'Do I need an account to play?',
        a: 'You can browse the site and view the leaderboard without an account, but you need one to start a game, save scores, build streaks and unlock achievements.',
    },
    {
        category: 'start',
        q: 'Do I need to install anything?',
        a: 'No. Banana Quiz runs in your browser on desktop, tablet and mobile. The number pad, keyboard controls and audio all work without an app.',
    },
    {
        category: 'start',
        q: 'Which devices and browsers are supported?',
        a: 'Any modern browser with JavaScript enabled works well, including recent versions of Chrome, Edge, Firefox and Safari. A stable internet connection is recommended.',
    },

    // Gameplay & scoring
    {
        category: 'gameplay',
        q: 'How do I play a round?',
        a: 'Choose a mode, study the banana puzzle, then type or tap the banana value. When auto-submit is on, your answer sends automatically after a short pause. Press Enter to submit immediately.',
    },
    {
        category: 'gameplay',
        q: 'What is the difference between Easy, Hard and Custom?',
        a: 'Standard Easy is 10 quizzes with 30 seconds each. Standard Hard is 10 quizzes with 15 seconds each. Custom lets you choose between 5 and 30 quizzes and a 10–60 second timer.',
    },
    {
        category: 'gameplay',
        q: 'How does scoring work?',
        a: 'Each correct answer earns a base of 50 points plus a speed bonus. A continued streak adds to your run, so quick correct answers score the most. Wrong, skipped and timed-out quizzes earn 0 points.',
    },
    {
        category: 'gameplay',
        q: 'What happens if I run out of time or skip?',
        a: 'The quiz ends, the correct answer is shown and you earn 0 points for that quiz. The game then moves on to the next puzzle automatically.',
    },
    {
        category: 'gameplay',
        q: 'Can I turn off auto-submit?',
        a: 'Yes. Open Profile → Gameplay and turn off “Auto-submit answers”. The Submit answer button will return, and Enter will still submit your answer.',
    },
    {
        category: 'gameplay',
        q: 'Can I change the timer or celebrations?',
        a: 'Yes. Profile → Gameplay lets you show or hide the countdown timer, keyboard hints and correct-answer celebrations. You can also set default quiz counts and times for Custom games.',
    },

    // Account & security
    {
        category: 'account',
        q: 'How do I create an account?',
        a: 'Use the Sign in page to register with your email address, Google or Facebook. Email registrations receive a 6-digit code to verify the address before the account is created.',
    },
    {
        category: 'account',
        q: 'Why do I need to verify my email?',
        a: 'Verification proves you own the address, helps protect your account and makes password recovery possible. Google and Facebook sign-ins are already verified by the provider.',
    },
    {
        category: 'account',
        q: 'I forgot my password. What should I do?',
        a: 'Open the Sign in page and choose “Forgot password”. We will email a secure reset link. If you signed up with Google or Facebook, use that provider to sign in instead.',
    },
    {
        category: 'account',
        q: 'How do I change my password?',
        a: 'Open Profile → Security. Enter your current password and choose a new one. If your account only uses Google or Facebook, you can add a password from the same screen.',
    },
    {
        category: 'account',
        q: 'How do I sign out of other devices?',
        a: 'Open the log out menu in the header. You can end the current session, sign out other devices, or sign out everywhere. Your login history is available in Profile → Security.',
    },
    {
        category: 'account',
        q: 'How do I hide my profile from the leaderboard?',
        a: 'Open Profile → Appearance and turn off “Show me on the leaderboard”. Your points still count for achievements and stats, but your name and avatar are removed from the public board.',
    },

    // Achievements & leaderboard
    {
        category: 'progress',
        q: 'How many achievements are there?',
        a: 'There are 14 achievements across bronze, silver and gold tiers. They unlock automatically from your real stats, including streaks, speed, points and mode mastery.',
    },
    {
        category: 'progress',
        q: 'Why are my Custom games not on the leaderboard?',
        a: 'Custom games are practice sessions. Because you choose the quiz count and timer, their scores are not ranked. Standard Easy and Standard Hard games are eligible for the leaderboard.',
    },
    {
        category: 'progress',
        q: 'How are leaderboard ties broken?',
        a: 'Players are ranked by total points. Ties are broken by games won, then by best streak. The board refreshes whenever you reload or press the refresh button.',
    },
    {
        category: 'progress',
        q: 'Why is my rank different from my friend’s view?',
        a: 'The board only includes players who share their profile publicly. Hidden profiles are excluded, which can shift the visible ranks. Your own position card always shows your true standing.',
    },

    // Privacy & data
    {
        category: 'data',
        q: 'What data does Banana Quiz store?',
        a: 'We store your account details, game history, scores, achievements and preferences so the game can work. Technical data such as session cookies and login history helps keep your account secure.',
    },
    {
        category: 'data',
        q: 'Can I export or delete my data?',
        a: 'Yes. Profile → Privacy & data lets you download a copy of your data and deactivate your account. You can also contact support to request deletion.',
    },
    {
        category: 'data',
        q: 'Do you use cookies?',
        a: 'We use an essential session cookie to keep you signed in. If you tick “Remember me”, the session lasts 30 days and a small first-party cookie saves your email so the form can prefill it. We also save a few preferences in your browser, such as audio settings and your cookie choice. We do not use advertising cookies.',
    },
    {
        category: 'data',
        q: 'Where can I read the full policies?',
        a: 'The Terms of Service and Privacy Policy explain the rules and how your information is handled. Both are linked in the footer on every page.',
    },
];

export default function FaqPage() {
    usePageTitle('FAQ');
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedCategory = searchParams.get('category');
    const category =
        requestedCategory && CATEGORY_IDS.has(requestedCategory) ? requestedCategory : 'all';
    const [query, setQuery] = useState('');

    const selectCategory = (id) => {
        if (id === 'all') setSearchParams({}, { replace: true });
        else setSearchParams({ category: id }, { replace: true });
    };

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        return FAQS.filter((item) => {
            const matchesCategory = category === 'all' || item.category === category;
            const matchesQuery =
                !term ||
                item.q.toLowerCase().includes(term) ||
                item.a.toLowerCase().includes(term);
            return matchesCategory && matchesQuery;
        });
    }, [category, query]);

    const groups = CATEGORIES.filter((item) => item.id !== 'all')
        .map((item) => ({
            ...item,
            items: filtered.filter((faq) => faq.category === item.id),
        }))
        .filter((group) => group.items.length > 0);

    const clearFilters = () => {
        selectCategory('all');
        setQuery('');
    };

    return (
        <PageShell
            icon={HelpCircle}
            eyebrow="Support"
            title="Frequently asked questions"
            subtitle="Quick answers about gameplay, scoring, accounts, achievements and your data."
        >
            <Card className="mb-4 !p-4 md:!p-5">
                <div className="relative">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-banana-400"
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search the FAQ…"
                        aria-label="Search the FAQ"
                        autoComplete="off"
                        className="w-full rounded-2xl border-2 border-banana-200 bg-banana-50 py-2.5 pl-10 pr-10 font-semibold text-banana-800 outline-none transition focus:border-banana-400 focus:bg-white"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-banana-500 transition hover:bg-banana-200 hover:text-banana-700"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {CATEGORIES.map((item) => {
                        const active = category === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => selectCategory(item.id)}
                                aria-pressed={active}
                                className={`whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition ${
                                    active
                                        ? 'border-banana-500 bg-banana-300 text-banana-900'
                                        : 'border-banana-200 bg-white text-banana-600 hover:bg-banana-50'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {groups.length === 0 ? (
                <Card className="py-10 text-center">
                    <Search size={40} className="mx-auto mb-3 text-banana-400" />
                    <h2 className="font-display text-2xl font-extrabold text-banana-800">
                        No answers found
                    </h2>
                    <p className="mt-1 text-banana-600">
                        Try a different search, or ask us directly and we will help.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={clearFilters}
                            className="!py-2 !text-base"
                        >
                            <X size={16} /> Clear filters
                        </Button>
                        <a href={`mailto:${SUPPORT_EMAIL}`}>
                            <Button className="!py-2 !text-base">
                                <Mail size={16} /> Email support
                            </Button>
                        </a>
                    </div>
                </Card>
            ) : (
                <div className="space-y-5">
                    {groups.map((group) => (
                        <section
                            key={group.id}
                            id={`faq-${group.id}`}
                            className="scroll-mt-24"
                        >
                            <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-extrabold text-banana-800">
                                <Sparkles size={17} className="text-banana-500" />
                                {group.label}
                            </h2>
                            <div className="space-y-3">
                                {group.items.map((item) => (
                                    <details
                                        key={item.q}
                                        className="group rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm"
                                    >
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-extrabold text-banana-800">
                                            <span>{item.q}</span>
                                            <ChevronDown
                                                size={20}
                                                className="flex-shrink-0 text-banana-500 transition group-open:rotate-180"
                                            />
                                        </summary>
                                        <p className="mt-2 text-sm leading-relaxed text-banana-700">
                                            {item.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <Card className="mt-5 !p-5 md:!p-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-banana-200 text-banana-700">
                        <LifeBuoy size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-display text-xl font-extrabold text-banana-800">
                            Still stuck?
                        </p>
                        <p className="text-sm font-semibold text-banana-600">
                            Browse the Help Centre for guides, or email us and we will get back to
                            you.
                        </p>
                    </div>
                    <Link to="/help">
                        <Button variant="secondary" className="!py-2.5 !text-base">
                            Help Centre
                        </Button>
                    </Link>
                    <a href={`mailto:${SUPPORT_EMAIL}`}>
                        <Button className="!py-2.5 !text-base">
                            <Mail size={16} /> Email support
                        </Button>
                    </a>
                </div>
            </Card>
        </PageShell>
    );
}
