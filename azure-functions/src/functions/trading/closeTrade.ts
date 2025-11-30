import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { queryOne } from '../../lib/database';
import { jsonResponse, badRequest, notFound, forbidden, handleError } from '../../lib/response';

interface CloseTradeRequest {
  exit_price: number;
  notes?: string;
}

interface Trade {
  id: string;
  user_id: string;
  contract_ticker: string;
  trade_type: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  profit_loss: number;
  entry_date: string;
  exit_date: string;
  is_winner: boolean;
}

export async function closeTrade(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);
    const tradeId = request.params.tradeId;
    const body = await request.json() as CloseTradeRequest;

    if (!tradeId) {
      return badRequest('Trade ID is required');
    }

    if (body.exit_price == null || body.exit_price <= 0) {
      return badRequest('exit_price must be a positive number');
    }

    // Verify trade exists and belongs to user
    const existingTrade = await queryOne<{ id: string; user_id: string; trade_type: string; entry_price: number; quantity: number; exit_date: string | null }>(
      'SELECT id, user_id, trade_type, entry_price, quantity, exit_date FROM trade_history WHERE id = $1',
      [tradeId]
    );

    if (!existingTrade) {
      return notFound('Trade not found');
    }

    if (existingTrade.user_id !== user.userId) {
      return forbidden('You do not have permission to close this trade');
    }

    if (existingTrade.exit_date) {
      return badRequest('Trade has already been closed');
    }

    // Calculate profit/loss
    const priceDiff = body.exit_price - existingTrade.entry_price;
    const multiplier = existingTrade.trade_type === 'BUY' ? 1 : -1;
    const profitLoss = priceDiff * multiplier * existingTrade.quantity * 100; // Options are 100 shares per contract
    const isWinner = profitLoss > 0;

    const trade = await queryOne<Trade>(
      `UPDATE trade_history
       SET exit_price = $1,
           exit_date = $2,
           profit_loss = $3,
           is_winner = $4,
           notes = COALESCE($5, notes)
       WHERE id = $6
       RETURNING *`,
      [
        body.exit_price,
        new Date().toISOString(),
        profitLoss,
        isWinner,
        body.notes || null,
        tradeId,
      ]
    );

    // Update user trading metrics
    await updateTradingMetrics(user.userId);

    return jsonResponse({ trade });
  } catch (error) {
    context.error('Error closing trade:', error);
    return handleError(error);
  }
}

async function updateTradingMetrics(userId: string): Promise<void> {
  // Recalculate trading metrics
  await queryOne(
    `INSERT INTO user_trading_metrics (user_id, total_trades, winning_trades, losing_trades, average_win, average_loss, win_rate, win_loss_ratio, kelly_percentage)
     SELECT
       $1 as user_id,
       COUNT(*) as total_trades,
       COUNT(*) FILTER (WHERE is_winner = true) as winning_trades,
       COUNT(*) FILTER (WHERE is_winner = false) as losing_trades,
       COALESCE(AVG(profit_loss) FILTER (WHERE is_winner = true), 0) as average_win,
       COALESCE(ABS(AVG(profit_loss) FILTER (WHERE is_winner = false)), 0) as average_loss,
       CASE WHEN COUNT(*) > 0
         THEN (COUNT(*) FILTER (WHERE is_winner = true)::float / COUNT(*)::float) * 100
         ELSE 0
       END as win_rate,
       CASE WHEN COUNT(*) FILTER (WHERE is_winner = false) > 0
         THEN COALESCE(AVG(profit_loss) FILTER (WHERE is_winner = true), 0) / NULLIF(ABS(AVG(profit_loss) FILTER (WHERE is_winner = false)), 0)
         ELSE 0
       END as win_loss_ratio,
       0 as kelly_percentage
     FROM trade_history
     WHERE user_id = $1 AND exit_date IS NOT NULL
     ON CONFLICT (user_id) DO UPDATE SET
       total_trades = EXCLUDED.total_trades,
       winning_trades = EXCLUDED.winning_trades,
       losing_trades = EXCLUDED.losing_trades,
       average_win = EXCLUDED.average_win,
       average_loss = EXCLUDED.average_loss,
       win_rate = EXCLUDED.win_rate,
       win_loss_ratio = EXCLUDED.win_loss_ratio`,
    [userId]
  );
}

app.http('closeTrade', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'trading/trades/{tradeId}/close',
  handler: closeTrade,
});
