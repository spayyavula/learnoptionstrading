# 🚀 Production Setup Guide

## Current Issue: Subscription Errors in Production

The subscription errors are happening because Stripe isn't properly configured for production.

## ✅ Steps to Fix:

### 1. Set Up Stripe Account
1. Go to https://dashboard.stripe.com
2. Create account or log in
3. Navigate to **Developers > API Keys**
4. Copy your **Publishable Key** and **Secret Key**

### 2. Create Stripe Products & Prices
1. Go to **Products** in Stripe Dashboard
2. Create products for each plan:
   - **Monthly Plan** ($29/month)
   - **Yearly Plan** ($290/year) 
   - **Pro Plan** ($79/month)
   - **Enterprise Plan** ($199/month)

3. Copy each **Price ID** (starts with `price_1...`)

### 3. Update Production Environment Variables

#### A. Update `.env.production` file:
```bash
# Replace with your actual Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...your_real_key...
VITE_STRIPE_SECRET_KEY=sk_test_51...your_real_key...

# Replace with your actual price IDs
VITE_STRIPE_MONTHLY_PRICE_ID=price_1...your_monthly_id...
VITE_STRIPE_YEARLY_PRICE_ID=price_1...your_yearly_id...
VITE_STRIPE_PRICE_ID_PRO=price_1...your_pro_id...
VITE_STRIPE_PRICE_ID_ENTERPRISE=price_1...your_enterprise_id...
```

#### B. Update Supabase Environment Variables:
1. Go to your Supabase Dashboard
2. Navigate to **Settings > Edge Functions**
3. Add environment variables:
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key

### 4. Set Up Stripe Webhooks
1. Go to **Developers > Webhooks** in Stripe
2. Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Secret** and add to environment variables

### 5. Redeploy Your Application
After updating all environment variables, redeploy your application.

## 🧪 Testing in Production

1. Use Stripe **Test Mode** first
2. Use test card numbers: `4242 4242 4242 4242`
3. Once testing works, switch to **Live Mode**

## 🔍 Debug Production Issues

If you still get errors, check:
1. Browser DevTools Console for error messages
2. Supabase Logs for Edge Function errors
3. Stripe Dashboard for webhook delivery logs

## 📞 Need Help?

If you're still getting errors, share:
1. Error messages from browser console
2. Network tab showing failed requests
3. Supabase function logs
