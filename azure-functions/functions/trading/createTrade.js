"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrade = createTrade;
const functions_1 = require("@azure/functions");
const auth_1 = require("../../lib/auth");
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const uuid_1 = require("uuid");
async function createTrade(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        const body = await request.json();
        // Validate required fields
        if (!body.contract_ticker || !body.underlying_ticker || !body.trade_type ||
            body.entry_price == null || body.quantity == null) {
            return (0, response_1.badRequest)('Missing required fields: contract_ticker, underlying_ticker, trade_type, entry_price, quantity');
        }
        if (!['BUY', 'SELL'].includes(body.trade_type)) {
            return (0, response_1.badRequest)('trade_type must be BUY or SELL');
        }
        if (body.entry_price <= 0) {
            return (0, response_1.badRequest)('entry_price must be positive');
        }
        if (body.quantity <= 0) {
            return (0, response_1.badRequest)('quantity must be positive');
        }
        const tradeId = (0, uuid_1.v4)();
        const entryDate = new Date().toISOString();
        const trade = await (0, database_1.queryOne)(`INSERT INTO trade_history
        (id, user_id, contract_ticker, underlying_ticker, trade_type, entry_price, quantity, entry_date, strategy_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`, [
            tradeId,
            user.userId,
            body.contract_ticker,
            body.underlying_ticker,
            body.trade_type,
            body.entry_price,
            body.quantity,
            entryDate,
            body.strategy_type || null,
            body.notes || null,
        ]);
        return (0, response_1.jsonResponse)({ trade }, 201);
    }
    catch (error) {
        context.error('Error creating trade:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('createTrade', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'trading/trades',
    handler: createTrade,
});
//# sourceMappingURL=createTrade.js.map