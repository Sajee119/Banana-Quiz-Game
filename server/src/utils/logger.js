const winston = require('winston');
const env = require('../config/env');
const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (env.NODE_ENV === 'production' && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const transports = [new winston.transports.Console()];
if (env.NODE_ENV === 'production') {
    transports.push(
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
    );
}

const logger = winston.createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) =>
            stack
            ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
            : `[${timestamp}] ${level.toUpperCase()}: ${message}`
        )
    ),
    transports,
});

module.exports = logger;