#!/bin/bash
# 🚀 Production Deployment Script

echo "🚀 Starting Production Deployment..."

# Step 1: Environment Check
echo "📋 Checking environment variables..."
if [ -z "$VITE_STRIPE_PUBLISHABLE_KEY" ] || [ "$VITE_STRIPE_PUBLISHABLE_KEY" = "pk_live_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE" ]; then
    echo "❌ ERROR: Please set your real Stripe publishable key in .env.production"
    exit 1
fi

if [ -z "$VITE_STRIPE_SECRET_KEY" ] || [ "$VITE_STRIPE_SECRET_KEY" = "sk_live_YOUR_ACTUAL_SECRET_KEY_HERE" ]; then
    echo "❌ ERROR: Please set your real Stripe secret key in .env.production"
    exit 1
fi

# Step 2: Build Application
echo "🏗️  Building application..."
npm run build

# Step 3: Run Tests
echo "🧪 Running tests..."
npm run test

# Step 4: Deploy to hosting platform
echo "🚀 Ready to deploy!"
echo "Next steps:"
echo "1. Upload dist/ folder to your hosting platform"
echo "2. Set up environment variables on your hosting platform"
echo "3. Configure domain and SSL"
echo "4. Set up Stripe webhooks pointing to your domain"

echo "✅ Build completed successfully!"
