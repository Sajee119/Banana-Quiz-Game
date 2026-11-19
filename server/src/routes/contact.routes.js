const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { sendContactEmail, isConfigured } = require('../services/mail.service');
const { getClientIp, parseUserAgent } = require('../utils/userAgent');

const router = express.Router();

// Keep the list in sync with client/src/lib/site.js.
const CONTACT_SUBJECTS = [
    'General question',
    'Bug report',
    'Account help',
    'Feedback',
    'Partnership',
    'Privacy request',
];

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many messages from this device. Please wait a few minutes and try again.',
    },
});

const contactSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(80)
        .pattern(/^[^\r\n]+$/)
        .required()
        .messages({
            'string.empty': 'Please enter your name.',
            'string.min': 'Your name must be at least 2 characters.',
            'string.max': 'Your name must be 80 characters or fewer.',
            'string.pattern.base': 'Please remove line breaks from your name.',
            'any.required': 'Please enter your name.',
        }),
    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .max(254)
        .required()
        .messages({
            'string.empty': 'Please enter your email address.',
            'string.email': 'Enter a valid email address.',
            'any.required': 'Please enter your email address.',
        }),
    subject: Joi.string()
        .valid(...CONTACT_SUBJECTS)
        .required()
        .messages({
            'any.only': 'Choose a valid topic.',
            'any.required': 'Choose a topic.',
        }),
    message: Joi.string()
        .trim()
        .min(20)
        .max(4000)
        .required()
        .messages({
            'string.empty': 'Please write a message.',
            'string.min': 'Your message must be at least 20 characters.',
            'string.max': 'Your message must be 4,000 characters or fewer.',
            'any.required': 'Please write a message.',
        }),
    // Honeypot: real visitors never see or fill this field.
    website: Joi.string().allow('').max(200).default(''),
});

router.post(
    '/',
    contactLimiter,
    asyncHandler(async (req, res) => {
        const payload = req.body || {};

        // Pretend the bot succeeded so it does not learn how the trap works.
        if (typeof payload.website === 'string' && payload.website.trim()) {
            logger.warn(`Contact honeypot triggered from ${getClientIp(req) || 'unknown IP'}`);
            return res.json({ success: true, message: 'Thanks! Your message has been sent.' });
        }

        const { error, value } = contactSchema.validate(payload, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        if (!isConfigured()) {
            logger.warn('Contact form unavailable because SMTP is not configured');
            return res.status(503).json({
                success: false,
                message: 'The contact form is temporarily unavailable. Please try again later.',
            });
        }

        const userAgent = parseUserAgent(req.headers['user-agent'] || '');
        const result = await sendContactEmail({
            name: value.name,
            email: value.email,
            subject: value.subject,
            message: value.message,
            meta: {
                receivedAt: new Date().toISOString(),
                ipAddress: getClientIp(req) || 'Unavailable',
                device: userAgent.label,
                deviceType: userAgent.deviceType,
            },
        });

        if (!result.sent) {
            return res.status(502).json({
                success: false,
                message: 'Your message could not be sent right now. Please try again in a moment.',
            });
        }

        logger.info(`Contact message delivered (${value.subject}) from ${value.email}`);
        return res.json({
            success: true,
            message: `Thanks, ${value.name.split(' ')[0]}! Your message was sent. I'll reply to ${value.email} soon.`,
        });
    })
);

module.exports = router;
