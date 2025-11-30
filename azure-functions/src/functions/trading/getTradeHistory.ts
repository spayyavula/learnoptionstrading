import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { query } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';

interface Trade {
  id: string;
  contract_ticker: string;
  underlying_ticker: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  profit_loss: number | null;
  entry_date: string;
  exit_date: string | null;
  strategy_type: string | null;
  is_winner: boolean | null;
  notes: string | null;
}

interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getTradeHistory(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '50', 10), 100);
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM trade_history WHERE user_id = $1',
      [user.userId]
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get paginated trades
    const trades = await query<Trade>(
      `SELECT
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
      LIMIT $2 OFFSET $3`,
      [user.userId, pageSize, offset]
    );

    const response: TradeHistoryResponse = {
      trades,
      total,
      page,
      pageSize,
    };

    return jsonResponse(response);
  } catch (error) {
    context.error('Error fetching trade history:', error);
    return handleError(error);
  }
}

app.http('getTradeHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'trading/history',
  handler: getTradeHistory,
});
