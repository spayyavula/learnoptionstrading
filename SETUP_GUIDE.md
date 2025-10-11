# Complete Setup Guide - Options Trading Platform

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [API Key Setup](#api-key-setup)
4. [Feature Configuration](#feature-configuration)
5. [Sentiment Analysis Setup](#sentiment-analysis-setup)
6. [Stripe Payment Integration](#stripe-payment-integration)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Setup (Development)
```bash
# 1. Clone and install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Set Supabase credentials (REQUIRED)
# Edit .env and add your Supabase URL and ANON KEY

# 4. Enable mock data for development
# In .env, set: VITE_ENABLE_MOCK_DATA=true

# 5. Start development server
npm run dev
```

The app will run at `http://localhost:5173` with mock data.

---

## Environment Configuration

### Required Variables (Tier 1)

These are **essential** for the app to function:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_POLYGON_API_KEY=your_polygon_key_here
```

**How to get them:**

#### Supabase Setup
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to Settings > API
4. Copy **URL** and **anon/public** key
5. Paste into `.env` file

#### Polygon.io Setup
1. Sign up at [Polygon.io](https://polygon.io/dashboard/signup)
2. Free tier available (5 calls/min, delayed data)
3. Go to Dashboard > API Keys
4. Copy your API key
5. Paste into `.env` file

**Alternative:** Use mock data by setting `VITE_ENABLE_MOCK_DATA=true`

---

## API Key Setup

### Market Data APIs

#### Polygon.io (Primary - REQUIRED)
```env
VITE_POLYGON_API_KEY=your_key_here
VITE_POLYGON_BASE_URL=https://api.polygon.io
```

**Pricing:**
- Free: 5 calls/min, delayed data
- Starter ($29/mo): 100 calls/min, real-time
- Developer ($99/mo): 1000 calls/min, full access

**Get key:** https://polygon.io/dashboard/signup

#### Alpha Vantage (Supplementary)
```env
VITE_ALPHA_VANTAGE_API_KEY=your_key_here
```

**Features:**
- Additional market data
- Sentiment indicators
- Economic indicators

**Free tier:** 25 requests/day
**Get key:** https://www.alphavantage.co/support/#api-key

#### Finnhub (Optional)
```env
VITE_FINNHUB_API_KEY=your_key_here
```

**Features:**
- Alternative news source
- IPO calendar
- Earnings calendar

**Free tier:** 60 calls/minute
**Get key:** https://finnhub.io/register

---

## Sentiment Analysis Setup

### Complete Sentiment Analysis Configuration

To enable **full sentiment analysis** features including AI-powered analysis:

```env
# News Source
VITE_NEWS_API_KEY=your_news_api_key

# AI Sentiment Analysis
VITE_HUGGINGFACE_API_KEY=your_huggingface_token

# Additional Market Data
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
VITE_FINANCIAL_MODELING_PREP_API_KEY=your_fmp_key

# Enable Features
VITE_ENABLE_REAL_TIME_DATA=true
VITE_AUTO_START_SENTIMENT_SYNC=true
VITE_SENTIMENT_SYNC_INTERVAL_MINUTES=60
```

### Step-by-Step Sentiment Setup

#### 1. News API Key
**Purpose:** Fetches financial news articles for sentiment analysis

1. Go to [News API](https://newsapi.org/register)
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env`: `VITE_NEWS_API_KEY=your_key`

**Free tier:** 100 requests/day, 1-month archive
**Paid tier:** Real-time news, full archive

#### 2. HuggingFace API Token
**Purpose:** Powers FinBERT AI model for financial sentiment analysis

1. Go to [HuggingFace](https://huggingface.co/join)
2. Create account
3. Go to Settings > Access Tokens
4. Create new token (Read access is sufficient)
5. Add to `.env`: `VITE_HUGGINGFACE_API_KEY=your_token`

**Free tier:** Rate-limited, suitable for development
**Pro ($9/mo):** Higher rate limits

#### 3. Alpha Vantage Key
**Purpose:** Sentiment indicators and market data

1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Enter email to get free API key instantly
3. Add to `.env`: `VITE_ALPHA_VANTAGE_API_KEY=your_key`

**Free tier:** 25 requests/day

#### 4. Financial Modeling Prep (Optional)
**Purpose:** Analyst recommendations and ratings

1. Sign up at [FMP](https://site.financialmodelingprep.com/register)
2. Free tier available
3. Get API key from dashboard
4. Add to `.env`: `VITE_FINANCIAL_MODELING_PREP_API_KEY=your_key`

### Sentiment Analysis Features

Once configured, you'll have access to:

1. **News Sentiment Dashboard** (`/app/sentiment`)
   - Real-time news feed with sentiment scores
   - Trending tickers with bullish/bearish indicators
   - Sentiment breakdown by ticker
   - Historical sentiment trends

2. **AI-Powered Analysis**
   - FinBERT sentiment classification (Positive/Negative/Neutral)
   - Confidence scores for each prediction
   - News article summarization
   - Sentiment aggregation across multiple sources

3. **Analyst Recommendations**
   - Buy/Hold/Sell ratings from major firms
   - Price targets and consensus
   - Rating changes and upgrades/downgrades
   - Historical analyst accuracy

4. **Market Event Analysis**
   - Earnings announcements
   - Economic events (Fed meetings, jobs reports)
   - Dividend dates
   - Stock splits and special events

### Testing Sentiment Analysis

```bash
# 1. Ensure all keys are set in .env
# 2. Enable real-time data
VITE_ENABLE_REAL_TIME_DATA=true

# 3. Start the app
npm run dev

# 4. Navigate to Sentiment Analysis page
# URL: http://localhost:5173/app/sentiment

# 5. Select a ticker (e.g., AAPL, TSLA, MSFT)
# 6. View sentiment scores and news articles
```

---

## Feature Configuration

### Feature Flags

Control which features are enabled:

```env
# Real-time data fetching
VITE_ENABLE_REAL_TIME_DATA=true

# Mock data fallback
VITE_ENABLE_MOCK_DATA=false

# Database persistence
VITE_ENABLE_DATA_PERSISTENCE=true

# Historical data retention (days)
VITE_HISTORICAL_DATA_RETENTION_DAYS=30

# Update intervals (milliseconds)
VITE_OPTIONS_UPDATE_INTERVAL=5000
VITE_MAX_HISTORICAL_DAYS=14

# Sentiment automation
VITE_AUTO_START_SENTIMENT_SYNC=false
VITE_SENTIMENT_SYNC_INTERVAL_MINUTES=60
```

### Recommended Configurations

#### Development Mode
```env
VITE_ENABLE_REAL_TIME_DATA=false
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DATA_PERSISTENCE=false
VITE_AUTO_START_SENTIMENT_SYNC=false
```

#### Testing Mode
```env
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=true  # Fallback if API fails
VITE_ENABLE_DATA_PERSISTENCE=true
VITE_AUTO_START_SENTIMENT_SYNC=false
```

#### Production Mode
```env
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DATA_PERSISTENCE=true
VITE_AUTO_START_SENTIMENT_SYNC=true
VITE_SENTIMENT_SYNC_INTERVAL_MINUTES=60
```

---

## Stripe Payment Integration

### Setup Stripe for Subscriptions

#### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Complete account setup
3. Verify your business information

#### 2. Get API Keys
1. Go to Developers > API Keys
2. Copy **Publishable key** (starts with `pk_`)
3. Add to `.env`: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`

**Note:** Use test keys (`pk_test_`) for development

#### 3. Create Payment Links

For each subscription tier:

1. Go to Payment Links in Stripe Dashboard
2. Click "Create payment link"
3. Set up product/pricing:
   - **Basic/Monthly**: $29/month
   - **Premium/Yearly**: $290/year (save 17%)
   - **Pro**: Custom pricing
   - **Enterprise**: Contact sales

4. Copy the payment link URL
5. Add to `.env`:
```env
VITE_STRIPE_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_YEARLY_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_PRO_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_ENTERPRISE_PAYMENT_LINK=https://buy.stripe.com/...
```

#### 4. Configure Webhooks (Optional)

For advanced features (auto-provisioning, cancellation handling):

1. Go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret
5. Add to Supabase Edge Function environment

---

## Zerodha Integration (Indian Market)

### Setup Zerodha Kite Connect

**Requirements:**
- Active Zerodha trading account
- Kite Connect subscription (₹2000/month)

#### Steps:

1. **Subscribe to Kite Connect**
   - Go to [Kite Connect](https://kite.trade/)
   - Subscribe to API access
   - Pay ₹2000/month subscription

2. **Create Kite App**
   - Log in to [Kite Connect Dashboard](https://developers.kite.trade/)
   - Create new app
   - Get API Key and API Secret

3. **Generate Access Token**
   - Use Zerodha's authentication flow
   - Store access token securely
   - Token expires daily, needs refresh

4. **Configure Environment**
```env
VITE_ZERODHA_API_KEY=your_api_key
VITE_ZERODHA_API_SECRET=your_api_secret
VITE_ZERODHA_ACCESS_TOKEN=your_access_token
VITE_DEFAULT_MARKET=IN
```

---

## Community Integrations

### Slack Integration
```env
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**Setup:**
1. Go to [Slack API](https://api.slack.com/messaging/webhooks)
2. Create incoming webhook
3. Select channel for alerts
4. Copy webhook URL

### Discord Integration
```env
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Setup:**
1. Open Discord server
2. Server Settings > Integrations > Webhooks
3. Create webhook
4. Copy URL

### Telegram Integration
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
```

**Setup:**
1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get bot token
3. Add bot to channel/group
4. Get chat ID using bot API

---

## Deployment Guide

### Deploy to Netlify

1. **Connect Repository**
   ```bash
   netlify login
   netlify init
   ```

2. **Set Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add all variables from `.env`
   - Use production API keys

3. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   # ... add all other variables
   ```

### Deploy to Railway

1. **Create Railway Account**
   - Sign up at [Railway.app](https://railway.app)

2. **Connect Repository**
   - New Project > Deploy from GitHub

3. **Add Environment Variables**
   - Project > Variables
   - Paste all variables from `.env`

4. **Deploy**
   - Automatic deployment on git push

---

## Troubleshooting

### Common Issues

#### 1. "Supabase client failed to initialize"
**Solution:**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Ensure keys don't have extra spaces
- Verify project is active in Supabase dashboard

#### 2. "API rate limit exceeded"
**Solution:**
- Upgrade API plan (Polygon, News API)
- Enable `VITE_ENABLE_MOCK_DATA=true` as fallback
- Increase update intervals

#### 3. "Sentiment analysis not working"
**Solution:**
- Verify all sentiment API keys are set
- Check `VITE_ENABLE_REAL_TIME_DATA=true`
- Test each API individually in browser console
- Check API quotas in provider dashboards

#### 4. "No options data loading"
**Solution:**
- Set `VITE_ENABLE_MOCK_DATA=true` for testing
- Check Polygon API key is valid
- Verify `VITE_ENABLE_REAL_TIME_DATA=true`
- Check browser console for errors

#### 5. "Stripe checkout not working"
**Solution:**
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Ensure using correct key (test vs live)
- Check payment links are active in Stripe
- Test in incognito mode (clear cache)

#### 6. "CORS errors with APIs"
**Solution:**
- Some APIs require backend proxy
- Use Supabase Edge Functions for API calls
- Check API provider CORS settings

### Debug Mode

Enable detailed logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

View environment:
```javascript
// In browser console
console.log('Environment:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  supabaseConfigured: !!import.meta.env.VITE_SUPABASE_URL,
  polygonConfigured: !!import.meta.env.VITE_POLYGON_API_KEY
})
```

### Getting Help

1. **Check Browser Console**
   - F12 > Console tab
   - Look for red errors

2. **Check Network Tab**
   - F12 > Network tab
   - Filter by "XHR" or "Fetch"
   - Look for failed requests (red)

3. **Check API Dashboards**
   - Verify API usage and limits
   - Check for service outages
   - Review billing status

4. **Review Documentation**
   - [Supabase Docs](https://supabase.com/docs)
   - [Polygon.io Docs](https://polygon.io/docs)
   - [Stripe Docs](https://stripe.com/docs)

---

## Production Checklist

Before deploying to production:

- [ ] All required API keys are set
- [ ] Using production API keys (not test keys)
- [ ] Stripe is in live mode
- [ ] Environment variables set in hosting platform
- [ ] SSL certificate is active (HTTPS)
- [ ] CORS is properly configured
- [ ] API rate limits are appropriate for traffic
- [ ] Billing alerts are set up
- [ ] Error monitoring is configured
- [ ] Backup strategy is in place
- [ ] RLS policies are enabled in Supabase
- [ ] Test all features in production environment
- [ ] Monitor API usage after launch

---

## Cost Estimation

### Minimal Setup (Development)
- Supabase: Free
- Polygon: Free tier or $29/mo
- **Total: $0-29/month**

### Full Features (Production)
- Supabase: Free to $25/mo
- Polygon: $99/mo (Developer plan)
- News API: $0-79/mo
- HuggingFace: $0-9/mo
- Stripe: 2.9% + $0.30 per transaction
- Hosting: $0-20/mo (Netlify/Vercel)
- **Total: ~$150-250/month + transaction fees**

### Enterprise Setup
- All premium API tiers
- Zerodha Kite Connect: ₹2000/mo (~$24)
- Higher Supabase tier
- Custom hosting
- **Total: $500-1000/month**

---

## Next Steps

1. ✅ Complete basic setup
2. ✅ Test with mock data
3. ✅ Add real API keys
4. ✅ Configure sentiment analysis
5. ✅ Test all features
6. ✅ Set up payments (if needed)
7. ✅ Deploy to production
8. ✅ Monitor and optimize

**Happy trading! 📈**
