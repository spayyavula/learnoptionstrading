import { HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName?: string;
  roles?: string[];
}

export interface JWTPayload {
  sub: string;
  email: string;
  displayName?: string;
  roles?: string[];
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate an access token
 */
export function generateAccessToken(user: AuthenticatedUser): string {
  const payload: Partial<JWTPayload> = {
    sub: user.userId,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(userId: string): string {
  const payload = {
    sub: userId,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(user: AuthenticatedUser): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.userId),
  };
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
 * Validate and decode a JWT token
 */
export function validateToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded || decoded.type !== 'access') {
      return null;
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      displayName: decoded.displayName,
      roles: decoded.roles || [],
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Invalid JWT token');
    } else {
      console.error('Error validating JWT token:', error);
    }
    return null;
  }
}

/**
 * Validate a refresh token and return the user ID
 */
export function validateRefreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }

    return decoded.sub;
  } catch (error) {
    console.warn('Invalid refresh token:', error);
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

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, one uppercase, one lowercase, one number
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}
