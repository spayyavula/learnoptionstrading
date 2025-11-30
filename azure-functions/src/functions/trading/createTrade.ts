import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { query, queryOne } from '../../lib/database';
import { jsonResponse, badRequest, handleError } from '../../lib/response';
import { v4 as uuidv4 } from 'uuid';

interface CreateTradeRequest {
  contract_ticker: string;
  underlying_ticker: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  quantity: number;
  strategy_type?: string;
  notes?: string;
}

interface Trade {
  id: string;
  user_id: string;
  contract_ticker: string;
  underlying_ticker: string;
  trade_type: string;
  entry_price: number;
  quantity: number;
  entry_date: string;
  strategy_type: string | null;
  notes: string | null;
}

export async function createTrade(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);
    const body = await request.json() as CreateTradeRequest;

    // Validate required fields
    if (!body.contract_ticker || !body.underlying_ticker || !body.trade_type ||
        body.entry_price == null || body.quantity == null) {
      return badRequest('Missing required fields: contract_ticker, underlying_ticker, trade_type, entry_price, quantity');
    }

    if (!['BUY', 'SELL'].includes(body.trade_type)) {
      return badRequest('trade_type must be BUY or SELL');
    }

    if (body.entry_price <= 0) {
      return badRequest('entry_price must be positive');
    }

    if (body.quantity <= 0) {
      return badRequest('quantity must be positive');
    }

    const tradeId = uuidv4();
    const entryDate = new Date().toISOString();

    const trade = await queryOne<Trade>(
      `INSERT INTO trade_history
        (id, user_id, contract_ticker, underlying_ticker, trade_type, entry_price, quantity, entry_date, strategy_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
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
      ]
    );

    return jsonResponse({ trade }, 201);
  } catch (error) {
    context.error('Error creating trade:', error);
    return handleError(error);
  }
}

app.http('createTrade', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'trading/trades',
  handler: createTrade,
});
