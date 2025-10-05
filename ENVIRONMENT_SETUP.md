# 🔧 Environment Configuration Guide

## 📁 Environment Files Setup

### Development (`.env.local`)
- **Purpose**: Used when running `npm run dev`
- **Safety**: Stripe keys are intentionally left blank to force mock checkout
- **Result**: All payments are simulated - no real money involved
- **Benefits**: Fast, safe development without risk of accidental charges

### Production (`.env.production`)
- **Purpose**: Used when building for production (`npm run build`)
- **Configuration**: Contains real Stripe live keys and price IDs
- **Result**: Real payments are processed
- **Security**: Never commit this file to git

## 🔄 How It Works

### Development Mode (`npm run dev`)
1. Loads `.env.local` (Stripe keys blank)
2. App detects missing Stripe configuration
3. Automatically uses mock checkout
4. Shows "Development Mode" banners
5. No real payments possible ✅

### Production Mode (`npm run build`)
1. Loads `.env.production` (Real Stripe keys)
2. App detects live Stripe configuration
3. Uses real Stripe checkout
4. Processes actual payments
5. Production-ready behavior ✅

## 🚨 Safety Features

- **Development**: Forced mock mode prevents accidental live payments
- **Production**: Real Stripe only works with proper environment setup
- **Validation**: App checks for live vs test keys and warns accordingly
- **Isolation**: Development and production environments are completely separate

## 🧪 Testing Real Stripe in Development

If you need to test real Stripe integration in development:

1. **Option 1**: Use Stripe test keys in `.env.local`
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_ID_MONTHLY=price_test_...
   ```

2. **Option 2**: Temporarily run in production mode
   ```bash
   npm run build && npm run preview
   ```

## 🎯 Current Setup

- ✅ Development: Mock checkout (safe)
- ✅ Production: Real Stripe (configured)
- ✅ Environment isolation working
- ✅ No risk of accidental live payments during development

## 🔍 Debugging Environment Issues

If you see "Failed to create checkout session" in development:
1. Check that `.env.local` has blank Stripe keys
2. Restart the dev server: `npm run dev`
3. Look for "Development mode detected" in console
4. Should see "Using mock checkout for safety"

If checkout doesn't work in production:
1. Verify `.env.production` has real Stripe keys
2. Check Stripe Dashboard for product/price status
3. Run diagnostics: `DiagnosticTool.runDiagnostics()`
