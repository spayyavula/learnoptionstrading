import { HttpResponseInit } from '@azure/functions';

/**
 * Create a successful JSON response
 */
export function jsonResponse<T>(data: T, status: number = 200): HttpResponseInit {
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
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): HttpResponseInit {
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
export function badRequest(message: string = 'Bad Request'): HttpResponseInit {
  return errorResponse(message, 400);
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): HttpResponseInit {
  return errorResponse(message, 401);
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(message: string = 'Forbidden'): HttpResponseInit {
  return errorResponse(message, 403);
}

/**
 * Create a 404 Not Found response
 */
export function notFound(message: string = 'Not Found'): HttpResponseInit {
  return errorResponse(message, 404);
}

/**
 * Create a 409 Conflict response
 */
export function conflict(message: string = 'Conflict'): HttpResponseInit {
  return errorResponse(message, 409);
}

/**
 * Create a 500 Internal Server Error response
 */
export function serverError(message: string = 'Internal Server Error'): HttpResponseInit {
  return errorResponse(message, 500);
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: any): HttpResponseInit {
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

  return serverError(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message
  );
}
