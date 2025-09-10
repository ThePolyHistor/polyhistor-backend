import dotenv from 'dotenv';

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

// The '!' non-null assertion operator tells TypeScript that these
// environment variables will definitely be loaded, preventing compilation
// errors. The app will throw a runtime error if they are missing.

export default config;