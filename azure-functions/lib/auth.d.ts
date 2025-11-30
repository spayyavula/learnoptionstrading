import { HttpRequest } from '@azure/functions';
export interface AuthenticatedUser {
    userId: string;
    email: string;
    displayName?: string;
    roles?: string[];
}
export interface JWTPayload {
    sub: string;
    email?: string;
    emails?: string[];
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
export declare function extractToken(request: HttpRequest): string | null;
/**
 * Validate Azure AD B2C JWT token
 * In production, you should use JWKS for key validation
 */
export declare function validateToken(token: string): AuthenticatedUser | null;
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
//# sourceMappingURL=auth.d.ts.map