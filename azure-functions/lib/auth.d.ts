import { HttpRequest } from '@azure/functions';
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
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against a hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate an access token
 */
export declare function generateAccessToken(user: AuthenticatedUser): string;
/**
 * Generate a refresh token
 */
export declare function generateRefreshToken(userId: string): string;
/**
 * Generate both access and refresh tokens
 */
export declare function generateTokens(user: AuthenticatedUser): {
    accessToken: string;
    refreshToken: string;
};
/**
 * Extract and validate the Bearer token from the request
 */
export declare function extractToken(request: HttpRequest): string | null;
/**
 * Validate and decode a JWT token
 */
export declare function validateToken(token: string): AuthenticatedUser | null;
/**
 * Validate a refresh token and return the user ID
 */
export declare function validateRefreshToken(token: string): string | null;
/**
 * Authenticate the request and return user info
 * Returns null if not authenticated
 */
export declare function authenticateRequest(request: HttpRequest): AuthenticatedUser | null;
/**
 * Authenticate and throw if not authenticated
 */
export declare function requireAuth(request: HttpRequest): AuthenticatedUser;
/**
 * Check if user has specific role
 */
export declare function hasRole(user: AuthenticatedUser, role: string): boolean;
/**
 * Require specific role
 */
export declare function requireRole(request: HttpRequest, role: string): AuthenticatedUser;
/**
 * Require admin role
 */
export declare function requireAdmin(request: HttpRequest): AuthenticatedUser;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 * At least 8 characters, one uppercase, one lowercase, one number
 */
export declare function isValidPassword(password: string): {
    valid: boolean;
    message?: string;
};
//# sourceMappingURL=auth.d.ts.map