import { Link } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Mail } from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { SUPPORT_EMAIL } from '../lib/site.js';

/**
 * Renders a long-form legal document with a sticky table of contents.
 * Sections are plain data so the terms and privacy pages stay easy to edit.
 */
export default function LegalDocument({ intro, sections }) {
    return (
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <Card className="!p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-banana-500">
                        On this page
                    </p>
                    <nav aria-label="Document sections" className="mt-2">
                        <ul className="space-y-0.5 text-sm font-semibold text-banana-600">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className="block rounded-lg px-2 py-1 transition hover:bg-banana-100 hover:text-banana-900"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </Card>
            </aside>

            <div className="space-y-4">
                <Card className="!p-5 md:!p-7">
                    {intro && (
                        <p className="text-sm font-semibold leading-relaxed text-banana-700">
                            {intro}
                        </p>
                    )}
                    <div className="mt-5 space-y-6">
                        {sections.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-24"
                            >
                                <h2 className="font-display text-2xl font-extrabold text-banana-800">
                                    {section.title}
                                </h2>
                                <div className="mt-2 space-y-2 text-sm leading-relaxed text-banana-700">
                                    {section.body?.map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                    {section.bullets && (
                                        <ul className="list-disc space-y-1 pl-5">
                                            {section.bullets.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </Card>

                <Card className="!p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-banana-200 text-banana-700">
                            <LifeBuoy size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-lg font-extrabold text-banana-800">
                                Questions about this document?
                            </p>
                            <p className="text-sm font-semibold text-banana-600">
                                Visit the Help Centre or send us a message.
                            </p>
                        </div>
                        <Link to="/help">
                            <Button variant="secondary" className="!py-2 !text-base">
                                Help Centre <ArrowRight size={15} />
                            </Button>
                        </Link>
                        <a href={`mailto:${SUPPORT_EMAIL}`}>
                            <Button className="!py-2 !text-base">
                                <Mail size={15} /> Email us
                            </Button>
                        </a>
                    </div>
                </Card>
            </div>
        </div>
    );
}
