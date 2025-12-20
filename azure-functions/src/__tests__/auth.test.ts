import * as jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  extractToken,
  validateToken,
  validateRefreshToken,
  authenticateRequest,
  requireAuth,
  hasRole,
  requireRole,
  requireAdmin,
  isValidEmail,
  isValidPassword,
  AuthenticatedUser,
} from '../lib/auth';
import { HttpRequest } from '../__mocks__/azure-functions';

// Test JWT secret must match what's set in setup.ts
const TEST_JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

describe('Auth Library', () => {
  describe('Password Hashing', () => {
    const testPassword = 'TestPassword123!';

    it('should hash a password', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
    });

    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'P@$$w0rd!#$%^&*()';
      const hash = await hashPassword(specialPassword);
      const isValid = await verifyPassword(specialPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'Пароль123!日本語';
      const hash = await hashPassword(unicodePassword);
      const isValid = await verifyPassword(unicodePassword, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    const testUser: AuthenticatedUser = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['free', 'trial'],
    };

    describe('generateAccessToken', () => {
      it('should generate a valid JWT access token', () => {
        const token = generateAccessToken(testUser);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3); // JWT has 3 parts
      });

      it('should include user data in token payload', () => {
        const token = generateAccessToken(testUser);
        const decoded = jwt.decode(token) as any;

        expect(decoded.sub).toBe(testUser.userId);
        expect(decoded.email).toBe(testUser.email);
        expect(decoded.displayName).toBe(testUser.displayName);
        expect(decoded.roles).toEqual(testUser.roles);
        expect(decoded.type).toBe('access');
      });

      it('should set expiration time', () => {
        const token = generateAccessToken(testUser);
        const decoded = jwt.decode(token) as any;

        expect(decoded.exp).toBeDefined();
        expect(decoded.iat).toBeDefined();
        expect(decoded.exp).toBeGreaterThan(decoded.iat);
      });

      it('should be verifiable with the correct secret', () => {
        const token = generateAccessToken(testUser);

        expect(() => {
          jwt.verify(token, TEST_JWT_SECRET);
        }).not.toThrow();
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate a valid JWT refresh token', () => {
        const token = generateRefreshToken(testUser.userId);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3);
      });

      it('should include user ID in token payload', () => {
        const token = generateRefreshToken(testUser.userId);
        const decoded = jwt.decode(token) as any;

        expect(decoded.sub).toBe(testUser.userId);
        expect(decoded.type).toBe('refresh');
      });

      it('should have longer expiration than access token', () => {
        const accessToken = generateAccessToken(testUser);
        const refreshToken = generateRefreshToken(testUser.userId);

        const accessDecoded = jwt.decode(accessToken) as any;
        const refreshDecoded = jwt.decode(refreshToken) as any;

        expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
      });
    });

    describe('generateTokens', () => {
      it('should return both access and refresh tokens', () => {
        const tokens = generateTokens(testUser);

        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        expect(typeof tokens.accessToken).toBe('string');
        expect(typeof tokens.refreshToken).toBe('string');
      });

      it('should generate different token types', () => {
        const tokens = generateTokens(testUser);

        const accessDecoded = jwt.decode(tokens.accessToken) as any;
        const refreshDecoded = jwt.decode(tokens.refreshToken) as any;

        expect(accessDecoded.type).toBe('access');
        expect(refreshDecoded.type).toBe('refresh');
      });
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from valid Bearer header', () => {
      const request = new HttpRequest({
        headers: { authorization: 'Bearer test-token-123' },
      });

      const token = extractToken(request as any);
      expect(token).toBe('test-token-123');
    });

    it('should return null for missing authorization header', () => {
      const request = new HttpRequest({
        headers: {},
      });

      const token = extractToken(request as any);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer authorization', () => {
      const request = new HttpRequest({
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      });

      const token = extractToken(request as any);
      expect(token).toBeNull();
    });

    it('should handle Bearer with no token', () => {
      const request = new HttpRequest({
        headers: { authorization: 'Bearer ' },
      });

      const token = extractToken(request as any);
      expect(token).toBe('');
    });

    it('should handle token with spaces', () => {
      const request = new HttpRequest({
        headers: { authorization: 'Bearer token-with-no-spaces' },
      });

      const token = extractToken(request as any);
      expect(token).toBe('token-with-no-spaces');
    });
  });

  describe('Token Validation', () => {
    const testUser: AuthenticatedUser = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['free'],
    };

    describe('validateToken', () => {
      it('should validate a valid access token', () => {
        const token = generateAccessToken(testUser);
        const user = validateToken(token);

        expect(user).not.toBeNull();
        expect(user?.userId).toBe(testUser.userId);
        expect(user?.email).toBe(testUser.email);
        expect(user?.displayName).toBe(testUser.displayName);
        expect(user?.roles).toEqual(testUser.roles);
      });

      it('should return null for invalid token', () => {
        const user = validateToken('invalid-token');
        expect(user).toBeNull();
      });

      it('should return null for expired token', () => {
        // Create an expired token manually
        const expiredPayload = {
          sub: testUser.userId,
          email: testUser.email,
          type: 'access',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800, // Expired 30 min ago
        };
        const expiredToken = jwt.sign(expiredPayload, TEST_JWT_SECRET);

        const user = validateToken(expiredToken);
        expect(user).toBeNull();
      });

      it('should return null for refresh token (wrong type)', () => {
        const refreshToken = generateRefreshToken(testUser.userId);
        const user = validateToken(refreshToken);

        expect(user).toBeNull();
      });

      it('should return null for token with wrong signature', () => {
        const wrongToken = jwt.sign(
          { sub: testUser.userId, email: testUser.email, type: 'access' },
          'wrong-secret'
        );

        const user = validateToken(wrongToken);
        expect(user).toBeNull();
      });

      it('should handle missing roles in token', () => {
        const tokenWithoutRoles = jwt.sign(
          {
            sub: testUser.userId,
            email: testUser.email,
            type: 'access',
          },
          TEST_JWT_SECRET,
          { expiresIn: '7d' }
        );

        const user = validateToken(tokenWithoutRoles);
        expect(user).not.toBeNull();
        expect(user?.roles).toEqual([]);
      });
    });

    describe('validateRefreshToken', () => {
      it('should validate a valid refresh token', () => {
        const token = generateRefreshToken(testUser.userId);
        const userId = validateRefreshToken(token);

        expect(userId).toBe(testUser.userId);
      });

      it('should return null for access token (wrong type)', () => {
        const accessToken = generateAccessToken(testUser);
        const userId = validateRefreshToken(accessToken);

        expect(userId).toBeNull();
      });

      it('should return null for invalid token', () => {
        const userId = validateRefreshToken('invalid-token');
        expect(userId).toBeNull();
      });

      it('should return null for expired refresh token', () => {
        const expiredPayload = {
          sub: testUser.userId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800,
        };
        const expiredToken = jwt.sign(expiredPayload, TEST_JWT_SECRET);

        const userId = validateRefreshToken(expiredToken);
        expect(userId).toBeNull();
      });
    });
  });

  describe('Request Authentication', () => {
    const testUser: AuthenticatedUser = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['free'],
    };

    describe('authenticateRequest', () => {
      it('should authenticate valid request', () => {
        const token = generateAccessToken(testUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        const user = authenticateRequest(request as any);

        expect(user).not.toBeNull();
        expect(user?.userId).toBe(testUser.userId);
      });

      it('should return null for request without token', () => {
        const request = new HttpRequest({ headers: {} });
        const user = authenticateRequest(request as any);

        expect(user).toBeNull();
      });

      it('should return null for request with invalid token', () => {
        const request = new HttpRequest({
          headers: { authorization: 'Bearer invalid-token' },
        });

        const user = authenticateRequest(request as any);
        expect(user).toBeNull();
      });
    });

    describe('requireAuth', () => {
      it('should return user for authenticated request', () => {
        const token = generateAccessToken(testUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        const user = requireAuth(request as any);

        expect(user.userId).toBe(testUser.userId);
        expect(user.email).toBe(testUser.email);
      });

      it('should throw 401 for unauthenticated request', () => {
        const request = new HttpRequest({ headers: {} });

        expect(() => requireAuth(request as any)).toThrow('Unauthorized');

        try {
          requireAuth(request as any);
        } catch (error: any) {
          expect(error.statusCode).toBe(401);
        }
      });

      it('should throw 401 for invalid token', () => {
        const request = new HttpRequest({
          headers: { authorization: 'Bearer invalid-token' },
        });

        expect(() => requireAuth(request as any)).toThrow('Unauthorized');
      });
    });
  });

  describe('Role-Based Access Control', () => {
    describe('hasRole', () => {
      it('should return true when user has the role', () => {
        const user: AuthenticatedUser = {
          userId: '123',
          email: 'test@example.com',
          roles: ['admin', 'premium'],
        };

        expect(hasRole(user, 'admin')).toBe(true);
        expect(hasRole(user, 'premium')).toBe(true);
      });

      it('should return false when user does not have the role', () => {
        const user: AuthenticatedUser = {
          userId: '123',
          email: 'test@example.com',
          roles: ['free'],
        };

        expect(hasRole(user, 'admin')).toBe(false);
        expect(hasRole(user, 'premium')).toBe(false);
      });

      it('should handle user with no roles', () => {
        const user: AuthenticatedUser = {
          userId: '123',
          email: 'test@example.com',
        };

        expect(hasRole(user, 'admin')).toBe(false);
      });

      it('should handle user with empty roles array', () => {
        const user: AuthenticatedUser = {
          userId: '123',
          email: 'test@example.com',
          roles: [],
        };

        expect(hasRole(user, 'admin')).toBe(false);
      });
    });

    describe('requireRole', () => {
      const adminUser: AuthenticatedUser = {
        userId: '123',
        email: 'admin@example.com',
        roles: ['admin', 'premium'],
      };

      const regularUser: AuthenticatedUser = {
        userId: '456',
        email: 'user@example.com',
        roles: ['free'],
      };

      it('should allow user with required role', () => {
        const token = generateAccessToken(adminUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        const user = requireRole(request as any, 'admin');
        expect(user.userId).toBe(adminUser.userId);
      });

      it('should throw 403 when user lacks required role', () => {
        const token = generateAccessToken(regularUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        expect(() => requireRole(request as any, 'admin')).toThrow('Forbidden');

        try {
          requireRole(request as any, 'admin');
        } catch (error: any) {
          expect(error.statusCode).toBe(403);
        }
      });

      it('should throw 401 for unauthenticated request', () => {
        const request = new HttpRequest({ headers: {} });

        expect(() => requireRole(request as any, 'admin')).toThrow('Unauthorized');
      });
    });

    describe('requireAdmin', () => {
      it('should allow admin users', () => {
        const adminUser: AuthenticatedUser = {
          userId: '123',
          email: 'admin@example.com',
          roles: ['admin'],
        };
        const token = generateAccessToken(adminUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        const user = requireAdmin(request as any);
        expect(user.userId).toBe(adminUser.userId);
      });

      it('should reject non-admin users', () => {
        const regularUser: AuthenticatedUser = {
          userId: '456',
          email: 'user@example.com',
          roles: ['premium'],
        };
        const token = generateAccessToken(regularUser);
        const request = new HttpRequest({
          headers: { authorization: `Bearer ${token}` },
        });

        expect(() => requireAdmin(request as any)).toThrow('Forbidden');
      });
    });
  });

  describe('Email Validation', () => {
    describe('isValidEmail', () => {
      it('should accept valid email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.org')).toBe(true);
        expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
        expect(isValidEmail('user123@sub.domain.com')).toBe(true);
        expect(isValidEmail('a@b.co')).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('user@.com')).toBe(false);
        expect(isValidEmail('user name@example.com')).toBe(false);
        expect(isValidEmail('user@example')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isValidEmail('user@localhost')).toBe(false); // No TLD
        expect(isValidEmail('User@Example.COM')).toBe(true); // Case insensitive domains
      });
    });
  });

  describe('Password Validation', () => {
    describe('isValidPassword', () => {
      it('should accept valid passwords', () => {
        expect(isValidPassword('Password123').valid).toBe(true);
        expect(isValidPassword('MyP@ssw0rd').valid).toBe(true);
        expect(isValidPassword('Abcdefg1').valid).toBe(true);
        expect(isValidPassword('VeryLongPassword123').valid).toBe(true);
      });

      it('should reject passwords shorter than 8 characters', () => {
        const result = isValidPassword('Pass1');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('8 characters');
      });

      it('should reject passwords without uppercase letters', () => {
        const result = isValidPassword('password123');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('uppercase');
      });

      it('should reject passwords without lowercase letters', () => {
        const result = isValidPassword('PASSWORD123');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('lowercase');
      });

      it('should reject passwords without numbers', () => {
        const result = isValidPassword('PasswordABC');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('number');
      });

      it('should handle edge cases', () => {
        expect(isValidPassword('12345678').valid).toBe(false); // No letters
        expect(isValidPassword('abcdefgh').valid).toBe(false); // No uppercase, no numbers
        expect(isValidPassword('ABCDEFGH').valid).toBe(false); // No lowercase, no numbers
        expect(isValidPassword('').valid).toBe(false); // Empty
      });

      it('should accept passwords with special characters', () => {
        expect(isValidPassword('P@ssw0rd!#$%').valid).toBe(true);
        expect(isValidPassword('Test123!@#').valid).toBe(true);
      });

      it('should accept passwords with unicode', () => {
        expect(isValidPassword('Password123中文').valid).toBe(true);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full authentication flow', () => {
      // Create user
      const user: AuthenticatedUser = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        displayName: 'Test User',
        roles: ['free'],
      };

      // Generate tokens
      const tokens = generateTokens(user);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // Create authenticated request
      const request = new HttpRequest({
        headers: { authorization: `Bearer ${tokens.accessToken}` },
      });

      // Authenticate request
      const authenticatedUser = authenticateRequest(request as any);
      expect(authenticatedUser).not.toBeNull();
      expect(authenticatedUser?.email).toBe(user.email);

      // Validate refresh token
      const userId = validateRefreshToken(tokens.refreshToken);
      expect(userId).toBe(user.userId);
    });

    it('should handle role-based access flow', () => {
      // Admin user
      const adminUser: AuthenticatedUser = {
        userId: 'admin-123',
        email: 'admin@example.com',
        displayName: 'Admin User',
        roles: ['admin', 'premium'],
      };

      // Regular user
      const regularUser: AuthenticatedUser = {
        userId: 'user-456',
        email: 'user@example.com',
        displayName: 'Regular User',
        roles: ['free'],
      };

      const adminToken = generateAccessToken(adminUser);
      const userToken = generateAccessToken(regularUser);

      // Admin request
      const adminRequest = new HttpRequest({
        headers: { authorization: `Bearer ${adminToken}` },
      });

      // User request
      const userRequest = new HttpRequest({
        headers: { authorization: `Bearer ${userToken}` },
      });

      // Admin can access admin-only endpoints
      expect(() => requireAdmin(adminRequest as any)).not.toThrow();

      // Regular user cannot access admin-only endpoints
      expect(() => requireAdmin(userRequest as any)).toThrow('Forbidden');

      // Both can access premium endpoints (admin has premium role)
      expect(() => requireRole(adminRequest as any, 'premium')).not.toThrow();
      expect(() => requireRole(userRequest as any, 'premium')).toThrow('Forbidden');
    });
  });
});
