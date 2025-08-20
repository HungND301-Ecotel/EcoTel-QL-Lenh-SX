const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'production-order-system' },
    transports: [
        // Write error logs to file
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs to file
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // ✅ Always log to stdout (console)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
                    return `${timestamp} [${level}] ${message} ${stack ? `\n${stack}` : ''} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            ),
        }),
    ],
});

// Create a stream object for Morgan
const stream = {
    write: function (message) {
        logger.info(message.trim());
    }
};

// Log unhandled rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection', err);
    process.exit(1);
});

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
});

// Add error method to logger
logger.error = function (message, error) {
    if (error instanceof Error) {
        this.log('error', message, { error: error.message, stack: error.stack });
    } else {
        this.log('error', message, error);
    }
};

module.exports = {
    logger,
    stream
};
