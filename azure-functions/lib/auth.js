"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = extractToken;
exports.validateToken = validateToken;
exports.authenticateRequest = authenticateRequest;
exports.requireAuth = requireAuth;
exports.hasRole = hasRole;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
const jwt = __importStar(require("jsonwebtoken"));
/**
 * Extract and validate the Bearer token from the request
 */
function extractToken(request) {
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
function validateToken(token) {
    try {
        const decoded = jwt.decode(token);
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
    }
    catch (error) {
        console.error('Error validating JWT token:', error);
        return null;
    }
}
/**
 * Authenticate the request and return user info
 * Returns null if not authenticated
 */
function authenticateRequest(request) {
    const token = extractToken(request);
    if (!token) {
        return null;
    }
    return validateToken(token);
}
/**
 * Authenticate and throw if not authenticated
 */
function requireAuth(request) {
    const user = authenticateRequest(request);
    if (!user) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }
    return user;
}
/**
 * Check if user has specific role
 */
function hasRole(user, role) {
    return user.roles?.includes(role) ?? false;
}
/**
 * Require specific role
 */
function requireRole(request, role) {
    const user = requireAuth(request);
    if (!hasRole(user, role)) {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        throw error;
    }
    return user;
}
/**
 * Require admin role
 */
function requireAdmin(request) {
    return requireRole(request, 'admin');
}
//# sourceMappingURL=auth.js.map