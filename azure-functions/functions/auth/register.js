"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
const functions_1 = require("@azure/functions");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const auth_1 = require("../../lib/auth");
async function register(request, context) {
    try {
        const body = await request.json();
        const { email, password, displayName } = body;
        // Validate email
        if (!email || !(0, auth_1.isValidEmail)(email)) {
            return (0, response_1.jsonResponse)({ error: 'Invalid email address' }, 400);
        }
        // Validate password
        const passwordValidation = (0, auth_1.isValidPassword)(password);
        if (!passwordValidation.valid) {
            return (0, response_1.jsonResponse)({ error: passwordValidation.message }, 400);
        }
        // Check if email already exists
        const existingUser = await (0, database_1.queryOne)('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (existingUser) {
            return (0, response_1.jsonResponse)({ error: 'Email already registered' }, 409);
        }
        // Hash password
        const passwordHash = await (0, auth_1.hashPassword)(password);
        // Create user with transaction
        const result = await (0, database_1.transaction)(async (client) => {
            // Create user
            const userResult = await client.query(`INSERT INTO users (email, password_hash, email_verified)
         VALUES ($1, $2, false)
         RETURNING id, email`, [email.toLowerCase(), passwordHash]);
            const user = userResult.rows[0];
            // Create profile
            await client.query(`INSERT INTO user_profiles (user_id, display_name, full_name)
         VALUES ($1, $2, $2)`, [user.id, displayName || email.split('@')[0]]);
            // Create default paper trading account
            await client.query(`INSERT INTO paper_trading_accounts (user_id, account_name, account_description, is_default)
         VALUES ($1, 'My Paper Account', 'Default paper trading account with $100,000', true)`, [user.id]);
            // Assign free role
            await client.query(`INSERT INTO user_role_assignments (user_id, role_id)
         SELECT $1, id FROM user_roles WHERE role_key = 'free'`, [user.id]);
            return user;
        });
        // Get user roles
        const roles = await (0, database_1.query)(`SELECT r.role_key
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`, [result.id]);
        // Generate tokens
        const authenticatedUser = {
            userId: result.id,
            email: result.email,
            displayName: displayName || email.split('@')[0],
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
        }, 201);
    }
    catch (error) {
        context.error('Error registering user:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/register',
    handler: register,
});
//# sourceMappingURL=register.js.map