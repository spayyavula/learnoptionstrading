"use strict";
/**
 * Azure Functions Entry Point
 * This file imports all function handlers to register them with the Azure Functions runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Health check
require("./functions/health");
// Trading functions
require("./functions/trading/getTradeHistory");
require("./functions/trading/createTrade");
require("./functions/trading/closeTrade");
require("./functions/trading/getTradingMetrics");
// Strategy functions
require("./functions/strategies/getSavedStrategies");
require("./functions/strategies/saveStrategy");
// Subscription functions
require("./functions/subscription/getSubscription");
// Stripe functions
require("./functions/stripe/createCheckout");
require("./functions/stripe/webhook");
// Auth functions
require("./functions/auth/register");
require("./functions/auth/login");
require("./functions/auth/me");
require("./functions/auth/refresh");
console.log('Azure Functions registered successfully');
//# sourceMappingURL=index.js.map