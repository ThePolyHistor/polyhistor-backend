// src/api/auth/auth.controller.ts
import {NextFunction, Request, Response} from 'express';
import * as authService from './auth.service';
import {successResponse} from '../../utils/apiResponse';
import {LoginDto, RefreshTokenDto, RegisterDto} from './auth.types';

export const register = async (req: Request<{}, {}, RegisterDto>, res: Response, next: NextFunction) => {
    try {
        const { user, tokens } = await authService.registerUser(req.body);
        const userResponse = { id: user.id, username: user.username, email: user.email };
        res.status(201).json(successResponse({ user: userResponse, ...tokens }));
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request<{}, {}, LoginDto>, res: Response, next: NextFunction) => {
    try {
        const { user, tokens } = await authService.loginUser(req.body);
        const userResponse = { id: user.id, username: user.username, email: user.email };
        res.status(200).json(successResponse({ user: userResponse, ...tokens }));
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request<{}, {}, RefreshTokenDto>, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ status: 'error', message: 'Refresh token is required.' });

        const tokens = await authService.refreshAccessToken(refreshToken);
        res.status(200).json(successResponse(tokens));
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.logoutUser(req.user!.id);
        res.status(200).json(successResponse({ message: 'Logged out successfully.' }));
    } catch (error) {
        next(error);
    }
};