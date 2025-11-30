"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStrategy = saveStrategy;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const uuid_1 = require("uuid");
async function saveStrategy(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        const body = await request.json();
        // Validate required fields
        if (!body.strategy_name || !body.underlying_ticker || !body.legs) {
            return (0, response_1.badRequest)('Missing required fields: strategy_name, underlying_ticker, legs');
        }
        if (!Array.isArray(body.legs) || body.legs.length === 0) {
            return (0, response_1.badRequest)('legs must be a non-empty array');
        }
        // Validate each leg
        for (const leg of body.legs) {
            if (!['call', 'put'].includes(leg.type)) {
                return (0, response_1.badRequest)('Each leg type must be "call" or "put"');
            }
            if (!['buy', 'sell'].includes(leg.side)) {
                return (0, response_1.badRequest)('Each leg side must be "buy" or "sell"');
            }
            if (typeof leg.strike !== 'number' || leg.strike <= 0) {
                return (0, response_1.badRequest)('Each leg must have a positive strike price');
            }
            if (typeof leg.quantity !== 'number' || leg.quantity <= 0) {
                return (0, response_1.badRequest)('Each leg must have a positive quantity');
            }
        }
        const strategyId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const strategy = await (0, database_1.queryOne)(`INSERT INTO saved_strategies
        (id, user_id, strategy_name, underlying_ticker, legs, notes, is_favorite, is_template, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`, [
            strategyId,
            user.userId,
            body.strategy_name,
            body.underlying_ticker.toUpperCase(),
            JSON.stringify(body.legs),
            body.notes || null,
            body.is_favorite || false,
            body.is_template || false,
            now,
        ]);
        return (0, response_1.jsonResponse)({ strategy }, 201);
    }
    catch (error) {
        context.error('Error saving strategy:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('saveStrategy', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'strategies',
    handler: saveStrategy,
});
//# sourceMappingURL=saveStrategy.js.map