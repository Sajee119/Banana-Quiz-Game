const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        gameId: { type: String, required: true },
        mode: { type: String, enum: ['classic', 'blitz', 'zen', 'easy', 'hard', 'custom'], required: true },
        quizCount: { type: Number, required: true },
        quizTimeSeconds: { type: Number, required: true },
        leaderboardEligible: { type: Boolean, default: true },
        status: { type: String, enum: ['active', 'completed', 'quit'], default: 'active', index: true },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        quitPenalty: { type: Number, default: 0 },
    },
    { timestamps: true }
);

gameSchema.index({ user: 1, gameId: 1 }, { unique: true });
gameSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
