"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const functions_1 = require("@azure/functions");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const auth_1 = require("../../lib/auth");
async function login(request, context) {
    try {
        const body = await request.json();
        const { email, password } = body;
        // Validate input
        if (!email || !(0, auth_1.isValidEmail)(email)) {
            return (0, response_1.jsonResponse)({ error: 'Invalid email address' }, 400);
        }
        if (!password) {
            return (0, response_1.jsonResponse)({ error: 'Password is required' }, 400);
        }
        // Find user by email
        const user = await (0, database_1.queryOne)('SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (!user) {
            return (0, response_1.jsonResponse)({ error: 'Invalid email or password' }, 401);
        }
        // Check if user has password (might be OAuth-only user)
        if (!user.password_hash) {
            return (0, response_1.jsonResponse)({ error: 'Please use social login for this account' }, 401);
        }
        // Verify password
        const isValidPassword = await (0, auth_1.verifyPassword)(password, user.password_hash);
        if (!isValidPassword) {
            return (0, response_1.jsonResponse)({ error: 'Invalid email or password' }, 401);
        }
        // Update last login
        await (0, database_1.query)('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        // Get user profile
        const profile = await (0, database_1.queryOne)('SELECT display_name, full_name FROM user_profiles WHERE user_id = $1', [user.id]);
        // Get user roles
        const roles = await (0, database_1.query)(`SELECT r.role_key
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`, [user.id]);
        // Generate tokens
        const displayName = profile?.display_name || profile?.full_name || email.split('@')[0];
        const authenticatedUser = {
            userId: user.id,
            email: user.email,
            displayName,
            roles: roles.map(r => r.role_key),
        };
        const tokens = (0, auth_1.generateTokens)(authenticatedUser);
        return (0, response_1.jsonResponse)({
            user: {
                id: authenticatedUser.userId,
                email: authenticatedUser.email,
                displayName: authenticatedUser.displayName,
            },
            ...tokens,
        });
    }
    catch (error) {
        context.error('Error logging in:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/login',
    handler: login,
});
//# sourceMappingURL=login.js.map