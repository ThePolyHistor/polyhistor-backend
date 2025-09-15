import {body} from 'express-validator';

export const register = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long.'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.'),
];

export const login = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
];

export const verifyEmail = [
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('code').isString().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits.'),
];

export const resendVerification = [
    body('email').isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
];
