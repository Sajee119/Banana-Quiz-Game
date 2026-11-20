import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Braces,
    Briefcase,
    CalendarDays,
    CircleCheck,
    Code2,
    Database,
    ExternalLink,
    FolderGit2,
    Gamepad2,
    Globe,
    Heart,
    Layers,
    Mail,
    MapPin,
    Rocket,
    Server,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserRound,
} from 'lucide-react';
import PageShell, {
    primaryActionClass,
    secondaryActionClass,
} from '../components/PageShell.jsx';
import { GitHubIcon, XIcon } from '../components/BrandIcons.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { DEVELOPER, GITHUB_STATS, PROJECTS } from '../lib/developer.js';

const STAT_ICONS = [FolderGit2, Rocket, Braces, CalendarDays];
const STAT_TONES = {
    banana: 'border-banana-300 bg-banana-100 text-banana-800',
    sky: 'border-sky-300 bg-sky-100 text-sky-800',
    violet: 'border-violet-300 bg-violet-100 text-violet-800',
    emerald: 'border-emerald-300 bg-emerald-100 text-emerald-800',
};

const STORY = [
    {
        icon: Gamepad2,
        title: 'A simple idea',
        text: 'Turn quick mental arithmetic into a fast, friendly browser game. Study the banana puzzle, work out its value and beat the clock.',
        accent: 'from-banana-300 to-banana-500',
    },
    {
        icon: Layers,
        title: 'Built end to end',
        text: 'The React client talks to an Express API backed by MongoDB, with puzzles from the Banana API and a full account system around it.',
        accent: 'from-sky-400 to-sky-600',
    },
    {
        icon: ShieldCheck,
        title: 'Finished with care',
        text: 'Email verification, OAuth sign-in, password recovery, rate limiting, dark mode and reduced-motion support are part of the build, not an afterthought.',
        accent: 'from-emerald-400 to-emerald-600',
    },
];

const SKILLS = [
    {
        icon: Code2,
        title: 'Frontend',
        accent: 'from-sky-400 to-sky-600',
        items: ['React 19 + Vite', 'Tailwind CSS', 'Framer Motion', 'React Router'],
    },
    {
        icon: Server,
        title: 'Backend',
        accent: 'from-emerald-400 to-emerald-600',
        items: ['Node.js + Express', 'REST APIs', 'Joi validation', 'Rate limiting'],
    },
    {
        icon: Database,
        title: 'Data',
        accent: 'from-violet-400 to-violet-600',
        items: ['MongoDB', 'Mongoose models', 'Session stores', 'Data modelling'],
    },
    {
        icon: ShieldCheck,
        title: 'Auth & email',
        accent: 'from-orange-400 to-orange-600',
        items: ['Passport OAuth', 'bcrypt hashing', 'Nodemailer SMTP', 'OTP verification'],
    },
];

const GAME_HIGHLIGHTS = [
    'Three modes: Easy, Hard and Custom',
    'Fourteen achievements to unlock',
    'Streaks, speed bonuses and a global leaderboard',
    'Email verification, password reset and sign-in alerts',
];

const PROJECT_ACCENTS = [
    'from-banana-300 to-banana-500',
    'from-fuchsia-400 to-violet-600',
    'from-emerald-400 to-emerald-600',
    'from-sky-400 to-sky-600',
    'from-amber-300 to-orange-500',
    'from-rose-400 to-rose-600',
];

export default function AboutPage() {
    usePageTitle('About');

    return (
        <PageShell
            icon={UserRound}
            eyebrow="About"
            title="About Banana Quiz"
            subtitle="A fast banana-value quiz, built from scratch by Sajeepan — a full-stack developer from Sri Lanka."
            chips={[
                { icon: MapPin, label: DEVELOPER.location, tone: 'emerald' },
                {
                    icon: FolderGit2,
                    label: `${DEVELOPER.repositories} public repositories`,
                    tone: 'violet',
                },
                { icon: Rocket, label: '6 live demos', tone: 'sky' },
            ]}
            actions={
                <>
                    <a
                        href={DEVELOPER.github}
                        target="_blank"
                        rel="noreferrer"
                        className={secondaryActionClass}
                    >
                        <GitHubIcon size={16} /> View GitHub
                    </a>
                    <Link to="/contact" className={primaryActionClass}>
                        <Mail size={16} /> Contact me
                    </Link>
                </>
            }
        >
            <motion.section
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 p-5 shadow-game sm:p-7"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[16px] border-banana-200/60"
                />
                <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                    <div className="relative mx-auto w-fit md:mx-0">
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 rotate-3 rounded-2xl bg-gradient-to-br from-banana-300 to-amber-400"
                        />
                        <img
                            src={DEVELOPER.avatar}
                            alt={DEVELOPER.name}
                            width="176"
                            height="176"
                            referrerPolicy="no-referrer"
                            className="relative h-40 w-40 rounded-2xl border-2 border-white object-cover shadow-game-sm sm:h-44 sm:w-44"
                        />
                        <span className="absolute -bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-emerald-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 shadow-game-sm">
                            <CircleCheck size={12} /> Open to collaborate
                        </span>
                    </div>

                    <div className="min-w-0 text-center md:text-left">
                        <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-400 bg-gradient-to-b from-banana-100 to-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-banana-800 shadow-game-sm">
                            <Sparkles size={13} /> Meet the developer
                        </p>
                        <h2 className="mt-1 font-display text-3xl font-extrabold text-banana-900 sm:text-4xl">
                            Hi, I&apos;m {DEVELOPER.name}.
                        </h2>
                        <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold text-banana-800 sm:text-base md:mx-0">
                            {DEVELOPER.bio}
                        </p>

                        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px] font-extrabold md:justify-start">
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800">
                                <Briefcase size={12} /> {DEVELOPER.company}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                                <MapPin size={12} /> {DEVELOPER.location}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800">
                                <CalendarDays size={12} /> On GitHub since {DEVELOPER.joined}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-300 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-800">
                                <UserRound size={12} /> @{DEVELOPER.handle}
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                            <a
                                href={DEVELOPER.github}
                                target="_blank"
                                rel="noreferrer"
                                className={secondaryActionClass}
                            >
                                <GitHubIcon size={16} /> GitHub
                            </a>
                            <a
                                href={DEVELOPER.portfolio}
                                target="_blank"
                                rel="noreferrer"
                                className={secondaryActionClass}
                            >
                                <Globe size={16} /> Portfolio
                            </a>
                            <a
                                href={DEVELOPER.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className={secondaryActionClass}
                            >
                                <XIcon size={15} /> X / Twitter
                            </a>
                            <a href={`mailto:${DEVELOPER.email}`} className={primaryActionClass}>
                                <Mail size={16} /> Email me
                            </a>
                        </div>
                    </div>
                </div>
            </motion.section>

            <section className="grid gap-3 border-y-2 border-banana-200 bg-white/70 py-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="GitHub at a glance">
                {GITHUB_STATS.map((stat, index) => {
                    const Icon = STAT_ICONS[index] || Sparkles;
                    return (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3 rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm"
                        >
                            <span
                                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 ${STAT_TONES[stat.tone] || STAT_TONES.banana}`}
                            >
                                <Icon size={20} />
                            </span>
                            <div className="min-w-0">
                                <p className="font-display text-2xl font-extrabold leading-none text-banana-900">
                                    {stat.value}
                                </p>
                                <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-banana-800">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className="py-8 md:py-10">
                <div className="mb-3">
                    <h2 className="font-display text-2xl font-extrabold text-banana-900">
                        The story behind the game
                    </h2>
                    <p className="text-sm font-semibold text-banana-800">
                        From a quick arithmetic idea to a complete, account-based quiz platform.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {STORY.map((item) => (
                        <article
                            key={item.title}
                            className="relative overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm"
                        >
                            <span
                                aria-hidden="true"
                                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.accent}`}
                            />
                            <div
                                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-game-sm ${item.accent}`}
                            >
                                <item.icon size={21} />
                            </div>
                            <h3 className="font-display text-xl font-extrabold text-banana-800">
                                {item.title}
                            </h3>
                            <p className="mt-1 text-sm text-banana-800">{item.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 border-y-2 border-banana-200 bg-banana-100/60 py-8 md:py-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div>
                    <div className="mb-3">
                        <h2 className="font-display text-2xl font-extrabold text-banana-900">
                            What I work with
                        </h2>
                        <p className="text-sm font-semibold text-banana-800">
                            The tools used to design, build and ship Banana Quiz.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {SKILLS.map((skill) => (
                            <article
                                key={skill.title}
                                className="rounded-2xl border-2 border-banana-200 bg-white/90 p-4 shadow-game-sm"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-game-sm ${skill.accent}`}
                                    >
                                        <skill.icon size={18} />
                                    </span>
                                    <h3 className="font-display text-lg font-extrabold text-banana-800">
                                        {skill.title}
                                    </h3>
                                </div>
                                <ul className="mt-3 space-y-1 text-sm font-semibold text-banana-800">
                                    {skill.items.map((entry) => (
                                        <li key={entry} className="flex items-start gap-1.5">
                                            <CircleCheck
                                                size={14}
                                                className="mt-0.5 flex-shrink-0 text-banana-500"
                                            />
                                            {entry}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>

                <aside className="relative overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 p-5 shadow-game">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[12px] border-banana-300/50"
                    />
                    <div className="relative">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-banana-400 bg-banana-100 text-banana-700 shadow-game-sm">
                            <Trophy size={21} />
                        </span>
                        <h2 className="mt-3 font-display text-2xl font-extrabold text-banana-900">
                            Inside Banana Quiz
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-banana-800">
                            A quick look at what this project includes.
                        </p>
                        <ul className="mt-4 space-y-2 text-sm font-semibold text-banana-800">
                            {GAME_HIGHLIGHTS.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CircleCheck
                                        size={15}
                                        className="mt-0.5 flex-shrink-0 text-banana-700"
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                                to="/faq"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-400 bg-white px-4 py-2.5 font-display text-sm font-bold text-banana-800 shadow-game-sm transition hover:bg-banana-50 active:translate-y-0.5"
                            >
                                Read the FAQ <ArrowRight size={14} />
                            </Link>
                            <Link
                                to="/help"
                                className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 font-display text-sm font-bold text-banana-800 underline decoration-banana-700/40 underline-offset-2 transition hover:decoration-banana-800"
                            >
                                Help Centre
                            </Link>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="py-8 md:py-10">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="font-display text-2xl font-extrabold text-banana-900">
                            Selected projects
                        </h2>
                        <p className="text-sm font-semibold text-banana-800">
                            Six builds from the GitHub profile, each with a live demo where available.
                        </p>
                    </div>
                    <a
                        href={DEVELOPER.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-extrabold text-banana-800 transition hover:text-banana-900"
                    >
                        View all {DEVELOPER.repositories} repositories <ArrowRight size={15} />
                    </a>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PROJECTS.map((project, index) => (
                        <ProjectCard
                            key={project.name}
                            project={project}
                            accent={PROJECT_ACCENTS[index % PROJECT_ACCENTS.length]}
                        />
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
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-900/25 bg-banana-50/80 text-banana-900">
                            <Heart size={24} />
                        </div>
                        <div>
                            <h2 className="font-display text-2xl font-extrabold text-banana-900">
                                Let&apos;s build something together
                            </h2>
                            <p className="mt-1 max-w-2xl text-sm font-semibold text-banana-800">
                                Questions about the game, a project idea, or just want to say hello?
                                Send a message and it will land straight in my inbox.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href={DEVELOPER.github}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/50 bg-white/90 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-white active:translate-y-0.5"
                        >
                            <GitHubIcon size={17} /> GitHub
                        </a>
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-900/20 bg-banana-900 px-4 py-2.5 font-display text-sm font-bold text-banana-50 shadow-game-sm transition hover:brightness-110 active:translate-y-0.5"
                        >
                            <Mail size={17} /> Contact me
                        </Link>
                    </div>
                </div>
            </section>
        </PageShell>
    );
}

function ProjectCard({ project, accent }) {
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-banana-200 bg-white/90 p-5 shadow-game-sm transition hover:-translate-y-0.5 hover:border-banana-400">
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`}
            />
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-xl font-extrabold text-banana-800">
                    {project.name}
                </h3>
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800">
                    {project.language}
                </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-banana-800">{project.description}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-banana-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-banana-800"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-extrabold">
                {project.live && (
                    <a
                        href={project.live}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-banana-300 bg-banana-100 px-4 py-2.5 font-display text-sm font-bold text-banana-900 shadow-game-sm transition hover:bg-banana-200 active:translate-y-0.5"
                    >
                        Live demo <ExternalLink size={14} />
                    </a>
                )}
                <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-banana-800 transition hover:text-banana-900"
                >
                    <GitHubIcon size={15} /> Source
                </a>
            </div>
        </article>
    );
}
