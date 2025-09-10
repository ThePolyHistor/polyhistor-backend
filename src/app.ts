import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import {errorHandler} from './middleware/errorHandler';
import AppError from './utils/AppError';

// Import routes
import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/users/users.routes';
import groupRoutes from './api/groups/groups.routes';

const app = express();

// --- Global Middleware ---
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// --- Not Found Handler ---
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- Global Error Handler ---
app.use(errorHandler);

export default app;