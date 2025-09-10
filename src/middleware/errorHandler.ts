import {ErrorRequestHandler, Response} from 'express';
import AppError from '../utils/AppError';
import config from '../config';

const sendErrorDev = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err: AppError, res: Response) => {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // B) Programming or other unknown error: don't leak error details
    else {
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.nodeEnv === 'development') {
        sendErrorDev(err, res);
    } else if (config.nodeEnv === 'production') {
        let error = { ...err, message: err.message };
        // You can add handlers for specific Prisma errors or JWT errors here

        sendErrorProd(error, res);
    }
};