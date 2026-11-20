import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    Banana,
    ChevronDown,
    CircleCheck,
    Crown,
    Flame,
    Gamepad2,
    Globe,
    Leaf,
    MousePointerClick,
    Play,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Timer,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import BananaLogo from '../components/BananaLogo.jsx';
import Button from '../components/Button.jsx';
import FullscreenButton from '../components/FullscreenButton.jsx';
import { useAuth } from '../context/auth-context.js';
import { userApi } from '../api/client.js';
import { MODE_LIST } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const NAV_LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#modes', label: 'Modes' },
    { href: '#progress', label: 'Progress' },
    { href: '#how', label: 'How it works' },
    { href: '#faq', label: 'FAQ' },
];

const MODE_ICONS = { easy: Banana, hard: Timer, custom: Leaf };

const MODE_ACCENTS = {
    easy: 'from-emerald-400 to-emerald-600',
    hard: 'from-orange-400 to-red-500',
    custom: 'from-sky-400 to-violet-500',
};

const FEATURES = [
    {
        icon: MousePointerClick,
        title: 'Instant rounds',
        text: 'Open a mode and start calculating banana values in seconds. No downloads or tutorials.',
        color: 'from-banana-300 to-banana-500',
    },
    {
        icon: Timer,
        title: 'Beat the clock',
        text: 'Quick answers earn speed bonuses. Every second counts when the timer is running.',
        color: 'from-sky-300 to-sky-500',
    },
    {
        icon: Flame,
        title: 'Build streaks',
        text: 'Chain correct answers to raise your multiplier and turn a good round into a great one.',
        color: 'from-orange-300 to-orange-500',
    },
    {
        icon: Globe,
        title: 'Climb the board',
        text: 'Standard scores join the global leaderboard. Custom games stay private practice.',
        color: 'from-emerald-300 to-emerald-500',
    },
];

const ACHIEVEMENTS = [
    { icon: Banana, title: 'First Peel', tier: 'Bronze', text: 'Finish your first round', color: 'from-amber-300 to-amber-500' },
    { icon: Flame, title: 'On a Roll', tier: 'Bronze', text: '3 correct answers in a row', color: 'from-amber-300 to-amber-500' },
    { icon: Zap, title: 'Quick Draw', tier: 'Silver', text: 'Answer in under 5 seconds', color: 'from-slate-300 to-slate-500' },
    { icon: Crown, title: 'Golden Bunch', tier: 'Gold', text: 'Bank 10,000 total points', color: 'from-yellow-300 to-amber-500' },
];

const TIER_TONES = {
    Bronze: 'border-amber-300 bg-amber-100 text-amber-800',
    Silver: 'border-slate-300 bg-slate-100 text-slate-700',
    Gold: 'border-yellow-300 bg-yellow-100 text-yellow-800',
};

const STEPS = [
    {
        icon: Users,
        title: 'Create your account',
        text: 'Sign up with email, Google or Facebook. Email accounts confirm a 6-digit code before activation.',
    },
    {
        icon: Gamepad2,
        title: 'Pick a play mode',
        text: 'Choose Standard Easy, Standard Hard or Custom. Each mode changes the timer and challenge.',
    },
    {
        icon: Trophy,
        title: 'Calculate and climb',
        text: 'Answer banana puzzles, build streaks, unlock achievements and rise up the leaderboard.',
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
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,197,66,0.18),transparent_38%),radial-gradient(circle_at_15%_85%,rgba(244,197,66,0.12),transparent_30%)]" />
                {[...Array(8)].map((_, i) => (
                    <BananaLogo
                        key={i}
                        size={28 + (i % 4) * 12}
                        alt=""
                        className="absolute opacity-[0.07] animate-float"
                        style={{
                            left: `${(i * 13) % 94}%`,
                            top: `${(i * 19) % 90}%`,
                            animationDelay: `${i * 0.4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 border-b-2 border-banana-200 bg-banana-50/95 shadow-game-sm backdrop-blur-md">
                <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <Link to="/" className="flex flex-shrink-0 items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-400 bg-gradient-to-b from-banana-200 to-banana-300 shadow-game-sm">
                            <BananaLogo size={28} className="animate-wiggle" />
                        </span>
                        <span className="font-display text-xl font-extrabold text-banana-900">
                            Banana Quiz
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex" aria-label="Landing navigation">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-xl border border-transparent px-3 py-2 font-display text-sm font-semibold text-banana-800 transition hover:border-banana-300 hover:bg-banana-100 hover:text-banana-900"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <FullscreenButton />
                        <Link to="/leaderboard" className="hidden sm:block">
                            <Button variant="ghost" className="!px-3 !py-2 !text-sm">
                                <Trophy size={17} /> Rankings
                            </Button>
                        </Link>
                        <Link to={headerTarget}>
                            <Button className="!px-4 !py-2 !text-sm">
                                {user ? 'Dashboard' : 'Sign in'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                {/* Hero */}
                <section className="relative mx-auto grid w-full items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
                    <div>
                        <motion.span
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1.5 font-display text-xs font-bold text-banana-900 shadow-game-sm"
                        >
                            <Sparkles size={14} className="text-banana-600" /> Free browser arcade
                        </motion.span>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            className="mt-5 font-display text-5xl font-extrabold leading-[0.98] text-banana-900 xl:text-6xl"
                        >
                            Count the bananas.
                            <br />
                            <span className="text-banana-600">Beat the clock.</span>
                            <br />
                            Climb the ranks.
                        </motion.h1>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.12 }}
                            className="mt-6 max-w-xl text-lg font-semibold leading-relaxed text-banana-800"
                        >
                            Banana Quiz is a fast, playful calculation game. Read each puzzle, enter its
                            value, and chain correct answers for streak multipliers. Three modes,
                            fourteen achievements, and a global leaderboard are ready.
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 flex flex-col gap-3 sm:flex-row"
                        >
                            <Link to={primaryTarget}>
                                <Button className="w-full !px-8 !py-4 !text-xl sm:w-auto">
                                    <Play size={20} />{' '}
                                    {user ? 'Go to dashboard' : 'Start playing free'}
                                </Button>
                            </Link>
                            <Link to="/leaderboard">
                                <Button
                                    variant="secondary"
                                    className="w-full !px-8 !py-4 !text-xl sm:w-auto"
                                >
                                    <Trophy size={20} /> See rankings
                                </Button>
                            </Link>
                        </motion.div>

                        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-banana-800">
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                <CircleCheck size={15} className="text-emerald-600" /> No downloads
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                <Smartphone size={15} className="text-emerald-600" /> Mobile friendly
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1">
                                <ShieldCheck size={15} className="text-emerald-600" /> Free forever
                            </span>
                        </div>
                    </div>

                    {/* Logo only */}
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 14 }}
                        className="relative mx-auto flex w-full max-w-md items-center justify-center py-8"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute inset-4 rounded-full bg-banana-400/25 blur-3xl"
                        />
                        <BananaLogo
                            size={420}
                            className="relative h-auto w-full animate-float drop-shadow-[0_20px_35px_rgba(109,74,14,0.22)]"
                        />
                    </motion.div>
                </section>

                {/* Stat strip */}
                <section className="border-y-2 border-banana-200 bg-white/70">
                    <div className="mx-auto grid w-full grid-cols-2 gap-3 px-4 py-6 sm:px-6 md:grid-cols-4">
                        <StripStat icon={<Gamepad2 size={20} />} value="3" label="Play modes" />
                        <StripStat icon={<Award size={20} />} value="14" label="Achievements" />
                        <StripStat icon={<Globe size={20} />} value="Global" label="Leaderboard" />
                        <StripStat icon={<Zap size={20} />} value="Free" label="No downloads" />
                    </div>
                </section>

                {/* Features */}
                <section
                    id="features"
                    className="mx-auto w-full scroll-mt-24 px-4 py-16 sm:px-6 md:py-24"
                >
                    <SectionIntro
                        eyebrow="Why play"
                        title="Small puzzles. Big momentum."
                        text="Simple to learn, hard to put down. Every round is a fresh puzzle and every answer can push your stats higher."
                    />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ y: 16, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-2xl border-2 border-banana-200 bg-white/90 p-6 shadow-game-sm"
                            >
                                <div
                                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-game-sm ${feature.color}`}
                                >
                                    <feature.icon size={22} aria-hidden="true" />
                                </div>
                                <h3 className="font-display text-xl font-extrabold text-banana-800">
                                    {feature.title}
                                </h3>
                                <p className="mt-1.5 text-sm font-semibold text-banana-700">
                                    {feature.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Modes */}
                <section
                    id="modes"
                    className="scroll-mt-24 border-y-2 border-banana-200 bg-banana-100/60 py-16 md:py-24"
                >
                    <div className="mx-auto w-full px-4 sm:px-6">
                        <SectionIntro
                            eyebrow="Play your way"
                            title="Three modes, three paces"
                            text="Pick the pace that suits you. Switch modes any time from your dashboard."
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            {MODE_LIST.map((mode) => {
                                const Icon = MODE_ICONS[mode.id] || Banana;
                                const accent = MODE_ACCENTS[mode.id] || MODE_ACCENTS.easy;
                                return (
                                    <div
                                        key={mode.id}
                                        className="flex flex-col overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 shadow-game"
                                    >
                                        <div
                                            className={`flex items-center justify-between gap-2 bg-gradient-to-br px-5 py-4 text-white ${accent}`}
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20">
                                                <Icon size={24} aria-hidden="true" />
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-1.5">
                                                <span className="rounded-full border-2 border-white/40 bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                                                    {mode.time}
                                                </span>
                                                <span className="rounded-full border-2 border-white/40 bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                                                    {mode.multiplier}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col p-5">
                                            <h3 className="font-display text-2xl font-extrabold text-banana-800">
                                                {mode.label}
                                            </h3>
                                            <p className="text-xs font-bold uppercase tracking-wide text-banana-500">
                                                {mode.tagline}
                                            </p>
                                            <p className="mt-2 flex-1 text-sm font-semibold text-banana-700">
                                                {mode.description}
                                            </p>
                                            <Link
                                                to={
                                                    user
                                                        ? `/play?mode=${mode.id}`
                                                        : '/login?mode=register'
                                                }
                                                className="mt-4"
                                            >
                                                <Button className="w-full !py-2.5 !text-base">
                                                    <Play size={16} /> Play {mode.label}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Progress */}
                <section
                    id="progress"
                    className="mx-auto w-full scroll-mt-24 px-4 py-16 sm:px-6 md:py-24"
                >
                    <SectionIntro
                        eyebrow="Your progress"
                        title="Badges to earn. Ranks to climb."
                        text="Achievements unlock from your real stats, while the leaderboard shows how you stack up against every other player."
                    />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border-2 border-banana-200 bg-white/90 p-6 shadow-game-sm">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                                    <Award size={20} />
                                </span>
                                <div>
                                    <h3 className="font-display text-xl font-extrabold text-banana-800">
                                        Trophy cabinet
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-wide text-banana-500">
                                        14 achievements
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                {ACHIEVEMENTS.map((item, i) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ y: 12, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        className="rounded-2xl border-2 border-banana-200 bg-banana-50/60 p-4 text-center"
                                    >
                                        <div
                                            className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-game-sm ${item.color}`}
                                        >
                                            <item.icon size={22} aria-hidden="true" />
                                        </div>
                                        <p className="font-display text-base font-extrabold text-banana-800">
                                            {item.title}
                                        </p>
                                        <span
                                            className={`mt-1 inline-flex rounded-full border-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${TIER_TONES[item.tier]}`}
                                        >
                                            {item.tier}
                                        </span>
                                        <p className="mt-1.5 text-xs font-semibold text-banana-600">
                                            {item.text}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                            <Link to={user ? '/achievements' : '/login?mode=register'} className="mt-5 inline-block">
                                <Button variant="secondary" className="!py-3">
                                    <Award size={18} /> Explore achievements
                                </Button>
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 shadow-game">
                            <div className="flex items-center justify-between gap-2 border-b-2 border-banana-200 bg-banana-50/80 px-4 py-3">
                                <p className="flex items-center gap-2 font-display text-lg font-extrabold text-banana-800">
                                    <Trophy size={18} className="text-banana-500" /> Top bananas
                                </p>
                                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                                </span>
                            </div>

                            {loadingTop && (
                                <div className="py-12 text-center text-sm font-semibold text-banana-500">
                                    Loading rankings…
                                </div>
                            )}
                            {!loadingTop && topPlayers.length === 0 && (
                                <div className="py-12 text-center">
                                    <Trophy size={36} className="mx-auto mb-2 text-banana-400" aria-hidden="true" />
                                    <p className="font-bold text-banana-700">
                                        No scores yet — the first crown is up for grabs.
                                    </p>
                                </div>
                            )}
                            {topPlayers.map((entry, i) => (
                                <div
                                    key={`${entry.displayName}-${i}`}
                                    className={`flex items-center gap-3 px-4 py-3 ${
                                        i !== topPlayers.length - 1 ? 'border-b border-banana-100' : ''
                                    }`}
                                >
                                    <div
                                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-2 font-display text-sm font-extrabold ${
                                            i === 0
                                                ? 'border-yellow-300 bg-yellow-100 text-yellow-800'
                                                : i === 1
                                                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                                                  : i === 2
                                                    ? 'border-amber-300 bg-amber-100 text-amber-800'
                                                    : 'border-banana-200 bg-banana-50 text-banana-700'
                                        }`}
                                    >
                                        {MEDALS[i] || entry.rank}
                                    </div>
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-banana-200 bg-banana-200 font-bold text-banana-700">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            entry.displayName?.[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold text-banana-800">{entry.displayName}</p>
                                        <p className="text-xs text-banana-500">
                                            🔥 best streak {entry.bestStreak} · 🏆 {entry.gamesWon} wins
                                        </p>
                                    </div>
                                    <div className="font-display text-lg font-extrabold text-banana-700">
                                        {entry.totalPoints}
                                    </div>
                                </div>
                            ))}
                            <div className="border-t-2 border-banana-200 bg-banana-50/60 px-4 py-3 text-center">
                                <Link
                                    to="/leaderboard"
                                    className="inline-flex items-center gap-1.5 font-display text-sm font-extrabold text-banana-700 hover:text-banana-900"
                                >
                                    View full leaderboard <ArrowRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section
                    id="how"
                    className="scroll-mt-24 border-y-2 border-banana-200 bg-white/60 py-16 md:py-24"
                >
                    <div className="mx-auto w-full px-4 sm:px-6">
                        <SectionIntro
                            eyebrow="Getting started"
                            title="From zero to banana hero in three steps"
                            text="No installs, no setup screens. You can be calculating banana values within a minute."
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            {STEPS.map((step, i) => (
                                <div
                                    key={step.title}
                                    className="relative overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-6 shadow-game-sm"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="absolute -right-1 -top-2 font-display text-6xl font-extrabold text-banana-100"
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-banana-300 bg-banana-200 text-banana-800">
                                        <step.icon size={22} aria-hidden="true" />
                                    </div>
                                    <h3 className="relative font-display text-xl font-extrabold text-banana-800">
                                        {step.title}
                                    </h3>
                                    <p className="relative mt-1.5 text-sm font-semibold text-banana-700">
                                        {step.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section
                    id="faq"
                    className="scroll-mt-24 border-b-2 border-banana-200 bg-banana-100/60 py-16 md:py-24"
                >
                    <div className="mx-auto grid w-full gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <SectionIntro
                                eyebrow="Good to know"
                                title="Frequently asked questions"
                                text="Everything you need to know before your first bunch."
                                align="left"
                            />
                            <div className="rounded-2xl border-2 border-banana-200 bg-white/80 p-4">
                                <p className="font-display text-lg font-extrabold text-banana-800">
                                    Still curious?
                                </p>
                                <p className="mt-1 text-sm font-semibold text-banana-700">
                                    Read the help centre or send us a message — we answer every banana
                                    question.
                                </p>
                                <Link
                                    to="/help"
                                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-banana-600 underline hover:text-banana-800"
                                >
                                    Visit the help centre <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {FAQS.map((item) => (
                                <details
                                    key={item.q}
                                    className="group rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-extrabold text-banana-800">
                                        {item.q}
                                        <ChevronDown
                                            size={20}
                                            aria-hidden="true"
                                            className="flex-shrink-0 text-banana-500 transition group-open:rotate-180"
                                        />
                                    </summary>
                                    <p className="mt-2 text-sm font-semibold text-banana-700">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="mx-auto w-full px-4 py-16 sm:px-6 md:py-24">
                    <div className="banana-promo-panel relative overflow-hidden rounded-2xl border-2 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-banana-600 p-8 text-center shadow-game md:p-12">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20">
                            {[...Array(12)].map((_, i) => (
                                <Banana
                                    key={i}
                                    size={30 + (i % 4) * 8}
                                    className="absolute text-white"
                                    style={{
                                        left: `${(i * 13) % 95}%`,
                                        top: `${(i * 29) % 90}%`,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="relative">
                            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white">
                                <Sparkles size={14} /> Your first bunch is waiting
                            </span>
                            <h2 className="mt-3 font-display text-4xl font-extrabold text-white drop-shadow md:text-5xl">
                                Ready to calculate?
                            </h2>
                            <p className="mx-auto mt-2 max-w-xl font-semibold text-banana-50">
                                Your first bunch is one click away. Play free, earn badges and see how
                                high you can climb.
                            </p>
                            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link to={primaryTarget}>
                                    <Button className="w-full !bg-white !from-white !to-white !px-8 !py-4 !text-xl !text-banana-800 sm:w-auto">
                                        <Play size={20} />{' '}
                                        {user ? 'Continue playing' : 'Create free account'}
                                    </Button>
                                </Link>
                                <Link to="/leaderboard">
                                    <Button
                                        variant="ghost"
                                        className="w-full !px-8 !py-4 !text-xl !text-white hover:!bg-white/20 sm:w-auto"
                                    >
                                        <Trophy size={20} /> Leaderboard
                                    </Button>
                                </Link>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-white/90">
                                <span className="flex items-center gap-1.5">
                                    <CircleCheck size={16} /> No downloads
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CircleCheck size={16} /> 3 game modes
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CircleCheck size={16} /> 14 achievements
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function SectionIntro({ eyebrow, title, text, align = 'center' }) {
    const alignment = align === 'left' ? 'text-left' : 'mx-auto text-center';
    return (
        <div className={`mb-8 max-w-2xl ${alignment}`}>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                <Sparkles size={13} aria-hidden="true" /> {eyebrow}
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-banana-900 md:text-4xl">
                {title}
            </h2>
            <p className="mt-2 font-semibold leading-relaxed text-banana-800">{text}</p>
        </div>
    );
}

function StripStat({ icon, value, label }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 px-3.5 py-3 shadow-game-sm">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-300 bg-banana-100 text-banana-700">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="font-display text-2xl font-extrabold leading-none text-banana-900">
                    {value}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-banana-700">
                    {label}
                </p>
            </div>
        </div>
    );
}
