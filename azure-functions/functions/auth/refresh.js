"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = refresh;
const functions_1 = require("@azure/functions");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const auth_1 = require("../../lib/auth");
async function refresh(request, context) {
    try {
        const body = await request.json();
        const { refreshToken } = body;
        if (!refreshToken) {
            return (0, response_1.jsonResponse)({ error: 'Refresh token is required' }, 400);
        }
        // Validate refresh token
        const userId = (0, auth_1.validateRefreshToken)(refreshToken);
        if (!userId) {
            return (0, response_1.jsonResponse)({ error: 'Invalid or expired refresh token' }, 401);
        }
        // Get user
        const user = await (0, database_1.queryOne)('SELECT id, email FROM users WHERE id = $1', [userId]);
        if (!user) {
            return (0, response_1.jsonResponse)({ error: 'User not found' }, 401);
        }
        // Get user profile
        const profile = await (0, database_1.queryOne)('SELECT display_name, full_name FROM user_profiles WHERE user_id = $1', [user.id]);
        // Get user roles
        const roles = await (0, database_1.query)(`SELECT r.role_key
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`, [user.id]);
        // Generate new tokens
        const displayName = profile?.display_name || profile?.full_name || user.email.split('@')[0];
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
        context.error('Error refreshing token:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('refresh', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/refresh',
    handler: refresh,
});
//# sourceMappingURL=refresh.js.map