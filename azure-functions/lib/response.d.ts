import { HttpResponseInit } from '@azure/functions';
/**
 * Create a successful JSON response
 */
export declare function jsonResponse<T>(data: T, status?: number): HttpResponseInit;
/**
 * Create an error response
 */
export declare function errorResponse(message: string, status?: number, details?: any): HttpResponseInit;
/**
 * Create a 400 Bad Request response
 */
export declare function badRequest(message?: string): HttpResponseInit;
/**
 * Create a 401 Unauthorized response
 */
export declare function unauthorized(message?: string): HttpResponseInit;
/**
 * Create a 403 Forbidden response
 */
export declare function forbidden(message?: string): HttpResponseInit;
/**
 * Create a 404 Not Found response
 */
export declare function notFound(message?: string): HttpResponseInit;
/**
 * Create a 409 Conflict response
 */
export declare function conflict(message?: string): HttpResponseInit;
/**
 * Create a 500 Internal Server Error response
 */
export declare function serverError(message?: string): HttpResponseInit;
/**
 * Handle errors and return appropriate response
 */
export declare function handleError(error: any): HttpResponseInit;
//# sourceMappingURL=response.d.ts.map