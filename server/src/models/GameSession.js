const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        mode: {
            type: String,
            enum: ['classic', 'blitz', 'zen', 'easy', 'hard', 'custom'],
            default: 'classic',
            index: true,
        },
        imageUrl: { type: String, required: true },
        solution: { type: Number, required: true, select: false }, // never leaked by default
        status: {
            type: String,
            enum: ['active', 'answered', 'expired'],
            default: 'active',
            index: true,
        },
        playerAnswer: { type: Number, default: null },
        isCorrect: { type: Boolean, default: null },
        pointsAwarded: { type: Number, default: 0 },
        timeToAnswerMs: { type: Number, default: null },
        completedAt: { type: Date, default: null, index: true },
        expiresAt: { type: Date, required: true },
        gameId: { type: String, default: null, index: true },
        quizTimeSeconds: { type: Number, default: null },
        leaderboardEligible: { type: Boolean, default: true },
    },
    { timestamps: true }
);

gameSessionSchema.index({ user: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);