import { Link } from 'react-router-dom';
import { History as HistoryIcon, Eye, Trophy } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { gameApi } from '../api/client.js';
import { MODE_INFO, formatDateTime } from '../lib/format.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useEffect, useState } from 'react';

export default function HistoryPage() {
    usePageTitle('Game history');
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        gameApi.games()
            .then((data) => {
                if (active) setGames(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (active) setError(err.friendlyMessage || 'Could not load game history.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="min-h-screen">
            <AppHeader />
            <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
                <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-banana-600">
                            <HistoryIcon size={17} /> Your games
                        </p>
                        <h1 className="font-display text-4xl font-extrabold text-banana-900">Game history</h1>
                    </div>
                    <Link to="/play">
                        <Button variant="secondary">Play a game</Button>
                    </Link>
                </header>

                {error && <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-center font-bold text-red-700">{error}</p>}
                {loading && <p className="py-16 text-center font-display text-xl text-banana-700">Loading game history…</p>}
                {!loading && !error && games.length === 0 && <EmptyHistory />}
                {!loading && !error && games.length > 0 && (
                    <div className="space-y-4">
                        {games.map((game) => <GameRow key={game.id} game={game} />)}
                    </div>
                )}
            </main>
        </div>
    );
}

function GameRow({ game }) {
    const mode = MODE_INFO[game.mode] || { label: game.mode || 'Game' };
    const quizzes = game.quizzes || [];
    const points = game.totalPoints || 0;
    const correct = game.correctCount ?? quizzes.filter((quiz) => quiz.isCorrect).length;
    const status = game.status === 'completed' ? 'Completed' : game.status === 'quit' ? 'Quit early' : 'In progress';
    return (
        <Card className="flex flex-col gap-4 !p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="font-display text-2xl font-extrabold text-banana-900">{mode.label}</p>
                <p className="text-sm font-semibold text-banana-600">
                    {formatDateTime(game.completedAt || game.startedAt)} · {game.quizCount || quizzes.length} quizzes · {correct} correct
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm font-extrabold">
                    <span className={points > 0 ? 'text-emerald-600' : points < 0 ? 'text-red-600' : 'text-banana-700'}>
                        {points > 0 ? '+' : ''}{points} points
                    </span>
                    <span className="text-banana-500">· {game.leaderboardEligible ? 'Leaderboard' : 'Practice only'}</span>
                    <span className="text-banana-500">· {status}</span>
                </div>
            </div>
            <Link to={`/game-overview/${encodeURIComponent(game.id)}`} className="shrink-0">
                <Button variant="secondary"><Eye size={18} /> View analysis</Button>
            </Link>
        </Card>
    );
}

function EmptyHistory() {
    return (
        <Card className="py-16 text-center">
            <Trophy size={48} className="mx-auto mb-3 text-banana-400" />
            <h2 className="font-display text-2xl font-extrabold text-banana-800">No games yet</h2>
            <p className="mt-1 text-banana-700">Play your first banana quiz and it will appear here.</p>
            <Link to="/play"><Button className="mt-5">Start playing</Button></Link>
        </Card>
    );
}
