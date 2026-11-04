// src/services/game.service.js
const GameSession = require('../models/GameSession');
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
async function startSession(userId, modeId = DEFAULT_MODE) {
  const mode = getMode(modeId);
  const { imageUrl, solution } = await fetchPuzzle();
  const timeLimitMs = mode.timeLimitMs;
  const expiresAt = new Date(Date.now() + timeLimitMs);

  const session = await GameSession.create({
    user: userId,
    mode: mode.id,
    imageUrl,
    solution,
    expiresAt,
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
    },
  };
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
  await session.save();

  const score = await Score.recordResult(userId, {
    isCorrect,
    points,
    answerMs,
    mode: mode.id,
  });

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
    { $set: { status: 'expired' } },
    { new: true }
  ).select('+solution');

  if (session) {
    const score = await Score.recordResult(userId, {
      isCorrect: false,
      points: 0,
      answerMs: Math.max(0, session.expiresAt.getTime() - session.createdAt.getTime()),
      mode: session.mode,
    });

    return {
      timedOut: true,
      solution: session.solution,
      mode: session.mode,
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

module.exports = { startSession, submitAnswer, expireSession, getUserStats };
