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
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateTokens = generateTokens;
exports.extractToken = extractToken;
exports.validateToken = validateToken;
exports.validateRefreshToken = validateRefreshToken;
exports.authenticateRequest = authenticateRequest;
exports.requireAuth = requireAuth;
exports.hasRole = hasRole;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcryptjs"));
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
/**
 * Generate an access token
 */
function generateAccessToken(user) {
    const payload = {
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
function generateRefreshToken(userId) {
    const payload = {
        sub: userId,
        type: 'refresh',
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}
/**
 * Generate both access and refresh tokens
 */
function generateTokens(user) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user.userId),
    };
}
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
 * Validate and decode a JWT token
 */
function validateToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.type !== 'access') {
            return null;
        }
        return {
            userId: decoded.sub,
            email: decoded.email,
            displayName: decoded.displayName,
            roles: decoded.roles || [],
        };
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.warn('JWT token has expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            console.warn('Invalid JWT token');
        }
        else {
            console.error('Error validating JWT token:', error);
        }
        return null;
    }
}
/**
 * Validate a refresh token and return the user ID
 */
function validateRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.type !== 'refresh') {
            return null;
        }
        return decoded.sub;
    }
    catch (error) {
        console.warn('Invalid refresh token:', error);
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
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate password strength
 * At least 8 characters, one uppercase, one lowercase, one number
 */
function isValidPassword(password) {
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
//# sourceMappingURL=auth.js.map