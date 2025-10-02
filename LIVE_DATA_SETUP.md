# Live Options Data Setup Guide

This guide explains how to configure your application to fetch live options chain data from Polygon.io.

## Current Status

Your application is currently showing **demo data** because no Polygon API key is configured. The demo data is automatically generated to help you explore the features and interface.

## Why You Need a Polygon API Key

To access real-time and historical options market data, you need a Polygon.io API key. Polygon provides comprehensive market data including:

- Real-time options quotes (bid, ask, last price)
- Options Greeks (Delta, Gamma, Theta, Vega, Rho)
- Volume and Open Interest data
- Implied Volatility calculations
- Multiple expiration dates and strike prices

## How to Get Started

### 1. Sign Up for Polygon.io

Visit [https://polygon.io/dashboard/signup](https://polygon.io/dashboard/signup) and create a free account.

**Free Tier Includes:**
- 5 API calls per minute
- Basic stocks and options data
- Perfect for development and testing

**Paid Tiers Available:**
- Higher rate limits
- Real-time data access
- Advanced features

### 2. Get Your API Key

After signing up:
1. Log in to your Polygon dashboard
2. Navigate to the "API Keys" section
3. Copy your API key

### 3. Configure Your Environment

Open the `.env` file in your project root and add your API key:

```bash
# Uncomment and replace with your actual API key
VITE_POLYGON_API_KEY=your_actual_api_key_here
```

**Example:**
```bash
VITE_POLYGON_API_KEY=abc123XYZ456def789
```

### 4. Restart the Development Server

After adding your API key, restart the development server:

```bash
# Stop the current server (Ctrl+C or Cmd+C)
# Then restart
npm run dev
```

### 5. Sync Live Data

Once configured:

1. The "Demo Data Only" badge will change to "Live Data Available"
2. The "Sync Data" button will become enabled
3. Click "Sync Data" to fetch live options data from Polygon
4. Data will be stored in your Supabase database for fast access

## What Happens After Configuration

### Data Flow

1. **First Sync**: When you click "Sync Data", the app fetches:
   - All available options contracts for the selected ticker
   - Contract details (strikes, expiration dates)
   - Live market data (quotes, volume, Greeks)
   - Data is stored in Supabase for caching

2. **Subsequent Loads**:
   - Data is loaded from Supabase (fast)
   - Click "Sync Data" to refresh with latest market data
   - Real-time updates via WebSocket (when available)

3. **Automatic Features**:
   - Underlying price fetching
   - Options chain categorization (0DTE, Weekly, Monthly, LEAPS)
   - Greeks calculations
   - Volume and Open Interest tracking

## Database Tables

Your Supabase database includes these tables for options data:

- **liquid_tickers**: Supported tickers and their metadata
- **options_contracts_live**: Live options contract data
- **options_expiries**: Expiration dates with categorization

## Rate Limits

**Free Tier:** 5 calls per minute
- Be mindful when syncing data
- Data is cached in Supabase to minimize API calls
- Consider upgrading for production use

## Troubleshooting

### "Demo Data Only" Still Shows

1. Verify your API key is correct
2. Ensure you restarted the dev server
3. Check browser console for error messages
4. Verify the `.env` file is in the project root

### Sync Button Disabled

- Make sure API key is configured
- Check the status message in the demo data notice
- Verify network connectivity

### No Data After Sync

1. Check browser console for errors
2. Verify Supabase connection
3. Test API key at [https://polygon.io/dashboard](https://polygon.io/dashboard)
4. Check rate limit status

## Need Help?

- **Polygon Documentation**: [https://polygon.io/docs](https://polygon.io/docs)
- **Polygon Support**: Available through their dashboard
- **Project Issues**: Check the GitHub issues page

## Important Notes

- Keep your API key secure and never commit it to version control
- The `.env` file is gitignored by default
- Consider environment-specific keys for development vs production
- Monitor your API usage in the Polygon dashboard

---

**Ready to get started?** Sign up at [polygon.io](https://polygon.io/dashboard/signup) and add your API key to the `.env` file!
