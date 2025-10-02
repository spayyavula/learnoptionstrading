# Polygon API Real-Time Data Setup

## Overview
This document explains how to configure the application to fetch real-time options data from Polygon.io instead of using demo/mock data.

## What Was Changed

### 1. Environment Variables Added
The `.env` file has been updated with three critical environment variables:

```bash
# Polygon.io API Configuration
VITE_POLYGON_API_KEY=YOUR_POLYGON_API_KEY_HERE

# Feature Flags
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
```

### 2. How It Works

The application uses two services for options data:

#### `liveOptionsDataService.ts` (Primary - Used by EnhancedOptionsChain)
- Checks if `VITE_POLYGON_API_KEY` is set and not equal to `'demo_api_key'`
- If valid API key exists, enables the "Sync Data" button
- Fetches real-time options data from Polygon.io API endpoints:
  - `/v3/reference/options/contracts` - Contract metadata
  - `/v3/snapshot/options/{ticker}` - Real-time quotes and Greeks
  - WebSocket connection for live streaming data
- Stores fetched data in Supabase tables for caching

#### `polygonService.ts` (Legacy - Used by some other components)
- Checks both `VITE_ENABLE_MOCK_DATA` and `VITE_ENABLE_REAL_TIME_DATA` flags
- Falls back to simulated data if flags are not properly set

## Required Action: Add Your Real API Key

**IMPORTANT:** You must replace the placeholder with your actual Polygon.io API key:

1. Open the `.env` file
2. Find this line:
   ```
   VITE_POLYGON_API_KEY=YOUR_POLYGON_API_KEY_HERE
   ```
3. Replace `YOUR_POLYGON_API_KEY_HERE` with your actual Polygon API key

Example:
```bash
VITE_POLYGON_API_KEY=abcdef123456789
```

## How to Use Real-Time Data

### Step 1: Configure Environment Variables
As described above, add your real API key to `.env`

### Step 2: Restart Development Server
After updating the `.env` file, you must restart the development server:
```bash
# Stop the current server (Ctrl+C if running)
# Then restart:
npm run dev
```

Vite only reads environment variables at startup, so changes require a restart.

### Step 3: Navigate to Options Chain
1. Open your browser to the running application
2. Navigate to the "Options Chain" page
3. You should see the options chain interface

### Step 4: Verify Real Data Mode
Look for these indicators that real data mode is active:

✅ **Mock Data Notice is Hidden**: If you see a yellow banner saying "Showing Demo Data", your API key is not properly configured

✅ **Sync Button is Enabled**: The "Sync Data" button in the top-right should be clickable (not disabled)

✅ **API Status Check**: The service checks:
   - API key exists
   - API key is not 'demo_api_key'
   - If both conditions pass, real-time mode is enabled

### Step 5: Sync Live Data
1. Select a ticker (e.g., SPY, AAPL, TSLA)
2. Click the "↻ Sync Data" button
3. Wait for the sync to complete (may take 10-30 seconds depending on data volume)
4. The options chain will update with real market data from Polygon.io

## Database Storage

Real-time data is stored in three Supabase tables:

### `liquid_tickers`
- Stores available tickers and their current prices
- Updated when underlying prices are fetched

### `options_contracts_live`
- Stores all options contracts with live market data
- Includes: bid, ask, last, volume, open interest, IV, Greeks
- Updated via the sync operation

### `options_expiries`
- Stores expiration dates categorized by type (0DTE, Daily, Weekly, Monthly, Quarterly, LEAPS)
- Aggregates volume and open interest by expiry

## Polygon API Endpoints Used

### Contract Metadata
```
GET /v3/reference/options/contracts?underlying_ticker={ticker}&limit=1000&apiKey={key}
```
Returns contract specifications (strike, expiry, type)

### Real-Time Quotes & Greeks
```
GET /v3/snapshot/options/{ticker}?apiKey={key}
```
Returns current bid/ask, volume, open interest, IV, and Greeks

### Historical Stock Data
```
GET /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}?apiKey={key}
```
Returns historical price data for underlying assets

### WebSocket Stream (Optional)
```
wss://socket.polygon.io/options
```
Real-time streaming of quotes and trades

## Troubleshooting

### Issue: Still Seeing Demo Data Banner
**Solution:**
1. Verify your API key is in `.env` and not equal to 'YOUR_POLYGON_API_KEY_HERE'
2. Restart the development server
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for any API errors

### Issue: Sync Button is Disabled
**Solution:**
- The sync button is only enabled when a valid API key is detected
- Check that `VITE_POLYGON_API_KEY` is set in `.env`
- Ensure you restarted the dev server after updating `.env`

### Issue: API Returns 403 Forbidden
**Solution:**
- Your API key may be invalid or expired
- Check your Polygon.io dashboard to verify the key
- Ensure your account has access to options data endpoints
- Basic/Free tier keys may have limited access

### Issue: No Data After Sync
**Solution:**
1. Check browser console for error messages
2. Verify Supabase connection is working
3. Check that the ticker symbol is valid
4. Try with a highly liquid ticker like SPY first

### Issue: Rate Limit Errors
**Solution:**
- Polygon.io has rate limits based on your subscription tier
- Free tier: 5 requests per minute
- Wait between sync operations
- Consider upgrading your Polygon.io plan for higher limits

## API Key Subscription Tiers

Polygon.io offers different subscription tiers with varying data access:

- **Free Tier**: Limited to 5 API calls per minute, delayed data
- **Starter**: 100 calls/min, real-time data
- **Developer**: 300 calls/min, real-time data
- **Advanced**: Unlimited calls, real-time data, WebSocket access

Visit https://polygon.io/pricing to view current pricing and features.

## Verification Checklist

Use this checklist to verify your setup:

- [ ] `.env` file contains `VITE_POLYGON_API_KEY` with your real key
- [ ] `.env` file contains `VITE_ENABLE_REAL_TIME_DATA=true`
- [ ] `.env` file contains `VITE_ENABLE_MOCK_DATA=false`
- [ ] Development server has been restarted after `.env` changes
- [ ] Browser has been hard refreshed
- [ ] No yellow "Demo Data" banner is visible
- [ ] Sync button is enabled and clickable
- [ ] Clicking sync successfully fetches data from Polygon API
- [ ] Options chain displays real market data after sync

## Support

If you continue to experience issues:

1. Check the browser console for error messages
2. Verify your Polygon.io API key is active at https://polygon.io/dashboard
3. Review the Polygon.io API documentation: https://polygon.io/docs/options
4. Check Supabase logs for any database errors

## Summary

The application is now configured to fetch real-time options data from Polygon.io. Once you add your API key and restart the server, the Options Chain page will display live market data including bid/ask spreads, volume, open interest, implied volatility, and Greeks for all selected tickers and expiration dates.
