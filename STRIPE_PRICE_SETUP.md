# 🚀 STRIPE SETUP GUIDE - Fix Subscription Errors

## Current Status:
✅ Stripe Keys: Added to .env.production
✅ Products: Created in Stripe Dashboard
❌ **MISSING: Price IDs** ← This is causing subscription errors

## 🎯 What You Need to Do RIGHT NOW:

### Step 1: Create Price Objects
For each product in your Stripe Dashboard, create a recurring price:

#### 1. Monthly Plan (prod_SZ1voDZ0f9aoIc)
- Go to: https://dashboard.stripe.com/products/prod_SZ1voDZ0f9aoIc
- Click "Add another price"
- Price: $29.00
- Billing: Recurring, every 1 month
- Copy the Price ID (starts with price_1...)

#### 2. Premium Plan (prod_SZ269pfj126XH2) 
- Go to: https://dashboard.stripe.com/products/prod_SZ269pfj126XH2
- Click "Add another price" 
- Price: $75.00
- Billing: Recurring, every 1 month
- Copy the Price ID

#### 3. Enterprise Plan (prod_SZ28r9W3Tc31ry)
- Go to: https://dashboard.stripe.com/products/prod_SZ28r9W3Tc31ry
- Click "Add another price"
- Price: $25.00  
- Billing: Recurring, every 1 month
- Copy the Price ID

#### 4. CREATE YEARLY PLAN (Missing!)
- Go to: https://dashboard.stripe.com/products
- Click "Add product"
- Name: "Yearly Plan"
- Add price: $290.00, recurring every 1 year
- Copy the Price ID

### Step 2: Update .env.production
Replace the placeholder values with your actual Price IDs:

```bash
VITE_STRIPE_MONTHLY_PRICE_ID=price_1xxxxYourActualMonthlyPriceID
VITE_STRIPE_YEARLY_PRICE_ID=price_1xxxxYourActualYearlyPriceID
VITE_STRIPE_PRICE_ID_PRO=price_1xxxxYourActualPremiumPriceID
VITE_STRIPE_PRICE_ID_ENTERPRISE=price_1xxxxYourActualEnterprisePriceID
```

### Step 3: Update Supabase Environment Variables
In your Supabase Dashboard → Settings → Edge Functions, add:
- STRIPE_SECRET_KEY = sk_live_51[YOUR_ACTUAL_STRIPE_SECRET_KEY_HERE]

### Step 4: Redeploy
After updating environment variables, redeploy your app.

## 🔍 Current Product Mapping:
- Monthly Plan → prod_SZ1voDZ0f9aoIc (Monthly)
- Yearly Plan → **NEED TO CREATE**
- Pro Plan → prod_SZ269pfj126XH2 (Premium Plan)  
- Enterprise → prod_SZ28r9W3Tc31ry (Enterprise Plan)

## 🎯 Why Subscriptions Are Failing:
Your app is looking for Price IDs but you only have Product IDs. Stripe needs the Price ID to create subscriptions, not the Product ID.

Once you add the actual Price IDs, your subscription flow will work! 🚀
