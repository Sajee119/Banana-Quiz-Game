const Joi = require('joi');
require('dotenv').config();

const schema = Joi.object({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(3000),
    CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
}).unknown();

const { error, value: envVars } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;