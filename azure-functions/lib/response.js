"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonResponse = jsonResponse;
exports.errorResponse = errorResponse;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.conflict = conflict;
exports.serverError = serverError;
exports.handleError = handleError;
/**
 * Create a successful JSON response
 */
function jsonResponse(data, status = 200) {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
        jsonBody: data,
    };
}
/**
 * Create an error response
 */
function errorResponse(message, status = 500, details) {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
        jsonBody: {
            error: message,
            ...(details && process.env.NODE_ENV !== 'production' ? { details } : {}),
        },
    };
}
/**
 * Create a 400 Bad Request response
 */
function badRequest(message = 'Bad Request') {
    return errorResponse(message, 400);
}
/**
 * Create a 401 Unauthorized response
 */
function unauthorized(message = 'Unauthorized') {
    return errorResponse(message, 401);
}
/**
 * Create a 403 Forbidden response
 */
function forbidden(message = 'Forbidden') {
    return errorResponse(message, 403);
}
/**
 * Create a 404 Not Found response
 */
function notFound(message = 'Not Found') {
    return errorResponse(message, 404);
}
/**
 * Create a 409 Conflict response
 */
function conflict(message = 'Conflict') {
    return errorResponse(message, 409);
}
/**
 * Create a 500 Internal Server Error response
 */
function serverError(message = 'Internal Server Error') {
    return errorResponse(message, 500);
}
/**
 * Handle errors and return appropriate response
 */
function handleError(error) {
    console.error('API Error:', error);
    if (error.statusCode) {
        return errorResponse(error.message, error.statusCode);
    }
    if (error.code === '23505') {
        // PostgreSQL unique violation
        return conflict('Resource already exists');
    }
    if (error.code === '23503') {
        // PostgreSQL foreign key violation
        return badRequest('Referenced resource not found');
    }
    return serverError(process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message);
}
//# sourceMappingURL=response.js.map