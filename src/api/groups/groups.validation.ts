import {body, param, query} from 'express-validator';

export const groupIdParam = [
    param('groupId').isUUID().withMessage('A valid group ID is required.'),
];

export const createGroup = [
    body('name').trim().notEmpty().withMessage('Group name is required.'),
    body('description').optional().trim(),
    body('memberIds').isArray().withMessage('memberIds must be an array.')
        .custom((ids) => ids.every((id: any) => typeof id === 'string' && id.match(/^[0-9a-fA-F-]{36}$/)))
        .withMessage('Each member ID must be a valid UUID.'),
];

export const updateGroup = [
    ...groupIdParam,
    body('name').optional().trim().notEmpty().withMessage('Group name cannot be empty.'),
    body('description').optional().trim(),
];

export const manageMemberBody = [
    ...groupIdParam,
    body('userId').isUUID().withMessage('A valid user ID is required.'),
];

export const manageMemberParams = [
    ...groupIdParam,
    param('userId').isUUID().withMessage('A valid user ID is required.'),
];

export const createTrip = [
    ...groupIdParam,
    body('name').trim().notEmpty().withMessage('Trip name is required.'),
    body('startTime').optional().isISO8601().toDate().withMessage('Start time must be a valid date.'),
];

export const updateTrip = [
    ...groupIdParam,
    param('tripId').isUUID().withMessage('A valid trip ID is required.'),
    body('status').isIn(['active', 'ended', 'planned']).withMessage('Invalid trip status.'),
];

export const getMessages = [
    ...groupIdParam,
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.'),
];