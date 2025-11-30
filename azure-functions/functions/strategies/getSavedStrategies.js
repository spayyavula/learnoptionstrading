"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedStrategies = getSavedStrategies;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
async function getSavedStrategies(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        const url = new URL(request.url);
        const favoritesOnly = url.searchParams.get('favorites') === 'true';
        const ticker = url.searchParams.get('ticker');
        let queryText = `
      SELECT id, user_id, strategy_name, underlying_ticker, legs, notes,
             is_favorite, is_template, created_at, updated_at
      FROM saved_strategies
      WHERE user_id = $1
    `;
        const params = [user.userId];
        let paramIndex = 2;
        if (favoritesOnly) {
            queryText += ` AND is_favorite = true`;
        }
        if (ticker) {
            queryText += ` AND underlying_ticker = $${paramIndex}`;
            params.push(ticker.toUpperCase());
            paramIndex++;
        }
        queryText += ` ORDER BY updated_at DESC`;
        const strategies = await (0, database_1.query)(queryText, params);
        return (0, response_1.jsonResponse)({ strategies });
    }
    catch (error) {
        context.error('Error fetching saved strategies:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('getSavedStrategies', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'strategies',
    handler: getSavedStrategies,
});
//# sourceMappingURL=getSavedStrategies.js.map