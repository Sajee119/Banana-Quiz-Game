import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { formatDateTime, formatDuration } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { gameApi } from '../api/client.js';

export default function GameOverviewPage() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    usePageTitle('Game overview');
    useEffect(() => {
        gameApi.game(gameId)
            .then((data) => setGame(data || null))
            .catch((err) => setError(err.friendlyMessage || 'Could not load game analysis.'))
            .finally(() => setLoading(false));
    }, [gameId]);
    if (loading) return <div className="min-h-screen"><AppHeader /><main className="py-16 text-center font-display text-xl text-banana-700">Loading analysis…</main></div>;
    if (error) return <div className="min-h-screen"><AppHeader /><main className="py-16 text-center font-bold text-red-600">{error}</main></div>;
    if (!game) return <div className="min-h-screen"><AppHeader /><main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="font-display text-3xl font-extrabold">Game not found</h1><Link to="/history"><Button className="mt-5">Back to history</Button></Link></main></div>;
    const total = game.totalPoints ?? game.quizzes.reduce((sum, item) => sum + (item.pointsAwarded || 0), 0);
    const correct = game.quizzes.filter((item) => item.isCorrect).length;
    return <div className="min-h-screen"><AppHeader /><main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="font-extrabold uppercase tracking-widest text-banana-600">Analysis of the last game</p><h1 className="font-display text-4xl font-extrabold text-banana-900">Game overview</h1><p className="mt-1 font-semibold text-banana-700">{formatDateTime(game.completedAt)} · {game.mode === 'custom' ? 'Custom practice' : 'Standard leaderboard game'}</p></div><Button variant="secondary" onClick={() => navigate('/history')}><ArrowLeft size={18} /> Game history</Button></div>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Summary label="Quizzes" value={game.quizzes.length} /><Summary label="Correct" value={`${correct}/${game.quizzes.length}`} /><Summary label="Points" value={`${total >= 0 ? '+' : ''}${total}`} /><Summary label="Leaderboard" value={game.leaderboardEligible ? 'Included' : 'Practice'} /></div>
        <div className="space-y-4">{game.quizzes.map((quiz, index) => <QuizCard key={quiz.id || `${game.id}-${index}`} quiz={quiz} index={index} />)}</div>
    </main></div>;
}

function Summary({ label, value }) { return <Card className="!p-4 text-center"><p className="text-xs font-extrabold uppercase text-banana-600">{label}</p><p className="mt-1 font-display text-2xl font-extrabold text-banana-900">{value}</p></Card>; }
function QuizCard({ quiz, index }) {
    const points = quiz.pointsAwarded || 0;
    const positive = quiz.isCorrect && points > 0;
    return <Card className="grid gap-4 !p-4 md:grid-cols-[120px_1fr_auto] md:items-center"><img src={quiz.imageUrl} alt={`Quiz ${index + 1}`} className="h-24 w-28 rounded-xl border-2 border-banana-300 object-cover" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-extrabold text-banana-900">Quiz {index + 1}</h2>{quiz.isCorrect ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-red-500" size={20} />}</div><p className="text-sm font-semibold text-banana-600">Attempted {formatDateTime(quiz.completedAt)}</p><p className="mt-2 text-sm font-bold text-banana-700"><Clock3 size={14} className="mr-1 inline" /> Response time: {quiz.status === 'expired' ? 'Time out' : formatDuration(quiz.timeToAnswerMs)}</p><p className="text-sm font-bold text-banana-700">Your answer: {quiz.playerAnswer ?? 'Skipped'} · Correct answer: {quiz.solution ?? '—'}</p></div><div className={`rounded-2xl px-4 py-3 text-center font-display text-xl font-extrabold ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{positive ? '+' : ''}{points} points<p className="text-xs font-bold">{quiz.status === 'expired' ? 'No points · timed out' : quiz.playerAnswer == null ? 'Skipped' : positive ? 'Correct answer' : 'No points'}</p></div></Card>;
}
