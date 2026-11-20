const mongoose = require('mongoose');

/**
 * A short-lived email verification challenge.
 *
 * Three kinds are supported:
 *  - `registration`     proves ownership of an email before a User is created.
 *  - `email_verification` confirms the email on an already signed-in account.
 *  - `login_2fa`        acts as the second factor when finishing a sign-in.
 *
 * Only hashes of the challenge token and the 6-digit OTP are stored. The
 * plain code is sent once by email and is never written to the database, so a
 * database leak cannot be replayed to take over an account.
 */
const emailVerificationSchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ['registration', 'email_verification', 'login_2fa'],
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        name: {
            type: String,
            trim: true,
            default: '',
        },
        // The pending password is already bcrypt-hashed. The plain password is
        // never stored, even temporarily.
        passwordHash: {
            type: String,
            default: null,
        },
        challengeHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        resendCount: {
            type: Number,
            default: 0,
        },
        lastSentAt: {
            type: Date,
            default: null,
        },
        requestedIp: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
