const mongoose = require('mongoose');

/**
 * One record per sign-in attempt (successful or failed). Used by the account
 * page to show recent login history, failed attempts and known devices.
 * Failed attempts for unknown emails have no `user`, so only the email is kept.
 */
const loginEventSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
            index: true,
        },
        method: {
            type: String,
            enum: ['password', 'google', 'facebook', 'register'],
            required: true,
        },
        success: {
            type: Boolean,
            default: true,
            index: true,
        },
        reason: { type: String, default: '' },
        ip: { type: String, default: '' },
        userAgent: { type: String, default: '' },
        browser: { type: String, default: 'Unknown browser' },
        os: { type: String, default: 'Unknown OS' },
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'unknown'],
            default: 'unknown',
        },
        // SHA-256 of the express-session id, so we can highlight the device
        // that is making the current request without storing the raw cookie.
        sessionKey: { type: String, default: '', index: true },
    },
    { timestamps: true }
);

loginEventSchema.index({ user: 1, createdAt: -1 });
loginEventSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('LoginEvent', loginEventSchema);
