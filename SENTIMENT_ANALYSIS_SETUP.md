# News Feed & FinBERT Sentiment Analysis for Liquid Options

## Overview

A comprehensive sentiment analysis system has been implemented for your liquid options trading platform. This system integrates multiple news feed providers with FinBERT (Financial BERT), a state-of-the-art NLP model specifically trained on financial text, to provide accurate sentiment analysis for options trading decisions.

## Features Implemented

### 1. Database Schema
- **news_articles**: Stores news articles from multiple providers with deduplication
- **sentiment_analysis**: Stores FinBERT sentiment analysis results with confidence scores
- **options_sentiment_scores**: Aggregated sentiment scores mapped to specific liquid options
- **sentiment_trends**: Historical sentiment trends for charting and analysis
- **news_feed_sources**: Tracks API provider health and statistics

### 2. News Feed Integration
- **Multi-Provider Support**: Polygon.io, Alpha Vantage, Finnhub, NewsAPI
- **Automatic Fallback**: If one provider fails, automatically tries the next
- **Smart Deduplication**: Prevents duplicate articles using URL-based matching
- **Relevance Scoring**: Calculates how relevant each article is to the ticker
- **Automatic Storage**: All articles stored in Supabase for historical analysis

### 3. FinBERT Sentiment Analysis
- **Hugging Face Integration**: Uses ProsusAI/finbert model via Hugging Face API
- **Financial Context**: Model trained specifically on financial news and documents
- **Confidence Scores**: Provides probability distributions for positive/negative/neutral
- **Intelligent Fallback**: Keyword-based analysis when API unavailable
- **Batch Processing**: Efficiently processes multiple articles with rate limiting

### 4. Options Sentiment Mapping
- **Liquid Options Focus**: Automatically tracks SPY, QQQ, AAPL, TSLA, NVDA
- **Sentiment Aggregation**: Combines multiple news articles into single sentiment score
- **Momentum Tracking**: Calculates rate of sentiment change over time
- **Trend Detection**: Identifies rising, falling, or stable sentiment patterns
- **High-Impact Detection**: Flags articles with high confidence and strong sentiment

### 5. User Interface Components

#### NewsSentimentDashboard
- Displays recent news articles with sentiment scores
- Real-time FinBERT analysis with "Analyze All" button
- Filter by sentiment (positive/negative/neutral/all)
- Shows aggregate statistics (overall score, distribution)
- Article cards with source, timestamp, and sentiment details

#### OptionSentimentIndicator
- Compact or full view modes
- Real-time sentiment score with color coding
- Trend indicators (rising/falling/stable)
- News count and distribution (positive/negative/neutral)
- Actionable recommendations based on sentiment

#### SentimentTrendChart
- Historical sentiment visualization using Recharts
- Line or area chart views
- Intraday and multi-day trends
- Volume and momentum indicators
- Interactive tooltips with detailed information

### 6. Background Sync Scheduler
- Automatic periodic syncing of news and sentiment
- Configurable sync intervals (default: 1 hour)
- Manual sync capability for specific tickers
- Error handling and retry logic
- Status tracking and monitoring

## Environment Variables

Add these variables to your `.env` file:

```bash
# News Feed APIs (at least one required for real data)
VITE_POLYGON_API_KEY=your_polygon_api_key
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
VITE_FINNHUB_API_KEY=your_finnhub_key
VITE_NEWS_API_KEY=your_newsapi_key

# FinBERT Sentiment Analysis
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key

# Auto-sync Configuration (optional)
VITE_AUTO_START_SENTIMENT_SYNC=true
VITE_SENTIMENT_SYNC_INTERVAL_MINUTES=60
```

## API Keys Setup

### 1. News Feed Providers

#### Polygon.io (Recommended - You already have this)
- Free tier: 5 API calls/minute
- Already configured in your project
- Provides comprehensive financial news

#### Alpha Vantage
- Sign up: https://www.alphavantage.co/support/#api-key
- Free tier: 25 API calls/day
- Includes sentiment scores

#### Finnhub
- Sign up: https://finnhub.io/register
- Free tier: 60 API calls/minute
- Excellent coverage of company news

#### NewsAPI
- Sign up: https://newsapi.org/register
- Free tier: 100 requests/day
- Good for general financial news

### 2. Hugging Face (FinBERT)

To get your Hugging Face API key for FinBERT:

1. Go to https://huggingface.co/join
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "Read" access
5. Copy the token and add it to your `.env` file as `VITE_HUGGINGFACE_API_KEY`

**Free Tier Limits:**
- 1,000 API calls per month for free
- Rate limit: ~1-2 requests per second
- Model used: ProsusAI/finbert

**Fallback**: If Hugging Face API is not configured or unavailable, the system automatically falls back to keyword-based sentiment analysis using financial keywords.

## Usage

### Accessing Sentiment Analysis

Navigate to: `/app/sentiment`

This page provides:
- Ticker selection for all liquid options (SPY, QQQ, AAPL, TSLA, NVDA)
- Real-time sentiment dashboard with news articles
- Historical sentiment trends with charts
- Option-specific sentiment indicators
- Manual sync controls
- Auto-sync scheduler toggle

### Integrating Sentiment into Trading

You can integrate sentiment indicators into any component:

```typescript
import { OptionSentimentIndicator } from '../components/OptionSentimentIndicator'

// Compact view (small badge)
<OptionSentimentIndicator
  underlyingTicker="SPY"
  optionTicker="SPY240315C00580000"
  compact={true}
/>

// Full view (detailed card)
<OptionSentimentIndicator
  underlyingTicker="SPY"
  optionTicker="SPY240315C00580000"
/>
```

### Programmatic Access

You can access sentiment data programmatically:

```typescript
import { OptionsSentimentService } from './services/optionsSentimentService'

// Get sentiment for specific option
const sentiment = await OptionsSentimentService.getSentimentScore('SPY240315C00580000')

// Get sentiment history
const history = await OptionsSentimentService.getSentimentScoresByTicker('SPY', 30)

// Get sentiment trends
const trends = await OptionsSentimentService.getSentimentTrends('SPY', 7)

// Manual sync for specific ticker
await SentimentSyncScheduler.syncSpecificTicker('SPY')

// Sync all liquid options
await OptionsSentimentService.syncAllSentiments()
```

## How Sentiment Scores Work

### Sentiment Scale
- **-100 to -50**: Very Negative (Strong bearish sentiment)
- **-50 to -15**: Negative (Moderately bearish)
- **-15 to +15**: Neutral (No clear direction)
- **+15 to +50**: Positive (Moderately bullish)
- **+50 to +100**: Very Positive (Strong bullish sentiment)

### FinBERT Analysis Process

1. **Text Extraction**: Headline and summary extracted from news article
2. **Model Inference**: FinBERT analyzes text and returns probabilities
3. **Score Calculation**: `score = positive_probability - negative_probability`
4. **Confidence**: Highest probability among positive/negative/neutral
5. **Label**: Category with highest probability (positive/negative/neutral)

### Aggregation for Options

1. Fetch all news for underlying ticker (last 7 days)
2. Analyze each article with FinBERT
3. Calculate weighted average based on confidence scores
4. Compute momentum (change from previous day)
5. Determine trend direction (rising/falling/stable)
6. Identify high-impact news (confidence > 80%, |score| > 50)

## Trading Recommendations

The system provides actionable recommendations:

- **Strong Bullish**: Score > 50, Rising trend → Consider call options
- **Strong Bearish**: Score < -50, Falling trend → Consider put options
- **High Volatility**: |momentum| > 20 → Monitor for opportunities
- **Moderately Positive**: Score > 15, Not falling → Favor bullish strategies
- **Moderately Negative**: Score < -15, Not rising → Favor bearish strategies
- **Neutral**: -15 < score < 15 → Wait for clearer signals

## Performance Considerations

### Caching
- News articles cached in Supabase
- Sentiment analysis results cached per article
- Avoid re-analyzing same articles

### Rate Limiting
- Built-in delays between API calls
- Batch processing with configurable sizes
- Automatic provider rotation on failures

### Cost Management
- Free tiers sufficient for development
- Mock data available when APIs not configured
- Fallback sentiment analysis when FinBERT unavailable
- Configurable sync intervals to control API usage

## Database Queries

Access sentiment data directly:

```sql
-- Get latest sentiment for SPY
SELECT * FROM options_sentiment_scores
WHERE ticker = 'SPY'
ORDER BY date DESC
LIMIT 1;

-- Get news articles with positive sentiment
SELECT n.*, s.finbert_score, s.confidence
FROM news_articles n
JOIN sentiment_analysis s ON n.id = s.article_id
WHERE n.ticker = 'SPY'
  AND s.finbert_label = 'positive'
  AND s.confidence > 0.7
ORDER BY n.published_at DESC;

-- Get sentiment trend over time
SELECT date, hour, sentiment_score, volume
FROM sentiment_trends
WHERE ticker = 'SPY'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date, hour;
```

## Troubleshooting

### No News Appearing
1. Check API keys in `.env` file
2. Verify at least one news provider API key is valid
3. Check browser console for API errors
4. Try manual sync button
5. System will use mock data if all providers fail

### FinBERT Not Working
1. Verify Hugging Face API key is set
2. Check API quota hasn't been exceeded
3. System automatically falls back to keyword analysis
4. Check browser console for FinBERT API errors

### Sentiment Not Updating
1. Enable auto-sync in sentiment dashboard
2. Click "Sync Now" button for manual update
3. Check sentiment sync scheduler status
4. Verify news articles are being fetched

### Database Errors
1. Ensure Supabase connection is active
2. Check `.env` has correct Supabase credentials
3. Verify database migration was applied successfully
4. Check Supabase dashboard for RLS policy issues

## Future Enhancements

Potential improvements to consider:

1. **Social Media Sentiment**: Integrate Twitter/Reddit sentiment
2. **Intraday Updates**: Real-time news monitoring with webhooks
3. **Custom Alerts**: Notify users of significant sentiment changes
4. **Sentiment Comparison**: Compare sentiment across similar options
5. **Historical Backtesting**: Correlate sentiment with price movements
6. **Multi-Language Support**: Analyze news in multiple languages
7. **Sector Sentiment**: Aggregate sentiment by market sector
8. **Event Detection**: Automatically detect earnings, FDA approvals, etc.

## Resources

- **FinBERT Paper**: https://arxiv.org/abs/1908.10063
- **Hugging Face Model**: https://huggingface.co/ProsusAI/finbert
- **Polygon.io Docs**: https://polygon.io/docs
- **Alpha Vantage Docs**: https://www.alphavantage.co/documentation/
- **Finnhub Docs**: https://finnhub.io/docs/api
- **NewsAPI Docs**: https://newsapi.org/docs

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with mock data first (no API keys required)
4. Review Supabase logs for database issues
5. Check API provider status pages for outages
