// src/services/game.service.js
const GameSession = require('../models/GameSession');
const Game = require('../models/Game');
const mongoose = require('mongoose');
const Score = require('../models/Score');
const { fetchPuzzle } = require('./banana.service');
const { getMode, DEFAULT_MODE } = require('../config/gameModes');

const env = require('../config/env');
const BASE_POINTS = env.GAME_BASE_POINTS;
const FAST_BONUS_MAX = env.GAME_FAST_BONUS_MAX;
const FAST_THRESHOLD_MS = env.GAME_FAST_THRESHOLD_MS;
const STREAK_MULTIPLIER_STEP = 0.1;
const MAX_STREAK_MULTIPLIER = env.GAME_MAX_STREAK_MULTIPLIER;

function statsPayload(score) {
  return {
    totalPoints: score.totalPoints,
    gamesPlayed: score.gamesPlayed,
    gamesWon: score.gamesWon,
    currentStreak: score.currentStreak,
    bestStreak: score.bestStreak,
    fastestAnswerMs: score.fastestAnswerMs,
  };
}

/**
 * Start a new game: fetch puzzle, hide solution, return only image.
 * `serverNow` and `remainingMs` let the client run its countdown against the
 * server clock instead of assuming the device clock is correct.
 */
async function startSession(userId, modeId = DEFAULT_MODE, options = {}) {
  const mode = getMode(modeId);
  const { imageUrl, solution } = await fetchPuzzle();
  const timeLimitMs = modeId === 'custom'
      ? Number(options.quizTimeSeconds || 30) * 1000
      : mode.timeLimitMs;
  const expiresAt = new Date(Date.now() + timeLimitMs);
  const gameId = options.gameId;
  await Game.findOneAndUpdate(
    { user: userId, gameId },
    {
      $setOnInsert: {
        user: userId,
        gameId,
        mode: mode.id,
        quizCount: Number(options.quizCount || (mode.id === 'custom' ? 10 : 10)),
        quizTimeSeconds: Math.round(timeLimitMs / 1000),
        leaderboardEligible: options.leaderboardEligible !== false,
        startedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const session = await GameSession.create({
    user: userId,
    mode: mode.id,
    imageUrl,
    solution,
    expiresAt,
    gameId,
    quizTimeSeconds: Math.round(timeLimitMs / 1000),
    leaderboardEligible: options.leaderboardEligible !== false,
  });

  const serverNow = new Date();

  return {
    sessionId: session._id,
    imageUrl: session.imageUrl,
    expiresAt: session.expiresAt,
    serverNow,
    remainingMs: Math.max(0, session.expiresAt.getTime() - serverNow.getTime()),
    timeLimitMs,
    mode: {
      id: mode.id,
      label: mode.label,
      tagline: mode.tagline,
      pointsMultiplier: mode.pointsMultiplier,
      speedBonus: mode.speedBonus,
      gameId: session.gameId,
      quizTimeSeconds: session.quizTimeSeconds,
      leaderboardEligible: session.leaderboardEligible,
    },
    gameId: session.gameId,
  };
}

async function updateGameProgress(session) {
  if (!session.gameId) return;
  const completed = await GameSession.countDocuments({
    user: session.user,
    gameId: session.gameId,
    status: { $in: ['answered', 'expired'] },
  });
  const game = await Game.findOne({ user: session.user, gameId: session.gameId });
  if (!game) return;
  const complete = completed >= game.quizCount;
  await Game.updateOne(
    { _id: game._id },
    { $set: { status: complete ? 'completed' : 'active', completedAt: complete ? new Date() : null } }
  );
}

/**
 * Submit an answer and score it. The session is claimed atomically so two
 * rapid submissions (or a submission racing the timer) can only score once.
 */
async function submitAnswer(userId, sessionId, answer) {
  const now = new Date();
  const session = await GameSession.findOneAndUpdate(
    { _id: sessionId, user: userId, status: 'active', expiresAt: { $gt: now } },
    { $set: { status: 'answered' } },
    { new: true }
  ).select('+solution');

  if (!session) {
    const existing = await GameSession.findOne({ _id: sessionId, user: userId }).select('+solution');
    if (!existing) {
      return { error: 'SESSION_NOT_FOUND', status: 404 };
    }
    if (existing.status === 'answered') {
      return { error: 'SESSION_ALREADY_ANSWERED', status: 409 };
    }

    // The round ran out. Record it as a played (lost) round and reveal the
    // solution so the player learns the answer.
    const timeout = await expireSession(userId, sessionId);
    return {
      error: 'SESSION_EXPIRED',
      status: 410,
      solution: timeout.solution ?? existing.solution,
      stats: timeout.stats ?? null,
      timedOut: true,
    };
  }

  const isCorrect = Number(answer) === session.solution;
  const answerMs = Date.now() - session.createdAt.getTime();
  const mode = getMode(session.mode);

  // ---- Scoring ----
  let points = 0;
  if (isCorrect) {
    const speedBonus = mode.speedBonus
      ? Math.max(
          0,
          Math.round(FAST_BONUS_MAX * (1 - Math.min(answerMs, FAST_THRESHOLD_MS) / FAST_THRESHOLD_MS))
        )
      : 0;

    const scoreDoc = await Score.findOne({ user: userId });
    const streak = scoreDoc ? scoreDoc.currentStreak : 0;
    const streakMultiplier = Math.min(
      MAX_STREAK_MULTIPLIER,
      1 + streak * STREAK_MULTIPLIER_STEP
    );

    points = Math.round((BASE_POINTS + speedBonus) * streakMultiplier * mode.pointsMultiplier);
  }

  session.playerAnswer = Number(answer);
  session.isCorrect = isCorrect;
  session.pointsAwarded = points;
  session.timeToAnswerMs = answerMs;
  session.completedAt = now;
  await session.save();
  await updateGameProgress(session);

  const score = session.leaderboardEligible
    ? await Score.recordResult(userId, { isCorrect, points, answerMs, mode: mode.id })
    : await getUserStats(userId);

  return {
    isCorrect,
    pointsAwarded: points,
    answerMs,
    solution: session.solution, // reveal only AFTER answering
    playerAnswer: session.playerAnswer,
    mode: mode.id,
    stats: statsPayload(score),
  };
}

/**
 * End an active round because its timer ran out. The round is recorded as a
 * played loss (so games played, win rate and mode achievements stay accurate)
 * and the solution is returned for the result screen.
 *
 * The update is atomic, which makes this safe to call from both the client's
 * timer and a late answer submission.
 */
async function expireSession(userId, sessionId) {
  const now = new Date();
  const session = await GameSession.findOneAndUpdate(
    { _id: sessionId, user: userId, status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired', completedAt: now } },
    { new: true }
  ).select('+solution');

  if (session) {
    await updateGameProgress(session);
    const score = session.leaderboardEligible
      ? await Score.recordResult(userId, {
          isCorrect: false,
          points: 0,
          answerMs: Math.max(0, session.expiresAt.getTime() - session.createdAt.getTime()),
          mode: session.mode,
        })
      : await getUserStats(userId);

    return {
      timedOut: true,
      solution: session.solution,
      mode: session.mode,
      completedAt: session.completedAt,
      stats: statsPayload(score),
    };
  }

  const existing = await GameSession.findOne({ _id: sessionId, user: userId }).select('+solution');
  if (!existing) {
    return { error: 'SESSION_NOT_FOUND', status: 404 };
  }
  if (existing.status === 'answered') {
    return { error: 'SESSION_ALREADY_ANSWERED', status: 409, solution: existing.solution };
  }
  if (existing.status === 'expired') {
    const stats = await getUserStats(userId);
    return {
      timedOut: true,
      alreadyRecorded: true,
      solution: existing.solution,
      mode: existing.mode,
      stats: statsPayload(stats),
    };
  }

  // Still active on the server: the client's clock was a little ahead.
  return {
    error: 'SESSION_NOT_EXPIRED',
    status: 409,
    remainingMs: Math.max(0, existing.expiresAt.getTime() - now.getTime()),
  };
}

async function skipSession(userId, sessionId) {
  const now = new Date();
  const session = await GameSession.findOneAndUpdate(
    { _id: sessionId, user: userId, status: 'active' },
    { $set: { status: 'answered', completedAt: now, playerAnswer: null, isCorrect: false, pointsAwarded: 0 } },
    { new: true }
  ).select('+solution');

  if (!session) return { error: 'SESSION_NOT_FOUND_OR_ALREADY_COMPLETE', status: 409 };
  session.timeToAnswerMs = Math.max(0, now.getTime() - session.createdAt.getTime());
  await session.save();
  await updateGameProgress(session);
  const score = session.leaderboardEligible
    ? await Score.recordResult(userId, { isCorrect: false, points: 0, answerMs: session.timeToAnswerMs, mode: session.mode })
    : await getUserStats(userId);
  return { skipped: true, solution: session.solution, pointsAwarded: 0, stats: statsPayload(score) };
}

async function quitGame(userId, gameId) {
  const score = await Score.recordQuitPenalty(userId);
  await Game.updateOne(
    { user: userId, gameId },
    { $set: { status: 'quit', completedAt: new Date(), quitPenalty: -10 } }
  );
  return { penalty: -10, stats: statsPayload(score) };
}

function historyPayload(session) {
  return {
    id: session._id,
    mode: session.mode,
    imageUrl: session.imageUrl,
    status: session.status,
    playerAnswer: session.playerAnswer,
    solution: session.solution,
    isCorrect: session.isCorrect,
    pointsAwarded: session.pointsAwarded,
    timeToAnswerMs: session.timeToAnswerMs,
    completedAt: session.completedAt || session.updatedAt || session.createdAt,
    createdAt: session.createdAt,
    gameId: session.gameId,
    quizTimeSeconds: session.quizTimeSeconds,
    leaderboardEligible: session.leaderboardEligible,
  };
}

async function getGameHistory(userId, limit = 50) {
  const sessions = await GameSession.find({
    user: userId,
    status: { $in: ['answered', 'expired'] },
  })
    .select('+solution')
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .lean();

  return sessions.map(historyPayload);
}

function gamePayload(game, sessions) {
  const quizzes = sessions.map(historyPayload);
  return {
    id: game.gameId,
    mode: game.mode,
    quizCount: game.quizCount,
    time: game.quizTimeSeconds,
    startedAt: game.startedAt,
    completedAt: game.completedAt || game.updatedAt,
    status: game.status,
    leaderboardEligible: game.leaderboardEligible,
    quitPenalty: game.quitPenalty,
    quizzes,
    totalPoints: quizzes.reduce((sum, quiz) => sum + (quiz.pointsAwarded || 0), 0) + game.quitPenalty,
    correctCount: quizzes.filter((quiz) => quiz.isCorrect).length,
  };
}

async function getAllGames(userId, limit = 50) {
  const games = await Game.find({ user: userId })
    .sort({ startedAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .lean();
  const result = [];
  for (const game of games) {
    const sessions = await GameSession.find({ user: userId, gameId: game.gameId })
      .select('+solution')
      .sort({ createdAt: 1 })
      .lean();
    result.push(gamePayload(game, sessions));
  }
  const legacySessions = await GameSession.find({ user: userId, gameId: null })
    .select('+solution')
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
    .lean();
  for (const session of legacySessions) {
    result.push(gamePayload({
      gameId: String(session._id),
      mode: session.mode,
      quizCount: 1,
      quizTimeSeconds: session.quizTimeSeconds || 30,
      startedAt: session.createdAt,
      completedAt: session.completedAt,
      status: session.status === 'active' ? 'active' : 'completed',
      leaderboardEligible: session.leaderboardEligible !== false,
      quitPenalty: 0,
    }, [session]));
  }
  const groupedSessions = await GameSession.find({
    user: userId,
    gameId: { $ne: null, $nin: games.map((game) => game.gameId) },
  })
    .select('+solution')
    .sort({ createdAt: 1 })
    .lean();
  const orphanGroups = new Map();
  for (const session of groupedSessions) {
    const group = orphanGroups.get(session.gameId) || [];
    group.push(session);
    orphanGroups.set(session.gameId, group);
  }
  for (const [gameId, sessions] of orphanGroups) {
    const first = sessions[0];
    result.push(gamePayload({
      gameId,
      mode: first.mode,
      quizCount: sessions.length,
      quizTimeSeconds: first.quizTimeSeconds || 30,
      startedAt: first.createdAt,
      completedAt: sessions[sessions.length - 1].completedAt,
      status: sessions.some((session) => session.status === 'active') ? 'active' : 'completed',
      leaderboardEligible: sessions.every((session) => session.leaderboardEligible !== false),
      quitPenalty: 0,
    }, sessions));
  }
  result.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  return result;
}

async function getGameEntry(userId, gameId) {
  const game = await Game.findOne({ user: userId, gameId }).lean();
  if (!game) {
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      const legacy = await GameSession.findOne({ _id: gameId, user: userId, gameId: null })
        .select('+solution')
        .lean();
      if (legacy) return gamePayload({
        gameId,
        mode: legacy.mode,
        quizCount: 1,
        quizTimeSeconds: legacy.quizTimeSeconds || 30,
        startedAt: legacy.createdAt,
        completedAt: legacy.completedAt,
        status: legacy.status === 'active' ? 'active' : 'completed',
        leaderboardEligible: legacy.leaderboardEligible !== false,
        quitPenalty: 0,
      }, [legacy]);
    }
    const grouped = await GameSession.find({ user: userId, gameId })
      .select('+solution')
      .sort({ createdAt: 1 })
      .lean();
    if (!grouped.length) return null;
    const first = grouped[0];
    return gamePayload({
      gameId,
      mode: first.mode,
      quizCount: grouped.length,
      quizTimeSeconds: first.quizTimeSeconds || 30,
      startedAt: first.createdAt,
      completedAt: grouped[grouped.length - 1].completedAt,
      status: grouped.some((session) => session.status === 'active') ? 'active' : 'completed',
      leaderboardEligible: grouped.every((session) => session.leaderboardEligible !== false),
      quitPenalty: 0,
    }, grouped);
  }
  const sessions = await GameSession.find({ user: userId, gameId })
    .select('+solution')
    .sort({ createdAt: 1 })
    .lean();
  return gamePayload(game, sessions);
}

async function getGameHistoryEntry(userId, sessionId) {
  const session = await GameSession.findOne({
    _id: sessionId,
    user: userId,
    status: { $in: ['answered', 'expired'] },
  })
    .select('+solution')
    .lean();

  return session ? historyPayload(session) : null;
}

/**
 * Get a user's scoreboard entry.
 */
async function getUserStats(userId) {
  const score = await Score.findOne({ user: userId });
  if (!score) {
    return {
      totalPoints: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      bestStreak: 0,
      fastestAnswerMs: null,
    };
  }
  return score;
}

module.exports = {
  startSession,
  submitAnswer,
  expireSession,
  skipSession,
  quitGame,
  getUserStats,
  getGameHistory,
  getGameHistoryEntry,
  getAllGames,
  getGameEntry,
};
