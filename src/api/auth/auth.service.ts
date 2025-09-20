// src/api/auth/auth.service.ts
import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto"; // Import the built-in crypto module
import jwt from "jsonwebtoken";
import config from "../../config";
import { sendVerificationEmail } from "../../services/email.service";
import AppError from "../../utils/AppError";
import logger from "../../utils/logger";
import { LoginDto, RegisterDto, TokenData } from "./auth.types";

const prisma = new PrismaClient();

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

const updateUserRefreshToken = async (
  userId: string,
  refreshToken: string | null
) => {
  // Allow null to clear the token on logout
  const hashedRefreshToken = refreshToken
    ? await bcrypt.hash(refreshToken, 10)
    : null;
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashedRefreshToken },
  });
};

// --- EMAIL VERIFICATION HELPERS ---
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit code
};

export const requestVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("User with this email not found.", 404);
  }
  if (user.isEmailVerified) {
    throw new AppError("Email is already verified.", 400);
  }

  const verificationCode = generateVerificationCode();
  const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await prisma.user.update({
    where: { email },
    data: { verificationCode, verificationExpiry },
  });

  await sendVerificationEmail(email, verificationCode);
};

export const verifyUserEmail = async (email: string, code: string) => {
  const user = await prisma.user.findFirst({
    where: { email, verificationCode: code },
  });

  if (!user) throw new AppError("Invalid verification code.", 400);
  if (user.verificationExpiry && user.verificationExpiry < new Date()) {
    throw new AppError("Verification code has expired.", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationCode: null, // Clear the code after use
      verificationExpiry: null,
    },
  });
};

// --- CORE AUTH SERVICES ---
export const registerUser = async (
  userData: RegisterDto
): Promise<{ user: User }> => {
  try {
    const { username, email, password } = userData;
    logger.info(`Attempting to register new user with email: ${email}`);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      throw new AppError(
        "An account with this email or username already exists.",
        409
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // @ts-ignore
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    logger.info(`User ${user.id} registered successfully.`);

    // After creating the user, immediately request verification
    await requestVerification(user.email);

    // Return only the user object. No tokens are issued until verification.
    return { user };
  } catch (error: any) {
    logger.error("Error during user registration", {
      error: error.message,
      stack: error.stack,
      userData,
    });
    throw error;
  }
};

export const loginUser = async (
  credentials: LoginDto
): Promise<{ user: User; tokens: TokenData }> => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid email or password.", 401);

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError("Invalid email or password.", 401);

  const tokens = generateTokens(user.id);
  await updateUserRefreshToken(user.id, tokens.refreshToken);

  return { user, tokens };
};

export const refreshAccessToken = async (token: string): Promise<TokenData> => {
  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new AppError("Invalid refresh token.", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.refreshToken) {
    throw new AppError("Invalid refresh token.", 401);
  }

  const isTokenMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isTokenMatch) {
    throw new AppError("Invalid refresh token.", 401);
  }

  const newTokens = generateTokens(user.id);
  await updateUserRefreshToken(user.id, newTokens.refreshToken);

  return newTokens;
};

export const logoutUser = async (userId: string): Promise<void> => {
  logger.info(`User ${userId} tried to logout.`);
  await updateUserRefreshToken(userId, null);
};
