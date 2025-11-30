"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckout = createCheckout;
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
const auth_1 = require("../../lib/auth");
const response_1 = require("../../lib/response");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
async function createCheckout(request, context) {
    try {
        const user = (0, auth_1.requireAuth)(request);
        const body = await request.json();
        if (!body.priceId || !body.successUrl || !body.cancelUrl) {
            return (0, response_1.badRequest)('Missing required fields: priceId, successUrl, cancelUrl');
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
        return (0, response_1.jsonResponse)({
            sessionId: session.id,
            url: session.url,
        });
    }
    catch (error) {
        context.error('Error creating checkout session:', error);
        return (0, response_1.handleError)(error);
    }
}
functions_1.app.http('createCheckout', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'stripe/checkout',
    handler: createCheckout,
});
//# sourceMappingURL=createCheckout.js.map