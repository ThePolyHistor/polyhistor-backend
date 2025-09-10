import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import AppError from '../utils/AppError';
import {UserPayload} from '../@types/express';

export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;

    // 1. Check for token in the 'Authorization' header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify the token
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
        // 3. Attach the user payload to the request object for later use
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};