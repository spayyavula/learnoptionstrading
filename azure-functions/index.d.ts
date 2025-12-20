/**
 * Azure Functions Entry Point
 * This file imports all function handlers to register them with the Azure Functions runtime.
 */
import './functions/health';
import './functions/trading/getTradeHistory';
import './functions/trading/createTrade';
import './functions/trading/closeTrade';
import './functions/trading/getTradingMetrics';
import './functions/strategies/getSavedStrategies';
import './functions/strategies/saveStrategy';
import './functions/subscription/getSubscription';
import './functions/stripe/createCheckout';
import './functions/stripe/webhook';
import './functions/register';
import './functions/login';
import './functions/me';
import './functions/refresh';
import './functions/ping';
//# sourceMappingURL=index.d.ts.map