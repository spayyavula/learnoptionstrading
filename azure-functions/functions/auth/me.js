"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = me;
const functions_1 = require("@azure/functions");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const auth_1 = require("../../lib/auth");
async function me(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        // Get user profile
        const profile = await (0, database_1.queryOne)(`SELECT display_name, full_name, avatar_url, trading_experience,
              risk_tolerance, onboarding_completed
       FROM user_profiles WHERE user_id = $1`, [user.userId]);
        // Get user roles
        const roles = await (0, database_1.query)(`SELECT r.role_key, r.role_name
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`, [user.userId]);
        // Get subscription
        const subscription = await (0, database_1.queryOne)(`SELECT plan_type, status, current_period_end
       FROM subscriptions WHERE user_id = $1`, [user.userId]);
        return (0, response_1.jsonResponse)({
            id: user.userId,
            email: user.email,
            displayName: profile?.display_name || profile?.full_name || user.email.split('@')[0],
            avatarUrl: profile?.avatar_url,
            tradingExperience: profile?.trading_experience,
            riskTolerance: profile?.risk_tolerance,
            onboardingCompleted: profile?.onboarding_completed ?? false,
            roles: roles.map(r => ({
                key: r.role_key,
                name: r.role_name,
            })),
            subscription: subscription ? {
                plan: subscription.plan_type,
                status: subscription.status,
                expiresAt: subscription.current_period_end,
            } : {
                plan: 'free',
                status: 'active',
                expiresAt: null,
            },
        });
    }
    catch (error) {
        context.error('Error fetching user:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('me', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'auth/me',
    handler: me,
});
//# sourceMappingURL=me.js.map