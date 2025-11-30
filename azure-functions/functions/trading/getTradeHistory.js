"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradeHistory = getTradeHistory;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
async function getTradeHistory(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        // Parse query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '50', 10), 100);
        const offset = (page - 1) * pageSize;
        // Get total count
        const countResult = await (0, database_1.query)('SELECT COUNT(*) as count FROM trade_history WHERE user_id = $1', [user.userId]);
        const total = parseInt(countResult[0]?.count || '0', 10);
        // Get paginated trades
        const trades = await (0, database_1.query)(`SELECT
        id,
        contract_ticker,
        underlying_ticker,
        trade_type,
        entry_price,
        exit_price,
        quantity,
        profit_loss,
        entry_date,
        exit_date,
        strategy_type,
        is_winner,
        notes
      FROM trade_history
      WHERE user_id = $1
      ORDER BY entry_date DESC
      LIMIT $2 OFFSET $3`, [user.userId, pageSize, offset]);
        const response = {
            trades,
            total,
            page,
            pageSize,
        };
        return (0, response_1.jsonResponse)(response);
    }
    catch (error) {
        context.error('Error fetching trade history:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('getTradeHistory', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'trading/history',
    handler: getTradeHistory,
});
//# sourceMappingURL=getTradeHistory.js.map