const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true, 
            unique: true 
        },
        totalPoints: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        gamesWon: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 },
        fastestAnswerMs: { type: Number, default: null },
        lastPlayedAt: { type: Date, default: null },
        // Per-mode play counts. Stored here (not derived from GameSession)
        // because sessions are TTL-deleted once they expire.
        modePlays: {
            classic: { type: Number, default: 0 },
            blitz: { type: Number, default: 0 },
            zen: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Stable ordering for the public leaderboard.
scoreSchema.index({ totalPoints: -1, gamesWon: -1, bestStreak: -1, updatedAt: 1 });

// Add points & update streaks
scoreSchema.statics.recordResult = async function (userId, { isCorrect, points, answerMs, mode }) {
    const score = await this.findOneAndUpdate(
        { user: userId },
        { $setOnInsert: { user: userId } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    score.gamesPlayed += 1;
    score.lastPlayedAt = new Date();

    const modeKey = ['classic', 'blitz', 'zen'].includes(mode) ? mode : 'classic';
    if (!score.modePlays) {
        score.modePlays = { classic: 0, blitz: 0, zen: 0 };
    }
    score.modePlays[modeKey] = (score.modePlays[modeKey] || 0) + 1;
    score.markModified('modePlays');

    if (isCorrect) {
        score.gamesWon += 1;
        score.totalPoints += points;
        score.currentStreak += 1;
        score.bestStreak = Math.max(score.bestStreak, score.currentStreak);
        if (score.fastestAnswerMs == null || answerMs < score.fastestAnswerMs) {
            score.fastestAnswerMs = answerMs;
        }
    } else {
        score.currentStreak = 0;
    }

    await score.save();
    return score;
};

module.exports = mongoose.model('Score', scoreSchema);