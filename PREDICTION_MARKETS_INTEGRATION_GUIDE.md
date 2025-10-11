# Prediction Markets (Kalshi) Integration Guide

## Overview

This guide provides comprehensive documentation for the Kalshi Prediction Markets integration in your options trading platform. The integration allows users to trade on real-world event outcomes through Kalshi's CFTC-regulated prediction markets exchange.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [Components](#components)
5. [Setup Process](#setup-process)
6. [API Integration](#api-integration)
7. [Trading Operations](#trading-operations)
8. [Security Considerations](#security-considerations)
9. [Important Limitations](#important-limitations)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The Prediction Markets integration follows a clean architecture pattern:

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
│  ┌───────────────────┐  ┌──────────────────────┐   │
│  │ Setup Wizard      │  │ Markets Dashboard     │   │
│  │ - Step 1: Intro   │  │ - Markets Browser     │   │
│  │ - Step 2: Keys    │  │ - Position Tracker    │   │
│  │ - Step 3: Verify  │  │ - Order Manager       │   │
│  └───────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│  ┌───────────────────┐  ┌──────────────────────┐   │
│  │ KalshiService     │  │ Data Sync Service     │   │
│  │ - Authentication  │  │ - Market Updates      │   │
│  │ - Market Data     │  │ - Portfolio Sync      │   │
│  │ - Trading Ops     │  │ - Price History       │   │
│  │ - Portfolio Mgmt  │  │ - Series Management   │   │
│  └───────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Data Layer                          │
│  ┌──────────────────────────────────────────────┐  │
│  │         Supabase PostgreSQL Database          │  │
│  │  - kalshi_credentials (encrypted)             │  │
│  │  - kalshi_account_info                        │  │
│  │  - prediction_markets                         │  │
│  │  - prediction_market_positions                │  │
│  │  - prediction_market_orders                   │  │
│  │  - prediction_market_trades                   │  │
│  │  - prediction_market_price_history            │  │
│  │  - prediction_markets_activity_log            │  │
│  │  - prediction_market_series                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Kalshi API                          │
│         https://trading-api.kalshi.com/v2            │
│         https://demo-api.kalshi.co/v2 (demo)         │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Created

#### 1. `kalshi_credentials`
Stores encrypted API credentials with AES-256-GCM encryption.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `api_key_encrypted` (text) - Encrypted API key (format: email:key)
- `encryption_iv` (text) - Initialization vector for decryption
- `environment` (text) - 'live' or 'demo'
- `is_active` (boolean)
- `last_validated_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**Unique Constraint:** `(user_id, environment)`

#### 2. `kalshi_account_info`
Account balance and portfolio information.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users, unique)
- `member_id` (text)
- `account_status` (text)
- `balance` (numeric)
- `available_balance` (numeric)
- `portfolio_value` (numeric)
- `total_pnl` (numeric)
- `last_synced_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

#### 3. `prediction_markets`
Available prediction market contracts.

**Columns:**
- `id` (uuid, primary key)
- `market_ticker` (text, unique) - Unique market identifier
- `market_title` (text) - Human-readable title
- `market_category` (text) - Category (politics, economics, sports, etc.)
- `series_ticker` (text) - Series group
- `event_ticker` (text) - Event identifier
- `description` (text) - Detailed description
- `status` (text) - active, closed, settled, expired
- `yes_bid`, `yes_ask`, `yes_price` (numeric) - YES side prices
- `no_bid`, `no_ask`, `no_price` (numeric) - NO side prices
- `volume`, `open_interest` (bigint) - Trading metrics
- `open_time`, `close_time`, `expiration_time` (timestamptz) - Time windows
- `settlement_value`, `settlement_date` (numeric, timestamptz) - Settlement info
- `floor_strike`, `cap_strike` (numeric) - Strike boundaries
- `metadata` (jsonb) - Additional market data
- `last_synced_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

#### 4. `prediction_market_positions`
User positions in prediction markets.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `market_ticker` (text, foreign key → prediction_markets)
- `position_side` (text) - 'yes' or 'no'
- `quantity` (integer) - Number of contracts
- `average_price` (numeric) - Average entry price
- `total_cost` (numeric) - Total capital invested
- `current_value`, `unrealized_pnl` (numeric) - Current metrics
- `realized_pnl` (numeric) - Realized gains/losses
- `opened_at`, `last_updated_at` (timestamptz)

**Unique Constraint:** `(user_id, market_ticker, position_side)`

#### 5. `prediction_market_orders`
Order history and tracking.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `kalshi_order_id` (text, unique) - Kalshi's order ID
- `market_ticker` (text, foreign key → prediction_markets)
- `order_type` (text) - 'market' or 'limit'
- `side` (text) - 'yes' or 'no'
- `action` (text) - 'buy' or 'sell'
- `quantity` (integer) - Contract quantity
- `limit_price` (numeric) - Limit price for limit orders
- `filled_quantity`, `remaining_quantity` (integer) - Fill status
- `average_fill_price` (numeric) - Average execution price
- `status` (text) - pending, open, partially_filled, filled, cancelled, rejected, expired
- `time_in_force` (text) - gtc, ioc, fok
- `client_order_id` (text) - Client-generated ID
- `error_message` (text) - Error details if rejected
- `submitted_at`, `filled_at`, `cancelled_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

#### 6. `prediction_market_trades`
Executed trade history (fills).

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `order_id` (uuid, foreign key → prediction_market_orders)
- `kalshi_trade_id` (text, unique)
- `market_ticker` (text, foreign key → prediction_markets)
- `side`, `action` (text) - Trade details
- `quantity` (integer) - Contracts executed
- `price` (numeric) - Execution price
- `total_value`, `fees` (numeric) - Trade cost
- `trade_timestamp` (timestamptz) - Execution time
- `created_at` (timestamptz)

#### 7. `prediction_market_price_history`
Historical price data for charting.

**Columns:**
- `id` (uuid, primary key)
- `market_ticker` (text, foreign key → prediction_markets)
- `yes_price`, `no_price` (numeric) - Historical prices
- `volume`, `open_interest` (bigint) - Historical metrics
- `timestamp` (timestamptz) - Data timestamp
- `created_at` (timestamptz)

#### 8. `prediction_markets_activity_log`
Audit trail for all activities.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `activity_type` (text) - Type of activity
- `market_ticker` (text) - Related market
- `environment` (text) - live or demo
- `metadata` (jsonb) - Activity details
- `created_at` (timestamptz)

#### 9. `prediction_market_series`
Market categories and series information.

**Columns:**
- `id` (uuid, primary key)
- `series_ticker` (text, unique) - Series identifier
- `title` (text) - Series name
- `category` (text) - Category
- `description` (text) - Series description
- `frequency` (text) - Update frequency
- `tags` (text[]) - Searchable tags
- `metadata` (jsonb) - Additional data
- `created_at`, `updated_at` (timestamptz)

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data (credentials, positions, orders, trades, activity)
- Public read access for market data (markets, series, price history)
- System can insert/update market data

---

## Service Layer

### KalshiService (`src/services/kalshiService.ts`)

Core service for all Kalshi API interactions.

#### Key Methods

**Credential Management:**
- `saveCredentials(userId, apiKey, environment)` - Encrypts and stores API key
- `deleteCredentials(userId, environment)` - Removes stored credentials
- `isConfigured(userId, environment)` - Checks if credentials exist

**Authentication:**
- `getAuthToken(userId, environment)` - Gets or refreshes Bearer token
- Token caching with 29-minute expiry (Kalshi tokens expire at 30 minutes)

**Account Management:**
- `getAccount(userId, environment)` - Fetches account balance and info
- `validateCredentials(userId, environment)` - Tests API connection

**Market Data:**
- `getMarkets(userId, environment, filters)` - Lists available markets with filtering
- `getMarket(userId, environment, ticker)` - Gets specific market details
- `getMarketOrderbook(userId, environment, ticker)` - Fetches orderbook depth
- `getSeries(userId, environment)` - Lists market series/categories

**Portfolio Management:**
- `getPositions(userId, environment)` - Retrieves user positions
- `syncPortfolio(userId, environment)` - Syncs account and positions

**Trading Operations:**
- `placeOrder(userId, environment, orderRequest)` - Places buy/sell order
- `getOrders(userId, environment, ticker?)` - Lists orders with optional filtering
- `cancelOrder(userId, environment, orderId)` - Cancels pending order

**Data Sync:**
- `syncMarkets(userId, environment)` - Syncs markets and series to database
- `logActivity(userId, activityType, environment, metadata)` - Logs user actions

#### Authentication Flow

1. User provides API key in format: `email:api-key`
2. Service encrypts and stores key in database
3. On API calls, service retrieves and decrypts key
4. Service uses email/key to authenticate and get Bearer token
5. Token cached for 29 minutes
6. All subsequent requests use Bearer token in Authorization header

---

## Components

### PredictionMarketsSetupWizard (`src/components/PredictionMarketsSetupWizard.tsx`)

3-step onboarding wizard for initial setup.

**Step 1: Introduction**
- Overview of prediction markets
- Prerequisites checklist
- Important disclaimers
- Risk warnings

**Step 2: API Credentials**
- Environment selection (Demo/Live)
- API key input with show/hide toggle
- Instructions for obtaining API keys
- Format validation

**Step 3: Verification**
- Credentials validation
- Account info display
- Connection confirmation
- Error handling

**Features:**
- Step-by-step progress indicator
- Real-time validation
- Secure credential handling
- User-friendly error messages

### PredictionMarkets Page (`src/pages/PredictionMarkets.tsx`)

Main dashboard for prediction markets trading.

**Features:**
- **Account Summary**: Balance, available funds, portfolio value, total P&L
- **Environment Toggle**: Switch between demo and live trading
- **Manual Sync**: Refresh data on-demand
- **Three Tabs**:
  1. **Markets**: Browse and filter available markets
  2. **Positions**: View open positions with P&L
  3. **Orders**: Manage active and historical orders

**Markets Tab:**
- Search by market name
- Filter by category
- Grid view with YES/NO prices
- Volume and open interest display
- Click to trade

**Positions Tab:**
- Position side (YES/NO) badges
- Quantity, average price, current value
- Unrealized P&L with color coding
- Real-time updates

**Orders Tab:**
- Complete order history
- Order status badges
- Cancel button for active orders
- Execution details

**Order Form Modal:**
- YES/NO side selection
- Buy/Sell action selection
- Market or Limit order types
- Quantity input
- Limit price input (for limit orders)
- Estimated cost and max payout calculation
- One-click order placement

---

## Setup Process

### For Users

1. **Create Kalshi Account**
   - Sign up at kalshi.com
   - Complete identity verification (US residents only)
   - Fund your account if using live mode

2. **Generate API Credentials**
   - Log in to Kalshi
   - Navigate to Settings → API Keys
   - Click "Generate New API Key"
   - Copy your API key (format: automatically includes email)
   - Store securely - cannot be recovered if lost

3. **Platform Setup**
   - Navigate to app → Prediction Markets
   - Click "Setup Prediction Markets"
   - Select environment (Demo for testing, Live for real trading)
   - Enter API key in format: `your-email@example.com:your-api-key`
   - Acknowledge that credentials will be verified
   - Complete verification

4. **Start Trading**
   - Browse markets by category or search
   - Click market to view details
   - Select YES or NO side
   - Choose Buy or Sell
   - Set quantity and price (if limit order)
   - Place order

### For Developers

1. **Environment Variables**
```bash
VITE_KALSHI_ENABLED=true
VITE_KALSHI_API_BASE_URL=https://trading-api.kalshi.com/trade-api/v2
VITE_KALSHI_DEMO_API_BASE_URL=https://demo-api.kalshi.co/trade-api/v2
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
```

2. **Database Migration**
```bash
# Migration file already created:
# supabase/migrations/20251011210000_create_prediction_markets_tables.sql
# Run via Supabase CLI or dashboard
```

3. **Integration Points**
- Added to App.tsx routing: `/app/prediction-markets`
- Added to Layout.tsx navigation under Trading section
- Lazy-loaded with retry logic
- Protected by authentication

---

## API Integration

### Base URLs
- **Production**: `https://trading-api.kalshi.com/trade-api/v2`
- **Demo**: `https://demo-api.kalshi.co/trade-api/v2`

### Authentication
```typescript
// Login to get token
POST /login
Body: { email: string, password: string }
Response: { token: string }

// Use token in subsequent requests
Headers: { Authorization: `Bearer ${token}` }
```

### Key Endpoints

**Markets:**
```typescript
GET /markets                         // List markets
GET /markets/:ticker                 // Get specific market
GET /markets/:ticker/orderbook       // Get orderbook
GET /series                          // List series
```

**Portfolio:**
```typescript
GET /portfolio/balance               // Get account balance
GET /portfolio/positions             // Get positions
GET /portfolio/orders                // List orders
POST /portfolio/orders               // Place order
DELETE /portfolio/orders/:id         // Cancel order
```

### Request/Response Examples

**Get Markets:**
```typescript
GET /markets?status=active&limit=50

Response: {
  markets: [
    {
      ticker: "INXD-24JAN31-T8500",
      title: "Will the S&P 500 close at or above 8500 on January 31?",
      category: "economics",
      status: "active",
      yes_price: 4500,  // Price in cents (45¢ = 45%)
      no_price: 5500,
      volume: 15000,
      open_interest: 50000,
      expiration_time: "2024-01-31T21:00:00Z"
    }
  ],
  cursor: "next_page_token"
}
```

**Place Order:**
```typescript
POST /portfolio/orders

Body: {
  ticker: "INXD-24JAN31-T8500",
  type: "limit",
  side: "yes",
  action: "buy",
  count: 10,
  yes_price: 4500,  // 45¢ per contract
  client_order_id: "PM_1234567890"
}

Response: {
  order_id: "kalshi_order_123",
  status: "open",
  filled_count: 0,
  remaining_count: 10
}
```

---

## Trading Operations

### Contract Mechanics

- Each contract pays $1.00 if event occurs, $0 if it doesn't
- Prices range from $0.01 to $0.99
- Price represents market's probability estimate (45¢ = 45% chance)
- Buying YES at 45¢ means max profit of 55¢, max loss of 45¢
- Buying NO at 55¢ means max profit of 45¢, max loss of 55¢

### Order Types

**Market Orders:**
- Execute immediately at best available price
- Use for urgent trades or highly liquid markets
- Risk: may execute at unfavorable price in thin markets

**Limit Orders:**
- Execute only at specified price or better
- Use for price control and queuing
- Good-til-cancelled (GTC) by default
- May not fill if market doesn't reach limit price

**Time in Force:**
- `gtc` (Good-Til-Cancelled) - Remains open until filled or cancelled
- `ioc` (Immediate-or-Cancel) - Fill immediately or cancel
- `fok` (Fill-or-Kill) - Fill entire order immediately or cancel

### Position Management

**Opening Positions:**
- Buy YES contracts to bet event will occur
- Buy NO contracts to bet event won't occur
- Can open positions on multiple markets simultaneously

**Closing Positions:**
- Sell contracts to exit before settlement
- Exit at current market price (may differ from entry)
- Realize P&L immediately

**Settlement:**
- Contracts settle to $1 (event occurred) or $0 (event didn't occur)
- Automatic settlement at expiration
- Funds credited to account after settlement

### Risk Management

**Capital Requirements:**
- Buying: Pay full price upfront (e.g., 45¢ × 10 contracts = $4.50)
- Selling: No capital required (but limited by position size)
- No margin or leverage

**Risk Limits:**
- Maximum loss: Price paid per contract
- Maximum gain: $1.00 - price paid
- Portfolio diversification recommended

---

## Security Considerations

### Credential Encryption

- All API keys encrypted with AES-256-GCM
- Unique IV (Initialization Vector) per user
- Encryption key stored in environment variable
- Keys never transmitted or logged in plain text
- Automatic decryption only when needed

### API Security

- Bearer token authentication with 30-minute expiry
- Token caching to minimize login requests
- HTTPS only for all API calls
- No credential exposure in error messages
- Rate limiting respected

### Row Level Security

- Database enforces user isolation
- Users cannot access other users' data
- All queries filtered by `auth.uid() = user_id`
- Public read-only for market data

### Audit Trail

- All activities logged to `prediction_markets_activity_log`
- Includes timestamps, activity types, metadata
- Immutable log records
- Useful for compliance and debugging

---

## Important Limitations

### Platform Limitations

1. **US Residents Only** - Kalshi only available to US residents 18+
2. **CFTC Regulated** - Subject to regulatory oversight and restrictions
3. **Event-Based** - Not all events may be available for trading
4. **Contract Limits** - Some markets have position limits
5. **No Shorting** - Can only sell contracts you own

### API Limitations

1. **Rate Limits** - Subject to Kalshi API rate limiting
2. **Token Expiry** - Tokens expire every 30 minutes
3. **No WebSocket (yet)** - Must poll for updates (30-second interval)
4. **Demo Limitations** - Demo environment may have limited markets
5. **Data Delay** - Price updates may have slight delays

### Technical Limitations

1. **Browser Crypto API** - Requires modern browser for encryption
2. **No Batch Orders** - Each order must be placed individually
3. **Sync Dependency** - Must sync before viewing latest data
4. **No Guaranteed Fills** - Limit orders may not execute

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" Error

**Cause:** Incorrect API key format or invalid credentials

**Solutions:**
- Verify format: `your-email@example.com:your-api-key`
- Ensure no extra spaces or characters
- Check if API key is active in Kalshi dashboard
- Regenerate API key if needed
- Verify encryption key is set in environment

#### 2. "Token expired" Error

**Cause:** Bearer token expired and cache not refreshed

**Solutions:**
- Service should auto-refresh - check logs
- Manually click "Sync" to force refresh
- Check if API key is still valid
- Verify network connectivity

#### 3. Markets Not Loading

**Cause:** API call failures or no active markets

**Solutions:**
- Click "Sync" button manually
- Check browser console for errors
- Verify Kalshi API status at status.kalshi.com
- Check if demo environment has limited markets
- Try switching environments

#### 4. Orders Not Executing

**Cause:** Insufficient funds, invalid parameters, or market closed

**Solutions:**
- Verify account has sufficient available balance
- Check if market is still active
- For limit orders, check if price is reasonable
- Review order status in Orders tab
- Check error_message in database if order rejected

#### 5. Positions Not Updating

**Cause:** Sync delay or position already closed

**Solutions:**
- Click "Sync" to update positions
- Check Orders tab for fills
- Verify position wasn't closed by market settlement
- Check price history to see if market moved

#### 6. "Environment not configured" Message

**Cause:** No credentials saved for selected environment

**Solutions:**
- Click "Setup Prediction Markets" to configure
- Verify you've selected correct environment (Demo/Live)
- Check database for saved credentials
- Re-run setup wizard if needed

### Debug Mode

Enable detailed logging in browser console:

```typescript
// Check service logs
console.log('Kalshi Service state:', {
  isConfigured: await KalshiService.isConfigured(userId, environment),
  tokenCache: // internal state
})

// Check API calls
// Open Network tab in DevTools
// Filter for 'kalshi' requests
// Inspect request/response headers and bodies
```

### Database Queries for Debugging

```sql
-- Check if credentials exist and are active
SELECT user_id, environment, is_active, last_validated_at
FROM kalshi_credentials
WHERE user_id = 'user-id-here';

-- Check account sync status
SELECT balance, available_balance, last_synced_at
FROM kalshi_account_info
WHERE user_id = 'user-id-here';

-- View recent orders with details
SELECT market_ticker, side, action, order_type,
       quantity, filled_quantity, status, error_message, created_at
FROM prediction_market_orders
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 10;

-- Check positions and P&L
SELECT market_ticker, position_side, quantity,
       average_price, unrealized_pnl, last_updated_at
FROM prediction_market_positions
WHERE user_id = 'user-id-here';

-- Review activity log
SELECT activity_type, market_ticker, metadata, created_at
FROM prediction_markets_activity_log
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Additional Resources

- **Kalshi Official Docs:** https://docs.kalshi.com
- **Kalshi Website:** https://kalshi.com
- **API Reference:** https://docs.kalshi.com/welcome
- **Kalshi Help Center:** https://help.kalshi.com
- **Kalshi Discord:** Join #dev channel for developer support
- **CFTC Regulations:** https://www.cftc.gov

---

## Compliance & Disclaimers

**Important:** This integration is for educational purposes. Users must:
- Be US residents 18 years or older
- Understand prediction market risks
- Only trade with funds they can afford to lose
- Comply with all applicable laws and regulations
- Read and understand Kalshi's terms of service

**No Financial Advice:** This platform does not provide financial, investment, or tax advice. Consult with licensed professionals before making investment decisions.

**No Warranties:** The integration is provided "as is" without warranties of any kind. Trading prediction markets involves substantial risk of loss.

**Regulatory Notice:** Kalshi is regulated by the Commodity Futures Trading Commission (CFTC). Users are subject to Kalshi's terms and regulatory requirements.

---

*Last Updated: 2025-10-11*
*Integration Version: 1.0.0*
*Kalshi API Version: v2*
