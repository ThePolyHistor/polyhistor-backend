// Define the structure of our JWT payload
export interface UserPayload {
    id: string;
}

declare global {
    namespace Express {
        // Extend the default Request interface
        export interface Request {
            // Add the optional 'user' property
            user?: UserPayload;
        }
    }
}