const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectWithRetry(attempts = 1) {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            autoIndex: env.NODE_ENV !== 'production',
        });
        logger.info('MongoDB connection established successfully.');

        mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
        mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
        mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
        return;
    } catch (err) {
        const detail = err.message.includes('whitelist')
            || err.message.includes('Could not connect to any servers')
            ? ' Check that this machine IP is allowed in MongoDB Atlas Network Access.'
            : '';
        logger.error(`MongoDB connection attempt ${attempts} failed: ${err.message}.${detail}`);
        if (attempts >= MAX_RETRIES) {
            throw new Error(`MongoDB connection failed after ${MAX_RETRIES} attempts.${detail}`, {
                cause: err,
            });
        }

        logger.info(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return connectWithRetry(attempts + 1);
    }
}

async function disconnect() {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
}

module.exports = {
    connect: connectWithRetry,
    disconnect,
};