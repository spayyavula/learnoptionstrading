import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import Stripe from 'stripe';
import { query } from '../../lib/database';
import { jsonResponse, badRequest, serverError } from '../../lib/response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function stripeWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    context.warn('Missing Stripe signature or webhook secret');
    return badRequest('Missing signature');
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    context.error('Webhook signature verification failed:', err.message);
    return badRequest(`Webhook Error: ${err.message}`);
  }

  context.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await query(
            `INSERT INTO subscriptions
              (user_id, customer_id, subscription_id, status, price_id,
               current_period_start, current_period_end, created)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               customer_id = EXCLUDED.customer_id,
               subscription_id = EXCLUDED.subscription_id,
               status = EXCLUDED.status,
               price_id = EXCLUDED.price_id,
               current_period_start = EXCLUDED.current_period_start,
               current_period_end = EXCLUDED.current_period_end`,
            [
              session.client_reference_id, // user_id passed from frontend
              session.customer,
              subscription.id,
              subscription.status,
              subscription.items.data[0]?.price.id,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000),
            ]
          );

          context.log(`Subscription created for user: ${session.client_reference_id}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        await query(
          `UPDATE subscriptions
           SET status = $1,
               price_id = $2,
               current_period_start = $3,
               current_period_end = $4,
               cancel_at_period_end = $5
           WHERE subscription_id = $6`,
          [
            subscription.status,
            subscription.items.data[0]?.price.id,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end,
            subscription.id,
          ]
        );

        context.log(`Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await query(
          `UPDATE subscriptions
           SET status = 'canceled',
               cancel_at_period_end = false
           WHERE subscription_id = $1`,
          [subscription.id]
        );

        context.log(`Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          await query(
            `UPDATE subscriptions
             SET status = 'past_due'
             WHERE subscription_id = $1`,
            [invoice.subscription]
          );

          context.warn(`Payment failed for subscription: ${invoice.subscription}`);
        }
        break;
      }

      default:
        context.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    context.error('Error processing webhook:', error);
    return serverError('Error processing webhook');
  }
}

app.http('stripeWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'stripe/webhook',
  handler: stripeWebhook,
});
