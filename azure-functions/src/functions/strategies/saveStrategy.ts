import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { queryOne } from '../../lib/database';
import { jsonResponse, badRequest, handleError } from '../../lib/response';
import { v4 as uuidv4 } from 'uuid';

interface StrategyLeg {
  type: 'call' | 'put';
  side: 'buy' | 'sell';
  strike: number;
  expiration: string;
  quantity: number;
}

interface SaveStrategyRequest {
  strategy_name: string;
  underlying_ticker: string;
  legs: StrategyLeg[];
  notes?: string;
  is_favorite?: boolean;
  is_template?: boolean;
}

interface SavedStrategy {
  id: string;
  user_id: string;
  strategy_name: string;
  underlying_ticker: string;
  legs: StrategyLeg[];
  notes: string | null;
  is_favorite: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export async function saveStrategy(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);
    const body = await request.json() as SaveStrategyRequest;

    // Validate required fields
    if (!body.strategy_name || !body.underlying_ticker || !body.legs) {
      return badRequest('Missing required fields: strategy_name, underlying_ticker, legs');
    }

    if (!Array.isArray(body.legs) || body.legs.length === 0) {
      return badRequest('legs must be a non-empty array');
    }

    // Validate each leg
    for (const leg of body.legs) {
      if (!['call', 'put'].includes(leg.type)) {
        return badRequest('Each leg type must be "call" or "put"');
      }
      if (!['buy', 'sell'].includes(leg.side)) {
        return badRequest('Each leg side must be "buy" or "sell"');
      }
      if (typeof leg.strike !== 'number' || leg.strike <= 0) {
        return badRequest('Each leg must have a positive strike price');
      }
      if (typeof leg.quantity !== 'number' || leg.quantity <= 0) {
        return badRequest('Each leg must have a positive quantity');
      }
    }

    const strategyId = uuidv4();
    const now = new Date().toISOString();

    const strategy = await queryOne<SavedStrategy>(
      `INSERT INTO saved_strategies
        (id, user_id, strategy_name, underlying_ticker, legs, notes, is_favorite, is_template, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [
        strategyId,
        user.userId,
        body.strategy_name,
        body.underlying_ticker.toUpperCase(),
        JSON.stringify(body.legs),
        body.notes || null,
        body.is_favorite || false,
        body.is_template || false,
        now,
      ]
    );

    return jsonResponse({ strategy }, 201);
  } catch (error) {
    context.error('Error saving strategy:', error);
    return handleError(error);
  }
}

app.http('saveStrategy', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'strategies',
  handler: saveStrategy,
});
