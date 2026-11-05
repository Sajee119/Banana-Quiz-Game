import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Eye, History, XCircle } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import { MODE_INFO, formatDateTime, formatDuration } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function HistoryPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    usePageTitle(sessionId ? 'Game details' : 'Game history');

    useEffect(() => {
        let cancelled = false;

        const request = sessionId ? gameApi.historyEntry(sessionId) : gameApi.history();
        request
            .then(({ data }) => {
                if (cancelled) return;
                setError('');
                if (sessionId) setEntry(data);
                else setHistory(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.friendlyMessage || 'Could not load game history.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-banana-600">
                            <History size={17} /> Your rounds
                        </p>
                        <h1 className="font-display text-4xl font-extrabold text-banana-900">
                            {sessionId ? 'Game details' : 'Game history'}
                        </h1>
                    </div>
                    <Link to={sessionId ? '/history' : '/play'}>
                        <Button variant="secondary">
                            {sessionId ? <><ArrowLeft size={18} /> All history</> : 'Play a game'}
                        </Button>
                    </Link>
                </div>

                {error && <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-center font-bold text-red-700">{error}</p>}
                {(loading || (sessionId && !entry && !error)) && <p className="py-16 text-center font-display text-xl text-banana-700">Loading your rounds…</p>}
                {!loading && !error && sessionId && entry && <HistoryDetail entry={entry} onBack={() => navigate('/history')} />}
                {!loading && !error && !sessionId && <HistoryList history={history} />}
            </main>
        </div>
    );
}

function HistoryList({ history }) {
    if (history.length === 0) {
        return (
            <Card className="py-16 text-center">
                <History size={48} className="mx-auto mb-3 text-banana-400" />
                <h2 className="font-display text-2xl font-extrabold text-banana-800">No rounds yet</h2>
                <p className="mt-1 text-banana-700">Play your first banana puzzle and it will appear here.</p>
                <Link to="/play"><Button className="mt-5">Start playing</Button></Link>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {history.map((item) => {
                const mode = MODE_INFO[item.mode] || MODE_INFO.classic;
                return (
                    <Link key={item.id} to={`/history/${item.id}`} className="group">
                        <Card className="flex h-full gap-4 !p-4 transition group-hover:-translate-y-1">
                            <img src={item.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl border-2 border-banana-300 object-cover" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-display text-xl font-extrabold text-banana-800">{mode.label}</p>
                                        <p className="text-xs font-semibold text-banana-600">{formatDateTime(item.completedAt)}</p>
                                    </div>
                                    <ResultBadge entry={item} />
                                </div>
                                <p className="mt-3 text-sm font-bold text-banana-700">
                                    Response: {item.playerAnswer ?? 'No response'} · Answer: {item.solution}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-banana-600">
                                    <Eye size={14} /> View round
                                </p>
                            </div>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

function HistoryDetail({ entry, onBack }) {
    const mode = MODE_INFO[entry.mode] || MODE_INFO.classic;
    return (
        <Card className="mx-auto max-w-3xl !p-5 md:!p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-banana-600">{mode.label} mode</p>
                    <p className="font-semibold text-banana-700">{formatDateTime(entry.completedAt)}</p>
                </div>
                <ResultBadge entry={entry} large />
            </div>
            <img src={entry.imageUrl} alt="Banana counting puzzle" className="mx-auto max-h-[420px] max-w-full rounded-2xl border-4 border-banana-300 object-contain shadow-game-sm" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <DetailStat label="Your response" value={entry.playerAnswer ?? 'No response'} />
                <DetailStat label="Correct answer" value={entry.solution} />
                <DetailStat label="Points" value={`+${entry.pointsAwarded}`} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-bold text-banana-700">
                <span className="flex items-center gap-1.5"><Clock3 size={16} /> {entry.timeToAnswerMs == null ? 'Timed out' : formatDuration(entry.timeToAnswerMs)}</span>
                <span>Result: {entry.isCorrect ? 'Correct' : entry.status === 'expired' ? 'Time up' : 'Incorrect'}</span>
            </div>
            <Button variant="secondary" onClick={onBack} className="mx-auto mt-6 flex"><ArrowLeft size={18} /> Back to history</Button>
        </Card>
    );
}

function DetailStat({ label, value }) {
    return <div className="rounded-2xl border-2 border-banana-200 bg-banana-50 px-3 py-3 text-center"><p className="text-xs font-bold uppercase text-banana-600">{label}</p><p className="mt-1 font-display text-2xl font-extrabold text-banana-900">{value}</p></div>;
}

function ResultBadge({ entry, large = false }) {
    const correct = entry.isCorrect;
    const timedOut = entry.status === 'expired';
    const Icon = correct ? CheckCircle2 : timedOut ? Clock3 : XCircle;
    return <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-extrabold ${large ? 'px-3 py-2 text-sm' : ''} ${correct ? 'bg-emerald-100 text-emerald-700' : timedOut ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}><Icon size={large ? 17 : 14} /> {correct ? 'Correct' : timedOut ? 'Time up' : 'Incorrect'}</span>;
}
