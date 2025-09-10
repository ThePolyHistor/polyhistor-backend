// src/api/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {PrismaClient, User} from '@prisma/client';
import AppError from '../../utils/AppError';
import config from '../../config';
import {LoginDto, RegisterDto, TokenData} from './auth.types';

const prisma = new PrismaClient();

// Helper to generate both tokens
const generateTokens = (userId: string): TokenData => {
    // @ts-ignore
    const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.accessTokenExpiresIn,
    });
    // @ts-ignore
    const refreshToken = jwt.sign({ id: userId }, config.jwt.secret, {
        expiresIn: config.jwt.refreshTokenExpiresIn,
    });
    return { accessToken, refreshToken };
};

const updateUserRefreshToken = async (userId: string, refreshToken: string) => {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: hashedRefreshToken },
    });
};

export const loginUser = async (credentials: LoginDto): Promise<{ user: User; tokens: TokenData }> => {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or password.', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid email or password.', 401);

    // 1. Generate both tokens
    const tokens = generateTokens(user.id);
    // 2. Hash and save the refresh token to the DB
    await updateUserRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
};

export const refreshAccessToken = async (token: string): Promise<TokenData> => {
    // 1. Verify the incoming refresh token
    let decoded: any;
    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new AppError('Invalid refresh token.', 401);
    }

    // 2. Find the user and check if the token is valid
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.refreshToken) {
        throw new AppError('Invalid refresh token.', 401);
    }

    // 3. Compare the incoming token with the hashed token in the DB
    const isTokenMatch = await bcrypt.compare(token, user.refreshToken);
    if (!isTokenMatch) {
        throw new AppError('Invalid refresh token.', 401);
    }

    // 4. Issue a new pair of tokens (Token Rotation)
    const newTokens = generateTokens(user.id);
    await updateUserRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
};

export const logoutUser = async (userId: string): Promise<void> => {
    // To log out, we simply nullify the refresh token in the database
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
};

// Register function remains the same, but we will log the user in right after
export const registerUser = async (userData: RegisterDto): Promise<{ user: User; tokens: TokenData }> => {
    const { username, email, password } = userData;

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });
    if (existingUser) throw new AppError('An account with this email or username already exists.', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { username, email, passwordHash } });

    // After registering, immediately log them in to get tokens
    return loginUser({ email, password });
};