import {NextFunction, Request, Response} from 'express';
import {validationResult} from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    // Format errors for a clean response
    const extractedErrors = errors.array().map(err => ({
        field: (err as any).path,
        message: err.msg
    }));

    return res.status(400).json({
        status: 'error',
        message: 'Invalid input provided.',
        errors: extractedErrors,
    });
};