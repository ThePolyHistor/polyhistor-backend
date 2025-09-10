import {body, param, query} from 'express-validator';

export const search = [
    query('query').notEmpty().withMessage('Search query cannot be empty.').trim().escape(),
];

export const friendRequest = [
    body('userId').isUUID().withMessage('A valid user ID is required.'),
];

export const respondToRequest = [
    param('userId').isUUID().withMessage('A valid user ID is required in the URL.'),
    body('status').isIn(['accepted', 'blocked']).withMessage('Status must be either "accepted" or "blocked".'),
];

export const removeFriend = [
    param('userId').isUUID().withMessage('A valid user ID is required in the URL.'),
];