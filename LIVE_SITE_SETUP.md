# 🚀 Live Site Setup Guide

## Step-by-Step Production Setup

### 1. 🔑 Get Your Stripe Live Keys

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Switch to Live Mode**: Toggle the "Test mode" switch to OFF (top right)
3. **Get API Keys**:
   - Go to **Developers > API Keys**
   - Copy **Publishable key** (starts with `pk_live_`)
   - Copy **Secret key** (starts with `sk_live_`)

### 2. 📦 Create Live Products in Stripe

1. **Go to Products**: In Stripe Dashboard, click "Products"
2. **Create Each Product**:
   - **Monthly Plan**: $29/month
   - **Yearly Plan**: $290/year (save ~17%)
   - **Pro Plan**: $79/month
   - **Enterprise Plan**: $199/month
   - **Coffee Donation**: $5 one-time

3. **Copy Price IDs**: For each product, copy the Price ID (starts with `price_`)

### 3. 🔧 Update Environment Variables

**Update your `.env.production` file with real values:**

```bash
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcWxjbWVxemdtenpheHF3bHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NDc3MDcsImV4cCI6MjA2NjQyMzcwN30.9td3o44Ik42H-QBX2qUBROxIvSd9vhRS9IM4kqM5K0s
VITE_SUPABASE_URL=https://laqlcmeqzgmzzaxqwlxe.supabase.co

# 🔴 REPLACE WITH YOUR ACTUAL STRIPE KEYS
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY
VITE_STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY

# 🔴 REPLACE WITH YOUR ACTUAL PRICE IDs
VITE_STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_ID
VITE_STRIPE_YEARLY_PRICE_ID=price_YOUR_YEARLY_ID
VITE_STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
VITE_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_ID
VITE_STRIPE_COFFEE_PRICE_ID=price_YOUR_COFFEE_ID
VITE_STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 4. 🔗 Set Up Stripe Webhooks

1. **Go to Webhooks**: In Stripe Dashboard, go to **Developers > Webhooks**
2. **Add Endpoint**: Click "Add endpoint"
3. **Enter URL**: `https://laqlcmeqzgmzzaxqwlxe.supabase.co/functions/v1/stripe-webhook`
4. **Select Events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy Webhook Secret**: Copy the webhook signing secret (starts with `whsec_`)

### 5. 🏗️ Build and Deploy

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build for Production**:
   ```bash
   npm run build
   ```

3. **Deploy Options**:
   - **Vercel**: `npm install -g vercel && vercel --prod`
   - **Netlify**: `npm install -g netlify-cli && netlify deploy --prod`
   - **GitHub Pages**: Push to `gh-pages` branch
   - **Manual**: Upload `dist/` folder to your hosting provider

### 6. 📧 Configure Domain & SSL

1. **Custom Domain**: Point your domain to your hosting platform
2. **SSL Certificate**: Most platforms provide free SSL (Let's Encrypt)
3. **Update Webhook URL**: Update Stripe webhook URL to use your domain

### 7. 🧪 Test Live Payments

1. **Test Small Amount**: Start with coffee donation ($5)
2. **Check Stripe Dashboard**: Verify payments appear in live mode
3. **Test Subscription**: Test monthly subscription
4. **Check Database**: Verify user data is saved in Supabase

### 8. 🎯 Final Checklist

- [ ] Stripe live keys configured
- [ ] All price IDs updated
- [ ] Webhooks configured and working
- [ ] Domain configured with SSL
- [ ] Live payments tested
- [ ] Database integration verified
- [ ] Error monitoring enabled

## 🚨 Important Security Notes

1. **Never commit live keys to git**
2. **Use environment variables on hosting platform**
3. **Enable Stripe webhook signature verification**
4. **Set up proper error monitoring**
5. **Regular backup of Supabase database**

## 🆘 Troubleshooting

**Common Issues:**
- **Webhook failures**: Check URL and selected events
- **CORS errors**: Ensure domain is properly configured
- **Payment failures**: Check live vs test key mismatches
- **Database errors**: Verify Supabase RLS policies

**Support:**
- Stripe Documentation: https://stripe.com/docs
- Supabase Documentation: https://supabase.com/docs
- React/Vite Documentation: https://vitejs.dev/guide/

---

**Ready to go live? Follow these steps and you'll have a fully functional live site with real payments!** 🚀
