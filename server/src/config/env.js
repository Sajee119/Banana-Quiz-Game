const Joi = require('joi');
require('dotenv').config();

const schema = Joi.object({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(3000),
    SESSION_SECRET: Joi.string().min(32).required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    FACEBOOK_APP_ID: Joi.string().required(),
    FACEBOOK_APP_SECRET: Joi.string().required(),
    CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
    AUTH_CALLBACK_URL: Joi.string().uri().default('http://localhost:3000'),
    COOKIE_SECURE: Joi.boolean().default(false),

    PASSWORD_RESET_TTL_MINUTES: Joi.number().min(5).max(120).default(30),
    SMTP_HOST: Joi.string().allow('').default(''),
    SMTP_PORT: Joi.number().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.string().allow('').default(''),
    SMTP_PASS: Joi.string().allow('').default(''),
    MAIL_FROM: Joi.string().default('Banana Quiz <no-reply@bananaquiz.local>'),
}).unknown();

const { error, value: envVars } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;