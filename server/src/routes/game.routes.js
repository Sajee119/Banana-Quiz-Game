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
    mode: Joi.string().valid('classic', 'blitz', 'zen').default('classic'),
});

const answerSchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
    answer: Joi.number().integer().min(0).max(1000).required(),
});

const expireSchema = Joi.object({
    sessionId: Joi.string().hex().length(24).required(),
});

router.post('/start', asyncHandler(async (req, res) => {
    const { value, error } = startSchema.validate(req.body || {});
    if (error) return res.status(400).json({ success: false, message: error.message });

    const session = await gameService.startSession(req.user.id, value.mode);
    res.status(201).json({ success: true, data: session });
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

router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await gameService.getUserStats(req.user.id);
    res.json({ success: true, data: stats });
}));

module.exports = router;