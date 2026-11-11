import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Banana,
    Timer,
    Leaf,
    Zap,
    Flame,
    Trophy,
    Award,
    ShieldCheck,
    Sparkles,
    MousePointerClick,
    Users,
    ChevronDown,
    ArrowRight,
    Play,
    Star,
    CircleCheck,
    Globe,
    Smartphone,
    Gamepad2,
    Crown,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/auth-context.js';
import { userApi } from '../api/client.js';
import { MODE_LIST } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const MODE_ICONS = { easy: Banana, hard: Timer, custom: Leaf };

const FEATURES = [
    {
        icon: MousePointerClick,
        title: 'Instant rounds',
        text: 'No downloads, no tutorials. Open the page, pick a mode and start calculating banana values in seconds.',
        color: 'from-banana-300 to-banana-500',
    },
    {
        icon: Timer,
        title: 'Three play modes',
        text: 'Standard Easy, Standard Hard and Custom practice give every player a comfortable challenge.',
        color: 'from-sky-300 to-sky-500',
    },
    {
        icon: Flame,
        title: 'Streak multipliers',
        text: 'Every correct answer in a row raises your multiplier, while quick responses earn extra points.',
        color: 'from-orange-300 to-orange-500',
    },
    {
        icon: Zap,
        title: 'Speed bonuses',
        text: 'The faster you calculate the banana value, the more bonus points you earn on top of the base score.',
        color: 'from-pink-300 to-pink-500',
    },
    {
        icon: Award,
        title: '14 achievements',
        text: 'From First Peel to Golden Bunch — earn badges for streaks, speed and persistence.',
        color: 'from-violet-300 to-violet-500',
    },
    {
        icon: Globe,
        title: 'Global leaderboard',
        text: 'Standard scores join the leaderboard; Custom games stay private practice.',
        color: 'from-emerald-300 to-emerald-500',
    },
];

const ACHIEVEMENT_TEASERS = [
    { icon: Banana, title: 'First Peel', tier: 'Bronze', text: 'Finish your first round', color: 'from-amber-300 to-amber-500' },
    { icon: Flame, title: 'On a Roll', tier: 'Bronze', text: '3 correct answers in a row', color: 'from-amber-300 to-amber-500' },
    { icon: Zap, title: 'Quick Draw', tier: 'Silver', text: 'Answer in under 5 seconds', color: 'from-slate-300 to-slate-500' },
    { icon: Crown, title: 'Golden Bunch', tier: 'Gold', text: 'Bank 10,000 total points', color: 'from-yellow-300 to-amber-500' },
];

const STEPS = [
    {
        icon: Users,
        title: 'Create your account',
        text: 'Sign up with email or one tap using Google or Facebook. Email accounts confirm a 6-digit code before the account is created.',
    },
    {
        icon: Gamepad2,
        title: 'Pick a play mode',
        text: 'Standard Easy, Standard Hard or Custom. Each mode changes the timer and challenge settings.',
    },
    {
        icon: Trophy,
        title: 'Calculate and climb',
        text: 'Calculate each banana value, beat the clock, build streaks, unlock achievements and rise up the global leaderboard.',
    },
];

const FAQS = [
    {
        q: 'Is Banana Quiz free?',
        a: 'Yes. Every mode, achievement and leaderboard feature is free to play. There are no downloads or paid unlocks.',
    },
    {
        q: 'Do I need an account to play?',
        a: 'You need an account to save scores, streaks and achievements. Sign up with email, Google or Facebook — it takes a few seconds.',
    },
    {
        q: 'Why do I need to verify my email?',
        a: 'New email accounts receive a 6-digit code. Entering it proves you own the address and activates the account. Google and Facebook sign-ins are already verified by the provider.',
    },
    {
        q: 'How does scoring work?',
        a: 'Each correct answer earns base points plus a speed bonus. Your current streak raises a multiplier. Wrong, skipped and timed-out quizzes earn zero points.',
    },
    {
        q: 'What is the difference between the modes?',
        a: 'Standard Easy has 10 quizzes with 30 seconds each, Standard Hard has 10 quizzes with 15 seconds each, and Custom lets you choose the quiz count and timer.',
    },
    {
        q: 'Does it work on phones?',
        a: 'Yes. The layout, number pad input and audio controls all work on mobile browsers. No app install required.',
    },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LandingPage() {
    usePageTitle();
    const { user } = useAuth();
    const [topPlayers, setTopPlayers] = useState([]);
    const [loadingTop, setLoadingTop] = useState(true);

    useEffect(() => {
        let active = true;
        userApi
            .leaderboard(5)
            .then((data) => {
                if (active) setTopPlayers(data.data || []);
            })
            .catch(() => {
                if (active) setTopPlayers([]);
            })
            .finally(() => {
                if (active) setLoadingTop(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const primaryTarget = user ? '/dashboard' : '/login?mode=register';
    const headerTarget = user ? '/dashboard' : '/login';

    return (
        <div className="min-h-screen">
            {/* Floating background bananas */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                {[...Array(9)].map((_, i) => (
                    <BananaLogo
                        key={i}
                        size={36 + (i % 3) * 18}
                        className="absolute opacity-10 animate-float"
                        style={{ left: `${6 + i * 11}%`, top: `${(i * 37) % 85}%`, animationDelay: `${i * 0.4}s` }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 border-b-2 border-banana-200/70 bg-banana-50/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
                    <Link to="/" className="flex items-center gap-2">
                        <BananaLogo size={42} className="animate-wiggle" />
                        <span className="font-display text-2xl font-extrabold text-banana-800">Banana Quiz</span>
                    </Link>

                    <nav className="hidden items-center gap-5 text-sm font-bold text-banana-700 md:flex">
                        <a href="#features" className="hover:text-banana-900">Features</a>
                        <a href="#modes" className="hover:text-banana-900">Modes</a>
                        <a href="#achievements" className="hover:text-banana-900">Achievements</a>
                        <a href="#how" className="hover:text-banana-900">How it works</a>
                        <a href="#faq" className="hover:text-banana-900">FAQ</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link to="/leaderboard" className="hidden sm:block">
                            <Button variant="ghost" className="!py-2 !text-base">
                                <Trophy size={17} /> Leaderboard
                            </Button>
                        </Link>
                        <Link to={headerTarget}>
                            <Button className="!px-4 !py-2 !text-base">
                                {user ? 'Dashboard' : 'Sign In'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                {/* Hero */}
                <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 md:grid-cols-2 md:px-6 md:pb-20 md:pt-16">
                    <div>
                        <motion.span
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-banana-300 bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-banana-700"
                        >
                            <Sparkles size={14} /> Free browser game · No downloads
                        </motion.span>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            className="mt-4 font-display text-5xl font-extrabold leading-[1.05] text-banana-800 md:text-6xl"
                        >
                            Calculate banana values.
                            <br />
                            <span className="text-banana-500">Beat the clock.</span>
                            <br />
                            Become a legend.
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.12 }}
                            className="mt-5 max-w-xl text-lg text-banana-700"
                        >
                            Banana Quiz is a fast, free calculation game. Study the banana puzzle, enter its value,
                            and chain correct answers for streak multipliers. Three modes, fourteen
                            achievements and a global leaderboard are waiting.
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-7 flex flex-col gap-3 sm:flex-row"
                        >
                            <Link to={primaryTarget}>
                                <Button className="w-full !px-8 !py-4 !text-xl sm:w-auto">
                                    <Play size={20} /> {user ? 'Go to dashboard' : 'Start playing free'}
                                </Button>
                            </Link>
                            <Link to="/leaderboard">
                                <Button variant="secondary" className="w-full !px-8 !py-4 !text-xl sm:w-auto">
                                    <Trophy size={20} /> See rankings
                                </Button>
                            </Link>
                        </motion.div>

                        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-banana-600">
                            <span className="flex items-center gap-1.5"><CircleCheck size={16} /> 3 game modes</span>
                            <span className="flex items-center gap-1.5"><CircleCheck size={16} /> 14 achievements</span>
                            <span className="flex items-center gap-1.5"><CircleCheck size={16} /> Sound & music</span>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, rotate: 2 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 14 }}
                        className="relative mx-auto w-full max-w-md"
                    >
                        <div className="rounded-3xl border-4 border-banana-300 bg-white/90 p-5 shadow-game">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BananaLogo size={44} className="animate-wiggle" />
                                    <div>
                                        <p className="font-display text-lg font-extrabold leading-none text-banana-800">Today's bunch</p>
                                        <p className="text-xs font-bold text-banana-500">Easy mode</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-banana-200 px-2.5 py-1 text-xs font-extrabold text-banana-800">30s</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-br from-banana-100 to-amber-100 p-4">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="flex aspect-square items-center justify-center rounded-xl bg-white/70">
                                        <Banana size={28 + (i % 3) * 4} className="text-banana-500" />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex-1 rounded-xl border-2 border-banana-300 bg-white px-3 py-2 text-center font-display text-xl font-extrabold text-banana-400">
                                    ?
                                </div>
                                <div className="rounded-xl bg-gradient-to-b from-banana-400 to-banana-600 px-4 py-2 font-display text-lg font-extrabold text-white shadow-game-sm">
                                    Submit
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                                <span className="flex items-center gap-1.5"><Flame size={16} /> 7 answer streak</span>
                                <span>+175 pts</span>
                            </div>
                        </div>

                        <div className="absolute -right-3 -top-3 rotate-6 rounded-2xl border-2 border-banana-400 bg-white px-3 py-2 shadow-game-sm">
                            <p className="flex items-center gap-1 text-xs font-extrabold text-banana-700">
                                <Star size={14} className="text-banana-500" /> 2× multiplier
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* Stat strip */}
                <section className="border-y-2 border-banana-200 bg-white/60">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
                        <StripStat icon={<Gamepad2 size={20} />} value="3" label="Play modes" />
                        <StripStat icon={<Award size={20} />} value="14" label="Achievements" />
                        <StripStat icon={<Smartphone size={20} />} value="100%" label="Mobile friendly" />
                        <StripStat icon={<ShieldCheck size={20} />} value="Free" label="No downloads" />
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
                    <SectionIntro
                        eyebrow="Why play"
                        title="A tiny game with a lot to master"
                        text="Simple to learn, hard to put down. Every round is a fresh puzzle and every answer can push your stats higher."
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ y: 16, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.04 }}
                                className="rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm"
                            >
                                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${feature.color}`}>
                                    <feature.icon size={21} />
                                </div>
                                <h3 className="font-display text-xl font-extrabold text-banana-800">{feature.title}</h3>
                                <p className="mt-1 text-sm text-banana-700">{feature.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Modes */}
                <section id="modes" className="bg-banana-100/60 py-14 md:py-20">
                    <div className="mx-auto max-w-6xl px-4 md:px-6">
                        <SectionIntro
                            eyebrow="Play your way"
                            title="Three modes, three vibes"
                            text="Pick the pace that suits you. Switch modes any time from your dashboard."
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            {MODE_LIST.map((mode) => {
                                const Icon = MODE_ICONS[mode.id] || Banana;
                                return (
                                    <div key={mode.id} className="flex flex-col rounded-3xl border-4 border-banana-300 bg-white/90 p-5 shadow-game">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-banana-300 to-banana-500 text-white">
                                                <Icon size={24} />
                                            </div>
                                            <span className="rounded-full bg-banana-200 px-2.5 py-1 text-[11px] font-extrabold uppercase text-banana-800">
                                                {mode.time} · {mode.multiplier}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-2xl font-extrabold text-banana-800">{mode.label}</h3>
                                        <p className="text-xs font-bold uppercase tracking-wide text-banana-500">{mode.tagline}</p>
                                        <p className="mt-2 flex-1 text-sm text-banana-700">{mode.description}</p>
                                        <Link to={user ? `/play?mode=${mode.id}` : '/login?mode=register'} className="mt-4">
                                            <Button className="w-full !py-2.5 !text-base">
                                                <Play size={16} /> Play {mode.label}
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Achievements teaser */}
                <section id="achievements" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
                    <div className="grid items-center gap-8 md:grid-cols-2">
                        <div>
                            <SectionIntro
                                eyebrow="Trophy cabinet"
                                title="Earn badges as you improve"
                                text="Achievements unlock automatically from your real stats. Chase streaks, speed records, point milestones and mode mastery."
                                align="left"
                            />
                            <Link to={user ? '/achievements' : '/login?mode=register'}>
                                <Button variant="secondary" className="!py-3">
                                    <Award size={18} /> Explore achievements
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {ACHIEVEMENT_TEASERS.map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ y: 12, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-2xl border-2 border-banana-200 bg-white/90 p-4 text-center shadow-game-sm"
                                >
                                    <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${item.color}`}>
                                        <item.icon size={24} />
                                    </div>
                                    <p className="font-display text-base font-extrabold text-banana-800">{item.title}</p>
                                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-banana-500">{item.tier}</p>
                                    <p className="mt-1 text-xs text-banana-600">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section id="how" className="border-y-2 border-banana-200 bg-white/60 py-14 md:py-20">
                    <div className="mx-auto max-w-6xl px-4 md:px-6">
                        <SectionIntro
                            eyebrow="Getting started"
                            title="From zero to banana hero in three steps"
                            text="No installs, no setup screens. You can be calculating banana values within a minute."
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            {STEPS.map((step, i) => (
                                <div key={step.title} className="relative rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm">
                                    <span className="absolute right-4 top-3 font-display text-4xl font-extrabold text-banana-200">
                                        {i + 1}
                                    </span>
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-banana-300 text-banana-800">
                                        <step.icon size={21} />
                                    </div>
                                    <h3 className="font-display text-xl font-extrabold text-banana-800">{step.title}</h3>
                                    <p className="mt-1 text-sm text-banana-700">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Leaderboard preview */}
                <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
                    <SectionIntro
                        eyebrow="Hall of bananas"
                        title="Who is on top right now?"
                        text="Live rankings from every player. Your position updates after every round."
                    />
                    <div className="overflow-hidden rounded-3xl border-4 border-banana-300 bg-white/90 shadow-game">
                        {loadingTop && (
                            <div className="py-10 text-center text-sm font-semibold text-banana-500">Loading rankings…</div>
                        )}
                        {!loadingTop && topPlayers.length === 0 && (
                            <div className="py-10 text-center">
                                <Trophy size={36} className="mx-auto mb-2 text-banana-400" />
                                <p className="font-bold text-banana-700">No scores yet — the first crown is up for grabs.</p>
                            </div>
                        )}
                        {topPlayers.map((entry, i) => (
                            <div
                                key={`${entry.displayName}-${i}`}
                                className={`flex items-center gap-3 px-4 py-3 ${i !== topPlayers.length - 1 ? 'border-b border-banana-100' : ''}`}
                            >
                                <div className="w-9 text-center font-display text-lg font-extrabold text-banana-700">
                                    {MEDALS[i] || entry.rank}
                                </div>
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-banana-200 font-bold text-banana-700">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        entry.displayName?.[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold text-banana-800">{entry.displayName}</p>
                                    <p className="text-xs text-banana-500">🔥 best streak {entry.bestStreak} · 🏆 {entry.gamesWon} wins</p>
                                </div>
                                <div className="font-display text-lg font-extrabold text-banana-700">{entry.totalPoints}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <Link to="/leaderboard">
                            <Button variant="ghost" className="!py-2 !text-base">
                                View full leaderboard <ArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="bg-banana-100/60 py-14 md:py-20">
                    <div className="mx-auto max-w-3xl px-4 md:px-6">
                        <SectionIntro
                            eyebrow="Good to know"
                            title="Frequently asked questions"
                            text="Everything you need to know before your first bunch."
                        />
                        <div className="space-y-3">
                            {FAQS.map((item) => (
                                <details key={item.q} className="group rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-extrabold text-banana-800">
                                        {item.q}
                                        <ChevronDown size={20} className="flex-shrink-0 text-banana-500 transition group-open:rotate-180" />
                                    </summary>
                                    <p className="mt-2 text-sm text-banana-700">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
                    <div className="relative overflow-hidden rounded-3xl border-4 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-banana-600 p-8 text-center shadow-game md:p-12">
                        <div className="pointer-events-none absolute inset-0 opacity-20">
                            {[...Array(12)].map((_, i) => (
                                <Banana
                                    key={i}
                                    size={30 + (i % 4) * 8}
                                    className="absolute text-white"
                                    style={{ left: `${(i * 13) % 95}%`, top: `${(i * 29) % 90}%` }}
                                />
                            ))}
                        </div>
                        <div className="relative">
                            <h2 className="font-display text-4xl font-extrabold text-white drop-shadow md:text-5xl">
                                Ready to calculate?
                            </h2>
                            <p className="mx-auto mt-2 max-w-xl text-banana-50">
                                Your first bunch is one click away. Play free, earn badges and see how high you can climb.
                            </p>
                            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link to={primaryTarget}>
                                    <Button className="w-full !bg-white !from-white !to-white !px-8 !py-4 !text-xl !text-banana-800 sm:w-auto">
                                        <Play size={20} /> {user ? 'Continue playing' : 'Create free account'}
                                    </Button>
                                </Link>
                                <Link to="/leaderboard">
                                    <Button variant="ghost" className="w-full !px-8 !py-4 !text-xl !text-white hover:!bg-white/20 sm:w-auto">
                                        <Trophy size={20} /> Leaderboard
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function SectionIntro({ eyebrow, title, text, align = 'center' }) {
    const alignment = align === 'left' ? 'text-left' : 'text-center mx-auto';
    return (
        <div className={`mb-8 max-w-2xl ${alignment}`}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-banana-500">{eyebrow}</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold text-banana-800 md:text-4xl">{title}</h2>
            <p className="mt-2 text-banana-700">{text}</p>
        </div>
    );
}

function StripStat({ icon, value, label }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-200 text-banana-700">{icon}</div>
            <div>
                <p className="font-display text-2xl font-extrabold leading-none text-banana-800">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-banana-500">{label}</p>
            </div>
        </div>
    );
}
