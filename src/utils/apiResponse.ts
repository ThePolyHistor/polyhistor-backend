/**
 * Wraps successful data in a standardized API response format.
 * @param data The payload to be sent in the response.
 * @returns A standardized success object.
 */
export const successResponse = <T>(data: T) => {
    return {
        status: 'success',
        data,
    };
};