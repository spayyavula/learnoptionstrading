# API Keys Quick Reference

## Priority Matrix for Setup

### 🔴 CRITICAL (Must Have)
**Application will NOT work without these**

| Service | Variable | Purpose | Cost | Link |
|---------|----------|---------|------|------|
| Supabase | `VITE_SUPABASE_URL` | Database & Auth | Free | [Get Key](https://app.supabase.com) |
| Supabase | `VITE_SUPABASE_ANON_KEY` | Database Access | Free | [Get Key](https://app.supabase.com) |
| Polygon.io | `VITE_POLYGON_API_KEY` | Market Data | Free-$99/mo | [Get Key](https://polygon.io/dashboard/signup) |

**Quick Setup:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_POLYGON_API_KEY=your_key_here
```

---

### 🟡 HIGH PRIORITY (Recommended)
**Enables core features including sentiment analysis**

| Service | Variable | Purpose | Free Tier | Link |
|---------|----------|---------|-----------|------|
| News API | `VITE_NEWS_API_KEY` | News for Sentiment | 100/day | [Get Key](https://newsapi.org/register) |
| HuggingFace | `VITE_HUGGINGFACE_API_KEY` | AI Sentiment | Yes | [Get Key](https://huggingface.co/settings/tokens) |
| Alpha Vantage | `VITE_ALPHA_VANTAGE_API_KEY` | Market Data | 25/day | [Get Key](https://www.alphavantage.co/support/#api-key) |

**Sentiment Analysis Setup:**
```env
VITE_NEWS_API_KEY=your_news_key
VITE_HUGGINGFACE_API_KEY=hf_...
VITE_ALPHA_VANTAGE_API_KEY=your_av_key
VITE_ENABLE_REAL_TIME_DATA=true
```

**What You Get:**
- ✅ Real-time news sentiment analysis
- ✅ AI-powered FinBERT sentiment scores
- ✅ Trending stocks with bullish/bearish indicators
- ✅ Historical sentiment trends
- ✅ News article summaries

---

### 🟢 MEDIUM PRIORITY (Enhanced Features)

| Service | Variable | Purpose | Free Tier | Link |
|---------|----------|---------|-----------|------|
| Finnhub | `VITE_FINNHUB_API_KEY` | Alt News Source | 60/min | [Get Key](https://finnhub.io/register) |
| FMP | `VITE_FINANCIAL_MODELING_PREP_API_KEY` | Analyst Data | 250/day | [Get Key](https://site.financialmodelingprep.com/register) |

---

### 🔵 LOW PRIORITY (Optional)

#### Payments
| Service | Variable | Purpose | Cost | Link |
|---------|----------|---------|------|------|
| Stripe | `VITE_STRIPE_PUBLISHABLE_KEY` | Subscriptions | 2.9% + $0.30 | [Get Key](https://dashboard.stripe.com/apikeys) |

#### Indian Market
| Service | Variable | Purpose | Cost | Link |
|---------|----------|---------|------|------|
| Zerodha | `VITE_ZERODHA_API_KEY` | NSE/BSE Trading | ₹2000/mo | [Get Key](https://kite.trade/) |

#### Community
| Service | Variable | Purpose | Cost | Link |
|---------|----------|---------|------|------|
| Slack | `VITE_SLACK_WEBHOOK_URL` | Trade Alerts | Free | [Get Webhook](https://api.slack.com/messaging/webhooks) |
| Discord | `VITE_DISCORD_WEBHOOK_URL` | Community | Free | Server Settings |
| Telegram | `VITE_TELEGRAM_BOT_TOKEN` | Bot Alerts | Free | [@BotFather](https://t.me/BotFather) |

---

## Quick Setup Paths

### Path 1: Basic Development (5 minutes)
```env
# Copy .env.example to .env
# Set these 3 variables:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_ENABLE_MOCK_DATA=true

# Start: npm run dev
```
**Result:** App works with mock data ✅

---

### Path 2: Real Market Data (15 minutes)
```env
# Add to Path 1:
VITE_POLYGON_API_KEY=your_polygon_key
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
```
**Result:** Real options chains and prices ✅

---

### Path 3: Full Sentiment Analysis (30 minutes)
```env
# Add to Path 2:
VITE_NEWS_API_KEY=your_news_key
VITE_HUGGINGFACE_API_KEY=hf_your_token
VITE_ALPHA_VANTAGE_API_KEY=your_av_key
```
**Result:** Complete sentiment analysis + AI insights ✅

---

### Path 4: Production Ready (45 minutes)
```env
# Add to Path 3:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_MONTHLY_PAYMENT_LINK=https://buy.stripe.com/...
VITE_STRIPE_YEARLY_PAYMENT_LINK=https://buy.stripe.com/...
VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_FINANCIAL_MODELING_PREP_API_KEY=your_fmp_key
```
**Result:** Full production features ✅

---

## Cost Calculator

### Free Tier (Development)
```
Supabase:      $0
Polygon:       $0 (5 calls/min, delayed)
News API:      $0 (100/day)
HuggingFace:   $0 (rate limited)
Alpha Vantage: $0 (25/day)
─────────────────
Total:         $0/month
```

### Starter (Small Production)
```
Supabase:      $0 (Free tier)
Polygon:       $29 (100 calls/min, real-time)
News API:      $0 (100/day sufficient)
HuggingFace:   $0 (rate limited)
Alpha Vantage: $0 (25/day sufficient)
Netlify:       $0 (Free tier)
─────────────────
Total:         $29/month
```

### Professional (Full Production)
```
Supabase:      $25 (Pro tier)
Polygon:       $99 (1000 calls/min)
News API:      $79 (10k requests/month)
HuggingFace:   $9 (Pro tier)
Alpha Vantage: $0 (or $49 for more)
Finnhub:       $0 (Free tier OK)
FMP:           $0 (Free tier OK)
Netlify:       $19 (Pro tier)
Stripe:        2.9% + $0.30 per transaction
─────────────────
Total:         ~$231/month + transaction fees
```

---

## Feature Availability by Setup Level

| Feature | Path 1 | Path 2 | Path 3 | Path 4 |
|---------|--------|--------|--------|--------|
| Options Trading | Mock | ✅ | ✅ | ✅ |
| Real-time Prices | ❌ | ✅ | ✅ | ✅ |
| Options Chains | Mock | ✅ | ✅ | ✅ |
| Greeks Calculation | ✅ | ✅ | ✅ | ✅ |
| Strategy Builder | ✅ | ✅ | ✅ | ✅ |
| News Feed | ❌ | ❌ | ✅ | ✅ |
| Sentiment Analysis | ❌ | ❌ | ✅ | ✅ |
| AI Insights | ❌ | ❌ | ✅ | ✅ |
| Analyst Ratings | ❌ | ❌ | ❌ | ✅ |
| Payments | ❌ | ❌ | ❌ | ✅ |

---

## Testing Your Setup

### 1. Test Supabase Connection
```javascript
// Browser console:
const { data, error } = await supabase.from('users').select('count')
console.log(data, error)
```

### 2. Test Polygon API
```bash
curl "https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=YOUR_KEY"
```

### 3. Test News API
```bash
curl "https://newsapi.org/v2/everything?q=apple&apiKey=YOUR_KEY"
```

### 4. Test HuggingFace
```bash
curl https://api-inference.huggingface.co/models/ProsusAI/finbert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"inputs": "Stock market rallies on strong earnings"}'
```

---

## Getting API Keys (Step-by-Step)

### Supabase (2 minutes)
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for project to initialize
5. Go to Settings > API
6. Copy URL and anon key

### Polygon.io (3 minutes)
1. Go to https://polygon.io/dashboard/signup
2. Sign up with email
3. Verify email
4. Go to Dashboard
5. Copy API key from "API Keys" section

### News API (1 minute)
1. Go to https://newsapi.org/register
2. Enter email and password
3. Verify email
4. Copy API key from account page

### HuggingFace (2 minutes)
1. Go to https://huggingface.co/join
2. Sign up with email or GitHub
3. Go to Settings > Access Tokens
4. Click "New token"
5. Name it "Options Trading App"
6. Select "Read" permission
7. Copy token

### Alpha Vantage (1 minute)
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter email
3. Check inbox
4. Copy key from email
5. That's it - instant API key!

---

## Common Errors & Quick Fixes

### Error: "Supabase client initialization failed"
```env
# Check these are set correctly:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Should start with "eyJ"
```

### Error: "API key invalid" (Polygon)
```env
# Verify key format:
VITE_POLYGON_API_KEY=bfoANE_zQEfVwbTdBDZJbrUX9SzqTEPV  # Example format
# No quotes, no spaces
```

### Error: "Rate limit exceeded"
```env
# Solution 1: Enable mock data
VITE_ENABLE_MOCK_DATA=true

# Solution 2: Increase intervals
VITE_OPTIONS_UPDATE_INTERVAL=10000  # Update every 10 seconds
```

### Error: "Sentiment analysis not working"
```env
# Ensure all 3 keys are set:
VITE_NEWS_API_KEY=xxx           # ✅ Check
VITE_HUGGINGFACE_API_KEY=hf_xxx # ✅ Check - must start with "hf_"
VITE_ALPHA_VANTAGE_API_KEY=xxx  # ✅ Check

# Enable real-time data:
VITE_ENABLE_REAL_TIME_DATA=true # ✅ Must be true
```

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Polygon Docs:** https://polygon.io/docs
- **News API Docs:** https://newsapi.org/docs
- **HuggingFace Docs:** https://huggingface.co/docs
- **Stripe Docs:** https://stripe.com/docs

---

## Recommended Setup Order

1. ✅ **Supabase** (CRITICAL - 2 min)
2. ✅ **Polygon** (CRITICAL - 3 min)
3. ✅ **News API** (HIGH - 1 min)
4. ✅ **HuggingFace** (HIGH - 2 min)
5. ✅ **Alpha Vantage** (HIGH - 1 min)
6. ⚪ **FMP** (MEDIUM - 2 min)
7. ⚪ **Finnhub** (MEDIUM - 2 min)
8. ⚪ **Stripe** (LOW - 10 min)
9. ⚪ **Community APIs** (LOW - 5 min each)

**Total time for full setup: ~30-45 minutes**

---

## Pro Tips

💡 **Tip 1:** Start with mock data, add real APIs one at a time
💡 **Tip 2:** Use test keys in development, live keys in production
💡 **Tip 3:** Set up billing alerts for paid APIs
💡 **Tip 4:** Monitor API usage in provider dashboards
💡 **Tip 5:** Keep API keys in password manager
💡 **Tip 6:** Rotate keys every 90 days for security
💡 **Tip 7:** Never commit .env file to Git (it's in .gitignore)

---

**Ready to trade! 🚀**
