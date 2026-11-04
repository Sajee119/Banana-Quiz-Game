const mongoose = require('mongoose');

/**
 * A single-use password reset token. Only a SHA-256 hash of the token is
 * stored, so a database leak cannot be used to reset accounts. Expired
 * documents are removed automatically by MongoDB's TTL monitor.
 */
const passwordResetTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        requestedIp: { type: String, default: '' },
        userAgent: { type: String, default: '' },
    },
    { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
