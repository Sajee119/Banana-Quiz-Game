const mongoose = require('mongoose');

/**
 * A device that has already passed email two-factor verification.
 *
 * The browser holds a random token in an HTTP-only cookie. Only the SHA-256
 * hash of that token is stored here, so a database leak cannot be replayed to
 * skip the second factor. Records expire automatically after the trust window
 * the player picked in Profile -> Security (1, 5 or 10 days).
 */
const trustedDeviceSchema = new mongoose.Schema(
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
        label: {
            type: String,
            trim: true,
            default: 'This device',
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
        // Ties the trust record to the account's session version so a password
        // change or "sign out other devices" invalidates it as well.
        authVersion: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

trustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
trustedDeviceSchema.index({ user: 1, expiresAt: 1 });

module.exports = mongoose.model('TrustedDevice', trustedDeviceSchema);
