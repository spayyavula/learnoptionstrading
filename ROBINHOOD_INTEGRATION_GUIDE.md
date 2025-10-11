# Robinhood Crypto Integration Guide

## Overview

This guide provides comprehensive documentation for the Robinhood Crypto API integration in your options trading platform. The integration allows users to trade cryptocurrencies (Bitcoin, Ethereum, and other digital assets) directly through Robinhood's official API.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [Components](#components)
5. [Setup Process](#setup-process)
6. [API Authentication](#api-authentication)
7. [Trading Operations](#trading-operations)
8. [Security Considerations](#security-considerations)
9. [Important Limitations](#important-limitations)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The Robinhood Crypto integration follows the same architectural patterns as Alpaca and IBKR integrations:

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
│  ┌───────────────────┐  ┌──────────────────────┐   │
│  │ Setup Wizard      │  │ Account Dashboard     │   │
│  │ - Step 1: Intro   │  │ - Holdings Display    │   │
│  │ - Step 2: Keys    │  │ - Order History       │   │
│  │ - Step 3: Verify  │  │ - Real-time Prices    │   │
│  │ - Step 4: Comply  │  │ - P&L Tracking        │   │
│  └───────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│  ┌───────────────────┐  ┌──────────────────────┐   │
│  │ RobinhoodService  │  │ ComplianceService     │   │
│  │ - Authentication  │  │ - Risk Disclosures    │   │
│  │ - Account Mgmt    │  │ - Order Validation    │   │
│  │ - Trading Ops     │  │ - Volatility Checks   │   │
│  │ - Market Data     │  │ - Portfolio Limits    │   │
│  └───────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Data Layer                          │
│  ┌──────────────────────────────────────────────┐  │
│  │         Supabase PostgreSQL Database          │  │
│  │  - robinhood_credentials (encrypted)          │  │
│  │  - robinhood_account_info                     │  │
│  │  - robinhood_holdings                         │  │
│  │  - robinhood_orders                           │  │
│  │  - robinhood_trading_activity_log             │  │
│  │  - robinhood_compliance_acknowledgments       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Robinhood Crypto API                    │
│         https://trading.robinhood.com/api/v1         │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Created

#### 1. `robinhood_credentials`
Stores encrypted API credentials with AES-256-GCM encryption.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `private_key_encrypted` (text) - Encrypted ECDSA private key
- `public_key_encrypted` (text) - Encrypted ECDSA public key
- `api_key_encrypted` (text) - Encrypted API key
- `encryption_iv` (text) - Initialization vector for decryption
- `environment` (text) - 'live' or 'paper' (Robinhood only supports 'live')
- `is_active` (boolean)
- `compliance_acknowledged` (boolean)
- `compliance_acknowledged_at` (timestamptz)
- `last_validated_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**Unique Constraint:** `(user_id, environment)`

#### 2. `robinhood_account_info`
Account metadata and balance information.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users, unique)
- `account_id` (text)
- `account_status` (text)
- `buying_power` (numeric)
- `cash_balance` (numeric)
- `portfolio_value` (numeric)
- `total_equity` (numeric)
- `last_synced_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

#### 3. `robinhood_holdings`
Cryptocurrency positions/holdings.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `symbol` (text) - Crypto symbol (BTC, ETH, etc.)
- `asset_name` (text)
- `asset_code` (text)
- `quantity` (numeric(20,8))
- `quantity_available` (numeric(20,8))
- `avg_cost_basis` (numeric(20,8))
- `current_price` (numeric(20,8))
- `market_value` (numeric(20,2))
- `cost_basis_total` (numeric(20,2))
- `unrealized_pl` (numeric(20,2))
- `unrealized_plpc` (numeric(10,4))
- `last_synced_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**Unique Constraint:** `(user_id, symbol)`

#### 4. `robinhood_orders`
Order tracking and history.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users)
- `robinhood_order_id` (text)
- `client_order_id` (text)
- `symbol` (text)
- `asset_code` (text)
- `order_type` (text) - 'market', 'limit', 'stop_limit', 'stop_loss'
- `side` (text) - 'buy' or 'sell'
- `quantity` (numeric(20,8))
- `limit_price` (numeric(20,8))
- `stop_price` (numeric(20,8))
- `filled_qty` (numeric(20,8))
- `filled_avg_price` (numeric(20,8))
- `remaining_qty` (numeric(20,8))
- `status` (text)
- `order_config` (jsonb)
- `error_message` (text)
- `submitted_at`, `filled_at`, `cancelled_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**Unique Constraint:** `(user_id, robinhood_order_id)`

#### 5. `robinhood_trading_activity_log`
Audit trail for all trading activities.

#### 6. `robinhood_compliance_acknowledgments`
User acknowledgment of risk disclosures.

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id` (both USING and WITH CHECK)
- DELETE: `auth.uid() = user_id` (where applicable)

---

## Service Layer

### RobinhoodService (`src/services/robinhoodService.ts`)

Core service for all Robinhood API interactions.

#### Key Methods

**Authentication & Credentials:**
- `saveCredentials(userId, privateKey, publicKey, apiKey, environment)` - Encrypts and stores credentials
- `validateCredentials(userId, environment)` - Tests API connection
- `deleteCredentials(userId, environment)` - Removes stored credentials

**Account Management:**
- `getAccount(userId, environment)` - Fetches account information
- `getHoldings(userId, environment)` - Retrieves cryptocurrency holdings
- `syncHoldings(userId, environment)` - Syncs holdings to database
- `syncOrders(userId, environment)` - Syncs order history

**Market Data:**
- `getBestBidAsk(userId, environment, symbols)` - Real-time price quotes
- `getEstimatedPrice(userId, environment, symbol, side, quantity)` - Price estimation

**Trading Operations:**
- `placeOrder(userId, environment, orderRequest)` - Place buy/sell orders
- `getOrder(userId, environment, orderId)` - Get specific order details
- `getOrders(userId, environment, filters)` - List orders with filters
- `cancelOrder(userId, environment, orderId)` - Cancel pending order

**Compliance:**
- `acknowledgeCompliance(userId, disclosureType, version)` - Record compliance acknowledgment
- `logActivity(userId, activityType, environment, metadata)` - Audit logging

#### Authentication Flow

Robinhood uses ECDSA signature-based authentication:

1. Generate signature for each API request
2. Sign message: `{METHOD}{PATH}{TIMESTAMP}{BODY}` using ECDSA P-256
3. Include in headers:
   - `x-api-key`: API key
   - `x-signature`: Base64-encoded signature
   - `x-timestamp`: Unix timestamp in milliseconds

### RobinhoodComplianceService (`src/services/robinhoodComplianceService.ts`)

Manages regulatory compliance and risk disclosures.

#### Key Methods

- `getRegulatoryDisclosure(type)` - Get specific disclosure content
- `getAllRequiredDisclosures()` - Get all required disclosures
- `validateComplianceAcknowledgments(acknowledgments)` - Validate all required acks
- `getRiskLevel(orderValue, accountBalance)` - Calculate order risk level
- `getVolatilityWarning(symbol)` - Get crypto-specific volatility warnings
- `validateOrderRisk(orderType, quantity, price, accountBalance)` - Pre-order risk check

#### Risk Disclosures

1. **Cryptocurrency Trading Risk** - Market volatility, 24/7 trading, limited ownership
2. **Market Volatility Warning** - Extreme price swings, flash crashes
3. **Custody Limitations** - No external transfers, Robinhood custody only

---

## Components

### RobinhoodSetupWizard (`src/components/RobinhoodSetupWizard.tsx`)

4-step onboarding wizard:

**Step 1: Introduction**
- Overview of Robinhood Crypto
- Prerequisites checklist
- Important warnings (live trading only, no paper mode)

**Step 2: API Credentials Entry**
- Private key input (PEM format)
- Public key input (PEM format)
- API key input
- Secure input fields with show/hide toggle
- Instructions for obtaining keys

**Step 3: Verification**
- Validates credentials with API call
- Displays account information
- Shows important reminders

**Step 4: Compliance Disclosures**
- Crypto risk disclosure (required)
- Market volatility warning (required)
- Custody limitations (required)
- User must acknowledge all to proceed

### RobinhoodAccountDashboard (`src/components/RobinhoodAccountDashboard.tsx`)

Account overview and management:

**Features:**
- Account balance summary (buying power, portfolio value, total P&L)
- Holdings table with real-time prices
- Recent order history
- Manual sync button
- Auto-refresh every 30 seconds
- Visual indicators for live trading status

**Data Display:**
- Holdings: Symbol, quantity, avg cost, current price, market value, P&L
- Orders: Date, symbol, side, type, quantity, price, status

---

## Setup Process

### For Users

1. **Create Robinhood Account**
   - Sign up at robinhood.com
   - Complete identity verification
   - Enable crypto trading

2. **Generate API Credentials**
   - Visit API Credentials Portal (desktop only)
   - Generate new credentials
   - Download private key, public key, and API key
   - Store securely (cannot be recovered if lost)

3. **Platform Setup**
   - Navigate to Settings → Broker Integrations
   - Click "Setup Robinhood Crypto"
   - Follow 4-step wizard
   - Enter all three keys
   - Acknowledge all risk disclosures

4. **Start Trading**
   - Switch to "RH Crypto" mode in trading toggle
   - View holdings in dashboard
   - Place orders through trading interface

### For Developers

1. **Environment Variables**
```bash
VITE_ROBINHOOD_ENABLED=true
VITE_ROBINHOOD_API_BASE_URL=https://trading.robinhood.com/api/v1
VITE_ROBINHOOD_DEFAULT_ENVIRONMENT=live
VITE_ROBINHOOD_SYNC_INTERVAL=30000
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
```

2. **Database Migration**
```bash
# Already applied via Supabase MCP
# Migration file: 20251011160000_create_robinhood_crypto_tables.sql
```

3. **Integration Points**
- Add Robinhood option to trading mode selector
- Include setup wizard in settings
- Add dashboard to appropriate view
- Handle 'robinhood-crypto' mode in trading logic

---

## API Authentication

### Request Signing Process

```typescript
// 1. Prepare request data
const method = 'POST'
const path = '/orders'
const timestamp = Date.now()
const body = JSON.stringify(orderData)

// 2. Create message to sign
const message = `${method}${path}${timestamp}${body}`

// 3. Sign with ECDSA P-256 private key
const signature = await crypto.subtle.sign(
  { name: 'ECDSA', hash: { name: 'SHA-256' } },
  privateKey,
  encoder.encode(message)
)

// 4. Include in headers
headers = {
  'x-api-key': apiKey,
  'x-signature': btoa(String.fromCharCode(...new Uint8Array(signature))),
  'x-timestamp': timestamp.toString(),
  'Content-Type': 'application/json'
}
```

---

## Trading Operations

### Order Types Supported

1. **Market Orders** - Execute immediately at current market price
2. **Limit Orders** - Execute only at specified price or better
3. **Stop-Limit Orders** - Trigger limit order when stop price reached
4. **Stop-Loss Orders** - Trigger market order when stop price reached

### Order Placement Example

```typescript
const orderRequest: RobinhoodOrderRequest = {
  symbol: 'BTC',
  side: 'buy',
  type: 'limit',
  quantity: '0.001',
  price: '50000.00',
  time_in_force: 'gtc',
  client_order_id: 'RH_1234567890'
}

const order = await RobinhoodService.placeOrder(
  userId,
  'live',
  orderRequest
)
```

### Real-time Price Updates

Prices are fetched via `getBestBidAsk()` which returns:
- `mark_price` - Current market price
- `bid_inclusive_of_sell_spread` - Best bid with spread
- `ask_inclusive_of_buy_spread` - Best ask with spread
- `high_price_24_h`, `low_price_24_h` - 24-hour range
- `volume_24_h` - 24-hour volume

---

## Security Considerations

### Credential Encryption

- All credentials encrypted with AES-256-GCM
- Unique IV (Initialization Vector) per user
- Encryption key stored in environment variable
- Keys never transmitted or stored in plain text

### API Security

- ECDSA P-256 signature for request authentication
- Timestamp validation prevents replay attacks
- HTTPS only for all API calls
- No credential exposure in logs or error messages

### Row Level Security

- Database enforces user isolation
- Users cannot access other users' data
- All queries filtered by `auth.uid() = user_id`

### Audit Trail

- All activities logged to `robinhood_trading_activity_log`
- Includes timestamps, IP addresses, metadata
- Immutable log records

---

## Important Limitations

### Platform Limitations

1. **No Paper Trading** - Robinhood Crypto only supports live trading with real money
2. **No External Transfers** - Cannot send crypto to external wallets or receive from external sources
3. **US Only** - Only available to US residents
4. **Limited Custody** - You don't control private keys; Robinhood holds crypto in custody
5. **No FDIC/SIPC Insurance** - Crypto holdings not protected by deposit or securities insurance

### API Limitations

1. **Rate Limits** - Subject to Robinhood API rate limiting (exact limits not publicly documented)
2. **24/7 Markets** - Crypto markets never close; price changes occur constantly
3. **No WebSocket Support** - Must poll for updates (implemented with 30-second interval)
4. **Limited Order Types** - Only market, limit, stop-limit, stop-loss supported

### Technical Limitations

1. **Browser-based Crypto** - Uses Web Crypto API for signatures (requires modern browser)
2. **PEM Format Required** - Keys must be in PEM format for import
3. **No Batch Operations** - Each order must be placed individually
4. **Async Signature Generation** - Request signing is async operation

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" Error

**Cause:** Incorrect or improperly formatted API keys

**Solutions:**
- Verify keys were copied completely (including PEM headers/footers)
- Ensure no extra spaces or line breaks
- Regenerate keys from Robinhood portal if needed
- Check encryption key is set in environment

#### 2. "Signature verification failed" Error

**Cause:** Issue with request signing process

**Solutions:**
- Verify private key is in correct PEM format
- Check system clock is accurate (timestamp validation)
- Ensure Web Crypto API is available in browser
- Try regenerating API credentials

#### 3. Holdings Not Syncing

**Cause:** API call failures or network issues

**Solutions:**
- Click "Sync" button manually
- Check browser console for errors
- Verify credentials are still valid
- Check Robinhood API status

#### 4. Orders Not Executing

**Cause:** Insufficient funds, invalid order parameters, or API rejection

**Solutions:**
- Verify account has sufficient buying power
- Check order quantity is valid (minimum/maximum)
- Ensure crypto market is open (should always be)
- Review order status in dashboard

#### 5. "Compliance not acknowledged" Error

**Cause:** User hasn't completed all risk disclosures

**Solutions:**
- Go through setup wizard completely
- Acknowledge all three required disclosures
- Check `robinhood_compliance_acknowledgments` table has entries

### Debug Mode

Enable detailed logging:

```typescript
// In robinhoodService.ts
console.log('Making Robinhood API request:', {
  method,
  endpoint,
  timestamp,
  userId
})
```

### Database Queries for Debugging

```sql
-- Check if credentials exist
SELECT user_id, environment, is_active, last_validated_at
FROM robinhood_credentials
WHERE user_id = 'user-id-here';

-- Check holdings sync status
SELECT symbol, quantity, market_value, last_synced_at
FROM robinhood_holdings
WHERE user_id = 'user-id-here'
ORDER BY last_synced_at DESC;

-- View recent orders
SELECT symbol, side, order_type, quantity, status, created_at
FROM robinhood_orders
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 10;

-- Check activity log
SELECT activity_type, environment, metadata, created_at
FROM robinhood_trading_activity_log
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Additional Resources

- **Robinhood API Documentation:** https://docs.robinhood.com/crypto/trading/
- **API Credentials Portal:** https://robinhood.com/account/settings/api
- **Robinhood Support:** https://robinhood.com/us/en/support/
- **Crypto Trading Overview:** https://robinhood.com/us/en/about/crypto/

---

## Compliance & Disclaimers

**Important:** This integration is for educational purposes. Users must:
- Understand cryptocurrency trading risks
- Only trade with funds they can afford to lose
- Comply with all applicable laws and regulations
- Read and understand Robinhood's terms of service

**No Financial Advice:** This platform does not provide financial, investment, or tax advice. Consult with licensed professionals before making investment decisions.

**No Warranties:** The integration is provided "as is" without warranties of any kind. Trading cryptocurrencies involves substantial risk of loss.

---

*Last Updated: 2025-10-11*
