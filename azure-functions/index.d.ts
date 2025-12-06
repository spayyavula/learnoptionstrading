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
import './functions/auth/register';
import './functions/auth/login';
import './functions/auth/me';
import './functions/auth/refresh';
//# sourceMappingURL=index.d.ts.map