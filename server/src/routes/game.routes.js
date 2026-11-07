const router = require('express').Router();
const Joi = require('joi');
const { ensureAuthenticated } = require('../middleware/auth.middleware');
const gameService = require('../services/game.service');
const { listModes } = require('../config/gameModes');
const asyncHandler = require('../utils/asyncHandler');

// Public: the landing page and dashboard use this to render mode cards.
router.get('/modes', (req, res) => {
    res.json({ success: true, data: listModes() });
});

// All remaining game routes require auth
router.use(ensureAuthenticated);

const startSchema = Joi.object({
    mode: Joi.string().valid('classic', 'blitz', 'zen', 'easy', 'hard', 'custom').default('easy'),
    quizTimeSeconds: Joi.number().integer().valid(10, 15, 20, 30, 45, 60).default(30),
    gameId: Joi.string().max(80).required(),
    quizCount: Joi.number().integer().min(1).max(30).default(10),
    leaderboardEligible: Joi.boolean().default(true),
});

const answerSchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
    answer: Joi.number().integer().min(0).max(1000).required(),
});

const expireSchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
});
const skipSchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
});
const historyEntrySchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
});
const gameHistorySchema = Joi.object({
    gameId: Joi.string().max(80).required(),
});

router.post('/start', asyncHandler(async (req, res) => {
    const { value, error } = startSchema.validate(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error.message });

    const session = await gameService.startSession(req.user.id, value.mode, value);
    res.status(201).json({ success: true, data: session });
}));

router.get('/games', asyncHandler(async (req, res) => {
    const history = await gameService.getAllGames(req.user.id, req.query.limit);
    res.json({ success: true, data: history });
}));

router.get('/games/:gameId', asyncHandler(async (req, res) => {
    const { value, error } = gameHistorySchema.validate(req.params);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const game = await gameService.getGameEntry(req.user.id, value.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game history entry not found' });
    res.json({ success: true, data: game });
}));

router.post('/answer', asyncHandler(async (req, res) => {
    const { value, error } = answerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const result = await gameService.submitAnswer(req.user.id, value.sessionId, value.answer);
    if (result.error) {
        return res.status(result.status).json({
            success: false,
            message: result.error,
            solution: result.solution ?? null,
            stats: result.stats ?? null,
            timedOut: Boolean(result.timedOut),
        });
    }

    res.json({ success: true, data: result });
}));

router.post('/expire', asyncHandler(async (req, res) => {
    const { value, error } = expireSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const result = await gameService.expireSession(req.user.id, value.sessionId);
    if (result.error) {
        return res.status(result.status).json({
            success: false,
            message: result.error,
            solution: result.solution ?? null,
            stats: result.stats ?? null,
            remainingMs: result.remainingMs ?? null,
        });
    }

    res.json({ success: true, data: result });
}));

router.post('/skip', asyncHandler(async (req, res) => {
    const { value, error } = skipSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const result = await gameService.skipSession(req.user.id, value.sessionId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    res.json({ success: true, data: result });
}));

router.post('/quit', asyncHandler(async (req, res) => {
    const { value, error } = Joi.object({ gameId: Joi.string().max(80).required() }).validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });
    const result = await gameService.quitGame(req.user.id, value.gameId);
    res.json({ success: true, data: result });
}));

router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await gameService.getUserStats(req.user.id);
    res.json({ success: true, data: stats });
}));

router.get('/history', asyncHandler(async (req, res) => {
    const history = await gameService.getGameHistory(req.user.id, req.query.limit);
    res.json({ success: true, data: history });
}));

router.get('/history/:sessionId', asyncHandler(async (req, res) => {
    const { value, error } = historyEntrySchema.validate(req.params);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const session = await gameService.getGameHistoryEntry(req.user.id, value.sessionId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'Game history entry not found' });
    }
    res.json({ success: true, data: session });
}));

module.exports = router;