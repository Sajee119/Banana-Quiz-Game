const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        mode: {
            type: String,
            enum: ['classic', 'blitz', 'zen'],
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
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

gameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GameSession', gameSessionSchema);