"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = stripeWebhook;
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../../lib/database");
const response_1 = require("../../lib/response");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
async function stripeWebhook(request, context) {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
        context.warn('Missing Stripe signature or webhook secret');
        return (0, response_1.badRequest)('Missing signature');
    }
    let event;
    try {
        const body = await request.text();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
    catch (err) {
        context.error('Webhook signature verification failed:', err.message);
        return (0, response_1.badRequest)(`Webhook Error: ${err.message}`);
    }
    context.log(`Processing Stripe event: ${event.type}`);
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode === 'subscription' && session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    await (0, database_1.query)(`INSERT INTO subscriptions
              (user_id, customer_id, subscription_id, status, price_id,
               current_period_start, current_period_end, created)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               customer_id = EXCLUDED.customer_id,
               subscription_id = EXCLUDED.subscription_id,
               status = EXCLUDED.status,
               price_id = EXCLUDED.price_id,
               current_period_start = EXCLUDED.current_period_start,
               current_period_end = EXCLUDED.current_period_end`, [
                        session.client_reference_id, // user_id passed from frontend
                        session.customer,
                        subscription.id,
                        subscription.status,
                        subscription.items.data[0]?.price.id,
                        new Date(subscription.current_period_start * 1000),
                        new Date(subscription.current_period_end * 1000),
                    ]);
                    context.log(`Subscription created for user: ${session.client_reference_id}`);
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await (0, database_1.query)(`UPDATE subscriptions
           SET status = $1,
               price_id = $2,
               current_period_start = $3,
               current_period_end = $4,
               cancel_at_period_end = $5
           WHERE subscription_id = $6`, [
                    subscription.status,
                    subscription.items.data[0]?.price.id,
                    new Date(subscription.current_period_start * 1000),
                    new Date(subscription.current_period_end * 1000),
                    subscription.cancel_at_period_end,
                    subscription.id,
                ]);
                context.log(`Subscription updated: ${subscription.id}`);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await (0, database_1.query)(`UPDATE subscriptions
           SET status = 'canceled',
               cancel_at_period_end = false
           WHERE subscription_id = $1`, [subscription.id]);
                context.log(`Subscription canceled: ${subscription.id}`);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await (0, database_1.query)(`UPDATE subscriptions
             SET status = 'past_due'
             WHERE subscription_id = $1`, [invoice.subscription]);
                    context.warn(`Payment failed for subscription: ${invoice.subscription}`);
                }
                break;
            }
            default:
                context.log(`Unhandled event type: ${event.type}`);
        }
        return (0, response_1.jsonResponse)({ received: true });
    }
    catch (error) {
        context.error('Error processing webhook:', error);
        return (0, response_1.serverError)('Error processing webhook');
    }
}
functions_1.app.http('stripeWebhook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'stripe/webhook',
    handler: stripeWebhook,
});
//# sourceMappingURL=webhook.js.map