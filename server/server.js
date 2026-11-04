const env = require('./src/config/env');
const { connect: connectWithRetry, disconnect } = require('./src/config/db');
const app = require('./src/app');
const logger = require('./src/utils/logger');

(async () => {
    let server;
    try {
        await connectWithRetry();
        server = app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV})`);
        });
    } catch (err) {
        logger.error(`Server startup failed: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    // Graceful shutdown
    const shutdown = async (signal) => {
        logger.info(`${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await disconnect();
            process.exit(0);
        });
        // Force exit after 10s
        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Rejection:', reason);
        shutdown('unhandledRejection');
    });
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        shutdown('uncaughtException');
    });
})();