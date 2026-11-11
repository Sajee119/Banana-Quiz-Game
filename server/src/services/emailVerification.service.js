const crypto = require('crypto');
const env = require('../config/env');
const EmailVerification = require('../models/EmailVerification');
const { sendOtpEmail } = require('./mail.service');
const logger = require('../utils/logger');

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const OTP_PATTERN = /^\d{6}$/;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function hashValue(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function generateOtp() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function generateChallengeToken() {
    return crypto.randomBytes(32).toString('hex');
}

function maskEmail(email) {
    const value = String(email || '');
    const [localPart, domain = ''] = value.split('@');
    if (!localPart || !domain) return 'your email address';
    const visible = localPart.slice(0, Math.min(2, localPart.length));
    const domainParts = domain.split('.');
    const domainName = domainParts[0] || '';
    const domainMasked = `${domainName.slice(0, 1)}${'*'.repeat(Math.max(1, domainName.length - 1))}`;
    return `${visible}${'*'.repeat(Math.max(1, localPart.length - visible.length))}@${domainMasked}${
        domainParts.length > 1 ? `.${domainParts.slice(1).join('.')}` : ''
    }`;
}

function safeCompareHashes(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    if (leftBuffer.length !== rightBuffer.length || leftBuffer.length === 0) return false;
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function expiryDate() {
    return new Date(Date.now() + env.EMAIL_OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Create a new challenge, replacing any older one for the same purpose. This
 * makes the newest email the only valid code.
 */
async function createChallenge({
    kind,
    email,
    name = '',
    passwordHash = null,
    userId = null,
    ip = '',
    userAgent = '',
}) {
    const normalizedEmail = normalizeEmail(email);
    const challengeToken = generateChallengeToken();
    const otp = generateOtp();
    const expiresAt = expiryDate();

    const filter =
        kind === 'registration'
            ? { kind, email: normalizedEmail }
            : { kind, user: userId };

    await EmailVerification.deleteMany(filter);

    const record = await EmailVerification.create({
        kind,
        user: userId,
        email: normalizedEmail,
        name: String(name || '').trim(),
        passwordHash,
        challengeHash: hashValue(challengeToken),
        otpHash: hashValue(otp),
        expiresAt,
        lastSentAt: new Date(),
        requestedIp: ip,
        userAgent,
    });

    return {
        record,
        otp,
        challengeToken,
        expiresInMinutes: env.EMAIL_OTP_TTL_MINUTES,
        resendAfterSeconds: env.EMAIL_OTP_RESEND_SECONDS,
    };
}

async function findChallenge({ challengeToken, kind }) {
    if (typeof challengeToken !== 'string' || !TOKEN_PATTERN.test(challengeToken)) {
        return null;
    }
    return EmailVerification.findOne({
        challengeHash: hashValue(challengeToken),
        kind,
    });
}

/**
 * Compare the submitted code with the stored hash and count wrong attempts.
 * Returns a small status object so routes can produce friendly responses.
 */
async function checkOtp(record, otp) {
    if (!record) return { status: 'missing' };

    if (record.expiresAt.getTime() <= Date.now()) {
        return { status: 'expired' };
    }

    if (record.attempts >= env.EMAIL_OTP_MAX_ATTEMPTS) {
        return { status: 'locked' };
    }

    if (typeof otp !== 'string' || !OTP_PATTERN.test(otp)) {
        return {
            status: 'invalid',
            remainingAttempts: Math.max(0, env.EMAIL_OTP_MAX_ATTEMPTS - record.attempts),
        };
    }

    if (!safeCompareHashes(record.otpHash, hashValue(otp))) {
        record.attempts += 1;
        await record.save();
        return {
            status: 'invalid',
            remainingAttempts: Math.max(
                0,
                env.EMAIL_OTP_MAX_ATTEMPTS - record.attempts
            ),
        };
    }

    return { status: 'ok', record };
}

/**
 * Replace the code on an existing challenge (resend). The challenge token
 * stays the same so the browser can keep the verification page open.
 */
async function refreshChallenge(record) {
    const otp = generateOtp();
    record.otpHash = hashValue(otp);
    record.attempts = 0;
    record.resendCount += 1;
    record.lastSentAt = new Date();
    record.expiresAt = expiryDate();
    await record.save();

    return {
        otp,
        expiresInMinutes: env.EMAIL_OTP_TTL_MINUTES,
        resendAfterSeconds: env.EMAIL_OTP_RESEND_SECONDS,
    };
}

async function deliverOtp({ record, otp, purpose }) {
    const delivery = await sendOtpEmail({
        to: record.email,
        name: record.name,
        otp,
        expiresInMinutes: env.EMAIL_OTP_TTL_MINUTES,
        purpose,
    });

    if (!delivery.sent) {
        logger.warn(
            `Email verification code for ${record.email} could not be delivered (${delivery.reason || 'unknown'}).`
        );
    }

    return delivery;
}

function resendAvailableAt(record) {
    if (!record.lastSentAt) return new Date();
    return new Date(
        new Date(record.lastSentAt).getTime() + env.EMAIL_OTP_RESEND_SECONDS * 1000
    );
}

function canResend(record) {
    if (record.resendCount >= env.EMAIL_OTP_MAX_RESENDS) {
        return { allowed: false, reason: 'limit' };
    }
    const availableAt = resendAvailableAt(record);
    if (availableAt.getTime() > Date.now()) {
        return {
            allowed: false,
            reason: 'cooldown',
            retryAfter: Math.ceil((availableAt.getTime() - Date.now()) / 1000),
        };
    }
    return { allowed: true };
}

function buildStatusPayload(record) {
    return {
        kind: record.kind,
        email: maskEmail(record.email),
        expiresAt: record.expiresAt,
        resendAvailableAt: resendAvailableAt(record),
        resendCount: record.resendCount,
        resendLimit: env.EMAIL_OTP_MAX_RESENDS,
        attemptsRemaining: Math.max(
            0,
            env.EMAIL_OTP_MAX_ATTEMPTS - record.attempts
        ),
    };
}

module.exports = {
    TOKEN_PATTERN,
    OTP_PATTERN,
    normalizeEmail,
    hashValue,
    maskEmail,
    createChallenge,
    findChallenge,
    checkOtp,
    refreshChallenge,
    deliverOtp,
    canResend,
    buildStatusPayload,
};
