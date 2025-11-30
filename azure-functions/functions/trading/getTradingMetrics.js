"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradingMetrics = getTradingMetrics;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
async function getTradingMetrics(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        // Get stored metrics
        const storedMetrics = await (0, database_1.queryOne)(`SELECT * FROM user_trading_metrics WHERE user_id = $1`, [user.userId]);
        // Calculate additional metrics from trade history
        const additionalMetrics = await (0, database_1.queryOne)(`SELECT
        COALESCE(SUM(profit_loss), 0) as total_profit_loss,
        COALESCE(MAX(profit_loss), 0) as best_trade,
        COALESCE(MIN(profit_loss), 0) as worst_trade,
        COALESCE(AVG(EXTRACT(EPOCH FROM (exit_date::timestamp - entry_date::timestamp)) / 86400), 0) as avg_holding_days
      FROM trade_history
      WHERE user_id = $1 AND exit_date IS NOT NULL`, [user.userId]);
        const metrics = {
            user_id: user.userId,
            total_trades: storedMetrics?.total_trades || 0,
            winning_trades: storedMetrics?.winning_trades || 0,
            losing_trades: storedMetrics?.losing_trades || 0,
            average_win: storedMetrics?.average_win || 0,
            average_loss: storedMetrics?.average_loss || 0,
            win_rate: storedMetrics?.win_rate || 0,
            win_loss_ratio: storedMetrics?.win_loss_ratio || 0,
            kelly_percentage: storedMetrics?.kelly_percentage || 0,
            total_profit_loss: additionalMetrics?.total_profit_loss || 0,
            best_trade: additionalMetrics?.best_trade || 0,
            worst_trade: additionalMetrics?.worst_trade || 0,
            average_holding_period_days: additionalMetrics?.avg_holding_days || 0,
        };
        return (0, response_1.jsonResponse)({ metrics });
    }
    catch (error) {
        context.error('Error fetching trading metrics:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('getTradingMetrics', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'trading/metrics',
    handler: getTradingMetrics,
});
//# sourceMappingURL=getTradingMetrics.js.map