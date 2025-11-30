import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { query } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';

interface StrategyLeg {
  type: 'call' | 'put';
  side: 'buy' | 'sell';
  strike: number;
  expiration: string;
  quantity: number;
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

export async function getSavedStrategies(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);

    const url = new URL(request.url);
    const favoritesOnly = url.searchParams.get('favorites') === 'true';
    const ticker = url.searchParams.get('ticker');

    let queryText = `
      SELECT id, user_id, strategy_name, underlying_ticker, legs, notes,
             is_favorite, is_template, created_at, updated_at
      FROM saved_strategies
      WHERE user_id = $1
    `;
    const params: any[] = [user.userId];
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

    const strategies = await query<SavedStrategy>(queryText, params);

    return jsonResponse({ strategies });
  } catch (error) {
    context.error('Error fetching saved strategies:', error);
    return handleError(error);
  }
}

app.http('getSavedStrategies', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'strategies',
  handler: getSavedStrategies,
});
