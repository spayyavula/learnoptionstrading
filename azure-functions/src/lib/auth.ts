import { HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName?: string;
  roles?: string[];
}

export interface JWTPayload {
  sub: string;           // User ID from Azure AD B2C
  email?: string;
  emails?: string[];     // Azure AD B2C uses emails array
  name?: string;
  given_name?: string;
  family_name?: string;
  extension_roles?: string[];
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

/**
 * Extract and validate the Bearer token from the request
 */
export function extractToken(request: HttpRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Validate Azure AD B2C JWT token
 * In production, you should use JWKS for key validation
 */
export function validateToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;

    if (!decoded) {
      console.warn('Failed to decode JWT token');
      return null;
    }

    // Verify token hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.warn('JWT token has expired');
      return null;
    }

    // Verify audience if configured
    const expectedAudience = process.env.JWT_AUDIENCE;
    if (expectedAudience && decoded.aud !== expectedAudience) {
      console.warn('JWT audience mismatch', { expected: expectedAudience, actual: decoded.aud });
      return null;
    }

    // Verify issuer if configured
    const expectedIssuer = process.env.JWT_ISSUER;
    if (expectedIssuer && !decoded.iss.startsWith(expectedIssuer.replace('/v2.0/', ''))) {
      console.warn('JWT issuer mismatch', { expected: expectedIssuer, actual: decoded.iss });
      return null;
    }

    // Extract email (Azure AD B2C uses emails array)
    const email = decoded.email || (decoded.emails && decoded.emails[0]) || '';

    return {
      userId: decoded.sub,
      email,
      displayName: decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
      roles: decoded.extension_roles || [],
    };
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return null;
  }
}

/**
 * Authenticate the request and return user info
 * Returns null if not authenticated
 */
export function authenticateRequest(request: HttpRequest): AuthenticatedUser | null {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  return validateToken(token);
}

/**
 * Authenticate and throw if not authenticated
 */
export function requireAuth(request: HttpRequest): AuthenticatedUser {
  const user = authenticateRequest(request);

  if (!user) {
    const error = new Error('Unauthorized');
    (error as any).statusCode = 401;
    throw error;
  }

  return user;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.roles?.includes(role) ?? false;
}

/**
 * Require specific role
 */
export function requireRole(request: HttpRequest, role: string): AuthenticatedUser {
  const user = requireAuth(request);

  if (!hasRole(user, role)) {
    const error = new Error('Forbidden');
    (error as any).statusCode = 403;
    throw error;
  }

  return user;
}

/**
 * Require admin role
 */
export function requireAdmin(request: HttpRequest): AuthenticatedUser {
  return requireRole(request, 'admin');
}
