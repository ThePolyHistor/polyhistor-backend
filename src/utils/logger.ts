import winston from 'winston';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Determine the log level based on the environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

// Define different formats for development and production
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // In development, use a simple, colorful format
    process.env.NODE_ENV === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        // In production, use structured JSON format
        : winston.format.json()
);

// Define transports (where logs will be sent)
const transports = [
    // Always log to the console
    new winston.transports.Console(),

    // In production, also log to files
    ...(process.env.NODE_ENV === 'production'
        ? [
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error', // Only log errors to this file
            }),
            new winston.transports.File({ filename: 'logs/all.log' }), // Log everything to this file
        ]
        : []),
];

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export default logger;