# Enhanced Options Chain Guide

## Overview

The enhanced options chain provides a professional, visually appealing interface for viewing real-time options data across multiple liquid tickers with advanced filtering and categorization.

## Features

### 1. Multi-Ticker Support

The options chain now supports multiple liquid options tickers including:

- **Indices**: SPY, SPX, QQQ, IWM, DIA
- **Tech Giants**: AAPL, MSFT, NVDA, GOOGL, META, AMZN
- **Popular Stocks**: TSLA

Each ticker displays:
- Current underlying price
- Average daily volume
- Average open interest
- Real-time updates via WebSocket

### 2. Expiry Type Categorization

Options are automatically categorized by expiry type:

- **0DTE**: Options expiring today (shown in red)
- **Daily**: Options expiring within 3 days (shown in orange)
- **Weekly**: Options expiring within 7 days (shown in yellow)
- **Monthly**: Standard third-Friday monthly expiries (shown in green)
- **Quarterly**: Options 60-120 days out (shown in blue)
- **LEAPS**: Long-term options over 365 days (shown in purple)

### 3. Visual Enhancements

#### Color Coding
- **ITM Calls**: Light green background with dark green text
- **OTM Calls**: White background
- **ITM Puts**: Light red background with dark red text
- **OTM Puts**: White background
- **ATM Strikes**: Yellow highlight

#### Volume Visualization
- Volume bars show relative trading activity
- Green bars for call volume
- Red bars for put volume
- Helps identify liquid strikes at a glance

#### Expiry Cards
- Each expiry shown as a card with:
  - Date and expiry type badge
  - Days to expiry (DTE)
  - Total volume and open interest
  - Call/Put ratio visualization

### 4. Advanced Filtering

#### Strike Range
- Automatically centers on ATM strikes
- Adjustable min/max strike prices
- Smart defaults based on underlying price

#### Volume Filter
- Filter out low-volume contracts
- Set minimum volume threshold
- Focus on liquid options

#### Sorting Options
- Sort by Strike (default)
- Sort by Volume
- Sort by Open Interest
- Sort by IV
- Sort by Delta
- Ascending or descending order

### 5. Real-Time Data

#### WebSocket Integration
- Live price updates for selected tickers
- Real-time quote and trade data
- Automatic reconnection on disconnect

#### Data Sync
- One-click data synchronization
- Fetches latest contracts from Polygon API
- Updates Supabase database
- Recalculates Greeks and metrics

## Usage

### Getting Started

1. **Select a Ticker**: Use the dropdown at the top to choose from available liquid options tickers
2. **Choose Expiry Type**: Click on the expiry type tabs (0DTE, Weekly, Monthly, etc.)
3. **Select Specific Expiry**: Choose from the expiry cards showing detailed metrics
4. **Adjust Filters**: Use the controls to filter by volume, strike range, and sort order

### Data Synchronization

Click the "Sync Data" button to:
- Fetch latest options contracts from Polygon API
- Update pricing and Greeks
- Refresh volume and open interest
- Categorize new expiries

This process may take 30-60 seconds depending on the number of contracts.

### Reading the Chain

The options chain displays calls on the left and puts on the right, with the strike price in the center:

```
CALLS                           STRIKE                              PUTS
Bid | Ask | Last | Vol | OI | IV | Price | IV | OI | Vol | Last | Ask | Bid
```

#### Key Metrics

- **Bid/Ask**: Current bid and ask prices
- **Last**: Last traded price
- **Volume**: Number of contracts traded today
- **OI**: Open Interest (outstanding contracts)
- **IV**: Implied Volatility (as percentage)

### Tips for Best Results

1. **Start with Weekly Options**: They typically have the highest volume and tightest spreads
2. **Check Volume Bars**: Look for strikes with substantial green or red bars indicating high activity
3. **Use 0DTE for Day Trading**: Filter by 0DTE type for same-day expiration options
4. **Monitor Multiple Tickers**: Switch between tickers to find the best opportunities
5. **Set Minimum Volume**: Filter out illiquid strikes by setting a minimum volume threshold (e.g., 100)

## Database Schema

### Tables Created

#### `liquid_tickers`
Stores metadata for supported tickers including current price, volume metrics, and liquidity indicators.

#### `options_contracts_live`
Stores real-time options contract data including pricing, Greeks, volume, and open interest.

#### `options_expiries`
Stores expiration dates with automatic categorization and aggregate metrics.

### Data Updates

- **Real-time**: WebSocket updates for quotes and trades
- **On-demand**: Manual sync via "Sync Data" button
- **Automated**: Can be configured via cron jobs or scheduled functions

## Technical Details

### Services

- **liveOptionsDataService**: Handles all data fetching, WebSocket connections, and database operations
- **Polygon API Integration**: Fetches contracts, snapshots, and underlying prices
- **Supabase**: Stores and retrieves options data with RLS policies

### Components

- **EnhancedOptionsChain**: Main component orchestrating the entire chain view
- **TickerSelector**: Dropdown for selecting tickers with liquidity metrics
- **ExpiryFilter**: Tabs and cards for filtering by expiry type and date

### Performance

- Virtualized scrolling for large chains (future enhancement)
- Efficient indexing on database queries
- Batch upserts for bulk data operations
- WebSocket connection pooling

## Future Enhancements

- Heat maps for volume and open interest
- Greeks sensitivity analysis
- Strategy builder integration
- Max pain calculations
- Unusual options activity alerts
- Historical IV comparison charts
