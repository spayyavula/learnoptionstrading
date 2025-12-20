/**
 * Azure Functions Entry Point
 * This file imports all function handlers to register them with the Azure Functions runtime.
 */

// Health check
import './functions/health';

// Trading functions
import './functions/trading/getTradeHistory';
import './functions/trading/createTrade';
import './functions/trading/closeTrade';
import './functions/trading/getTradingMetrics';

// Strategy functions
import './functions/strategies/getSavedStrategies';
import './functions/strategies/saveStrategy';

// Subscription functions
import './functions/subscription/getSubscription';

// Stripe functions
import './functions/stripe/createCheckout';
import './functions/stripe/webhook';

// Auth functions (flat structure)
import './functions/register';
import './functions/login';
import './functions/me';
import './functions/refresh';
import './functions/ping';

console.log('Azure Functions registered successfully');
