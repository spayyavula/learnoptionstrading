import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../lib/auth';
import { queryOne } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';

interface Subscription {
  user_id: string;
  customer_id: string;
  subscription_id: string;
  status: string;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_start: string | null;
  trial_end: string | null;
  created: string;
}

interface SubscriptionResponse {
  subscription: Subscription | null;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number | null;
}

export async function getSubscription(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);

    const subscription = await queryOne<Subscription>(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [user.userId]
    );

    if (!subscription) {
      return jsonResponse({
        subscription: null,
        isActive: false,
        isTrialing: false,
        daysRemaining: null,
      });
    }

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const isActive = ['active', 'trialing'].includes(subscription.status) && periodEnd > now;
    const isTrialing = subscription.status === 'trialing';

    let daysRemaining: number | null = null;
    if (isActive) {
      daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const response: SubscriptionResponse = {
      subscription,
      isActive,
      isTrialing,
      daysRemaining,
    };

    return jsonResponse(response);
  } catch (error) {
    context.error('Error fetching subscription:', error);
    return handleError(error);
  }
}

app.http('getSubscription', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'subscription',
  handler: getSubscription,
});
