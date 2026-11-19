import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks, LifeBuoy, Mail } from 'lucide-react';

const stripLeadingNumber = (title) => title.replace(/^\d+\.\s*/, '');

/**
 * Renders a long-form legal document with a numbered, sticky table of contents.
 * The active section is tracked with an IntersectionObserver so the contents
 * stay in sync while the reader scrolls. Sections are plain data so the terms
 * and privacy pages stay easy to edit.
 */
export default function LegalDocument({ intro, sections }) {
    const [activeId, setActiveId] = useState(sections[0]?.id ?? null);
    const atBottomRef = useRef(false);

    useEffect(() => {
        const elements = sections
            .map((section) => document.getElementById(section.id))
            .filter(Boolean);
        if (!elements.length || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }

        const visible = new Map();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) visible.set(entry.target.id, entry.target);
                    else visible.delete(entry.target.id);
                });
                const first = [...visible.values()].sort(
                    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
                )[0];
                if (first && !atBottomRef.current) setActiveId(first.id);
            },
            { rootMargin: '-88px 0px -55% 0px' }
        );

        elements.forEach((element) => observer.observe(element));

        // Short final sections may never reach the observer's active band,
        // so treat the bottom of the page as the last section.
        const handleScroll = () => {
            const doc = document.documentElement;
            const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 8;
            atBottomRef.current = atBottom;
            if (atBottom) {
                setActiveId(sections[sections.length - 1].id);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [sections]);

    return (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <div className="overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/70 shadow-game">
                    <div className="flex items-center gap-2 border-b-2 border-banana-200 bg-banana-100/80 px-4 py-3">
                        <ListChecks size={16} className="flex-shrink-0 text-banana-800" />
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-banana-800">
                            On this page
                        </p>
                        <span className="ml-auto rounded-full border-2 border-banana-300 bg-white px-2 py-0.5 text-[10px] font-extrabold text-banana-800">
                            {sections.length}
                        </span>
                    </div>
                    <nav
                        aria-label="Document sections"
                        className="max-h-[45vh] overflow-y-auto p-2 lg:max-h-[calc(100dvh-9rem)]"
                    >
                        <ol className="space-y-0.5">
                            {sections.map((section, index) => {
                                const active = activeId === section.id;
                                return (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            aria-current={active ? 'location' : undefined}
                                            className={`flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold transition ${
                                                active
                                                    ? 'bg-banana-200 text-banana-900'
                                                    : 'text-banana-800 hover:bg-banana-100 hover:text-banana-900'
                                            }`}
                                        >
                                            <span
                                                className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-extrabold ${
                                                    active
                                                        ? 'border-banana-500 bg-banana-300 text-banana-900'
                                                        : 'border-banana-300 bg-white text-banana-800'
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <span className="min-w-0 leading-snug">
                                                {stripLeadingNumber(section.title)}
                                            </span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </div>
            </aside>

            <div className="space-y-4">
                <article className="overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 shadow-game">
                    <div
                        aria-hidden="true"
                        className="h-2.5 w-full bg-gradient-to-r from-banana-400 via-banana-500 to-amber-500"
                    />
                    <div className="p-5 md:p-7">
                        {intro && (
                            <div className="rounded-2xl border-2 border-banana-200 bg-banana-50/80 p-4">
                                <p className="text-sm font-semibold leading-relaxed text-banana-800">
                                    {intro}
                                </p>
                            </div>
                        )}

                        <div className="mt-5 space-y-7">
                            {sections.map((section, index) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    className="scroll-mt-24 border-t-2 border-dashed border-banana-200 pt-6 first:border-0 first:pt-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-2 border-banana-400 bg-banana-200 font-display text-base font-extrabold text-banana-900">
                                            {index + 1}
                                        </span>
                                        <h2 className="font-display text-2xl font-extrabold leading-tight text-banana-800">
                                            {stripLeadingNumber(section.title)}
                                        </h2>
                                    </div>

                                    <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-banana-800 md:pl-12">
                                        {section.body?.map((paragraph, bodyIndex) => (
                                            <p key={bodyIndex}>{paragraph}</p>
                                        ))}
                                        {section.bullets && (
                                            <ul className="space-y-2 pt-1">
                                                {section.bullets.map((item, bulletIndex) => (
                                                    <li
                                                        key={bulletIndex}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-banana-400 ring-2 ring-banana-200"
                                                        />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </article>

                <section className="banana-promo-panel relative overflow-hidden rounded-[1.5rem] border-2 border-banana-400 bg-gradient-to-br from-banana-300 via-banana-400 to-amber-500 p-5 shadow-game md:p-7">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full border-[14px] border-white/25"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full border-[14px] border-white/20"
                    />
                    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-banana-900/25 bg-banana-50/80 text-banana-900">
                                <LifeBuoy size={24} />
                            </div>
                            <div>
                                <h2 className="font-display text-2xl font-extrabold text-banana-900">
                                    Questions about this document?
                                </h2>
                                <p className="mt-1 text-sm font-semibold text-banana-800">
                                    Visit the Help Centre or send us a message and we will help.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                to="/help"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50 px-4 py-2.5 font-display text-base font-bold text-banana-900 shadow-game-sm transition hover:from-banana-50 hover:to-banana-100 active:translate-y-[1px]"
                            >
                                Help Centre <ArrowRight size={16} />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-b-4 border-banana-900/40 bg-banana-900 px-4 py-2.5 font-display text-base font-bold text-banana-50 shadow-game-sm transition hover:brightness-110 active:translate-y-[2px] active:border-b-2"
                            >
                                <Mail size={16} /> Contact us
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
