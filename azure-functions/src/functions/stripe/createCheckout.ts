import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import Stripe from 'stripe';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, badRequest, handleError } from '../../lib/response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckout(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);
    const body = await request.json() as CreateCheckoutRequest;

    if (!body.priceId || !body.successUrl || !body.cancelUrl) {
      return badRequest('Missing required fields: priceId, successUrl, cancelUrl');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      client_reference_id: user.userId,
      customer_email: user.email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          user_id: user.userId,
        },
      },
    });

    return jsonResponse({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    context.error('Error creating checkout session:', error);
    return handleError(error);
  }
}

app.http('createCheckout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'stripe/checkout',
  handler: createCheckout,
});
