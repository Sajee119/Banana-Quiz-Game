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
}).unknown();

const { error, value: envVars } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;