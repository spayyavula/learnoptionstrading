"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscription = getSubscription;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
async function getSubscription(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        const subscription = await (0, database_1.queryOne)(`SELECT * FROM subscriptions WHERE user_id = $1`, [user.userId]);
        if (!subscription) {
            return (0, response_1.jsonResponse)({
                subscription: null,
                isActive: false,
                isTrialing: false,
                daysRemaining: null,
            });
        }
        const now = new Date();
        const periodEnd = new Date(subscription.current_period_end);
        const isActive = ['active', 'trialing'].includes(subscription.status) && periodEnd > now;
        const isTrialing = subscription.status === 'trialing';
        let daysRemaining = null;
        if (isActive) {
            daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        const response = {
            subscription,
            isActive,
            isTrialing,
            daysRemaining,
        };
        return (0, response_1.jsonResponse)(response);
    }
    catch (error) {
        context.error('Error fetching subscription:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('getSubscription', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'subscription',
    handler: getSubscription,
});
//# sourceMappingURL=getSubscription.js.map