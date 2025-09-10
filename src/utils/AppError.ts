class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;

    /**
     * Creates a custom operational error.
     * @param message The error message for the client.
     * @param statusCode The HTTP status code.
     */
    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // Capture the stack trace, excluding the constructor call from it.
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;