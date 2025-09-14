import dotenv from 'dotenv';
import logger from "../utils/logger";


dotenv.config();

const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL!,
    jwt: {
        secret: process.env.JWT_SECRET!,
        accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
        refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '30d',
    },
    redis: {
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT)!,
    },
    corsOrigin: process.env.CORS_ORIGIN!,
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});


// The '!' non-null assertion operator tells TypeScript that these
// environment variables will definitely be loaded, preventing compilation
// errors. The app will throw a runtime error if they are missing.

export default config;