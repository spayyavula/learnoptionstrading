# Indian Brokers Integration Guide

Complete guide for integrating ICICI Direct and HDFC Securities for Indian market trading.

## Overview

This platform now supports two major Indian brokers:

1. **ICICI Direct** - Breeze API for NSE, BSE, NFO, CDS, MCX
2. **HDFC Securities** - Official API for NSE, BSE, NFO, MCX, CDS

Both integrations provide full access to Indian markets for stocks, options, futures, commodities, and currency derivatives.

---

## Table of Contents

- [Supported Markets](#supported-markets)
- [ICICI Direct Setup](#icici-direct-setup)
- [HDFC Securities Setup](#hdfc-securities-setup)
- [Trading Features](#trading-features)
- [Order Types](#order-types)
- [Market Data](#market-data)
- [Demo vs Live Mode](#demo-vs-live-mode)
- [API Limits & Costs](#api-limits--costs)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Supported Markets

### NSE (National Stock Exchange)
- Equities (NIFTY 50, NIFTY Bank, etc.)
- Index options (NIFTY, BANKNIFTY, FINNIFTY)
- Stock options
- Futures contracts

### BSE (Bombay Stock Exchange)
- Equities (SENSEX stocks)
- Stock options
- Index derivatives

### NFO (NSE Futures & Options)
- Index futures (NIFTY, BANKNIFTY)
- Stock futures
- Index options
- Stock options

### MCX (Multi Commodity Exchange)
- Gold, Silver
- Crude Oil, Natural Gas
- Base metals
- Agricultural commodities

### CDS (Currency Derivatives)
- USD/INR
- EUR/INR
- GBP/INR
- JPY/INR

---

## ICICI Direct Setup

### Prerequisites

1. **Active ICICI Direct Account**
   - Trading account with ICICI Direct
   - Demat account
   - Access to trading terminal

2. **API Access**
   - Apply for Breeze API access
   - Get API Key and Secret
   - Note your User ID

### Step-by-Step Setup

#### Step 1: Apply for API Access

1. Login to ICICI Direct website
2. Navigate to **Settings** → **API Management**
3. Fill the API application form
4. Submit required documents:
   - PAN Card
   - Trading account details
   - Purpose of API usage

#### Step 2: Get Credentials

Once approved (usually 1-2 business days):

1. Go to **API Management** section
2. Click **Generate API Key**
3. Note down:
   - **API Key** (keep secure)
   - **API Secret** (keep secure)
   - **User ID** (your trading account number)

#### Step 3: Configure in Platform

1. Navigate to **Broker Connections** in the app
2. Find **ICICI Direct** card
3. Click **Setup ICICI Direct**
4. Select **Demo** or **Live** environment
5. Enter your credentials:
   ```
   API Key: YOUR_API_KEY
   API Secret: YOUR_API_SECRET
   User ID: YOUR_USER_ID
   ```
6. Click **Continue** → **Verify Connection**
7. Done! You're connected

### ICICI Direct Features

✅ **Markets:** NSE, BSE, NFO, CDS, MCX
✅ **Products:**
   - Cash (Delivery)
   - Margin
   - Intraday (MIS)
   - Cover Order

✅ **Order Types:**
   - Market
   - Limit
   - Stop Loss
   - Stop Loss Market

✅ **Data:**
   - Real-time quotes
   - Options chain with Greeks
   - Historical data
   - Order book & trade book

### ICICI Brokerage

- **Equity Delivery:** ₹0 (or as per plan)
- **Equity Intraday:** ₹20 per executed order
- **F&O:** ₹20 per executed order
- **API Access:** Check with ICICI Direct

---

## HDFC Securities Setup

### Prerequisites

1. **Active HDFC Securities Account**
   - 3-in-1 account (Trading + Demat + Bank)
   - Access to trading portal

2. **API Access**
   - Apply for HDFC Securities API
   - Get App ID and Secret
   - Note your User Code

### Step-by-Step Setup

#### Step 1: Apply for API Access

1. Login to HDFC Securities portal
2. Go to **Developer Console** or contact relationship manager
3. Submit API application form
4. Required documents:
   - PAN Card
   - Account details
   - Use case description

#### Step 2: Create App & Get Credentials

After approval:

1. Login to Developer Console
2. Click **Create New App**
3. Fill app details
4. Get credentials:
   - **App ID**
   - **App Secret**
   - **User Code** (your trading account code)

#### Step 3: Configure in Platform

1. Navigate to **Broker Connections**
2. Find **HDFC Securities** card
3. Click **Setup HDFC Securities**
4. Select **Demo** or **Live** environment
5. Enter credentials:
   ```
   App ID: YOUR_APP_ID
   App Secret: YOUR_APP_SECRET
   User Code: YOUR_USER_CODE
   ```
6. Click **Continue** → **Verify Connection**
7. Success!

### HDFC Securities Features

✅ **Markets:** NSE, BSE, NFO, MCX, CDS
✅ **Products:**
   - Delivery
   - Intraday
   - Margin
   - Cover Order (CO)
   - Bracket Order (BO)

✅ **Order Types:**
   - Market
   - Limit
   - Stop Loss (SL)
   - Stop Loss Market (SL-M)

✅ **Advanced Features:**
   - Trailing stop loss
   - GTD (Good Till Date) orders
   - After Market Orders (AMO)

✅ **Data:**
   - Real-time market data
   - Options chain
   - Historical data
   - Advanced charting

### HDFC Securities Brokerage

- **Equity Delivery:** ₹0 (or as per plan)
- **Equity Intraday:** ₹20 per order
- **F&O:** ₹20 per order
- **API Access:** Check with HDFC Securities

---

## Trading Features

### Options Trading

Both brokers support Indian options:

**Index Options:**
- NIFTY (strikes: 50-point intervals)
- BANKNIFTY (strikes: 100-point intervals)
- FINNIFTY (strikes: 50-point intervals)

**Stock Options:**
- Available for select stocks
- Monthly and weekly expiries

**Features:**
- Real-time Greeks (Delta, Gamma, Theta, Vega, Rho)
- Implied Volatility
- Open Interest data
- Volume tracking
- Multi-leg strategies

### Futures Trading

- Index futures (NIFTY, BANKNIFTY)
- Stock futures
- Currency futures
- Commodity futures (via MCX)

### Stock Trading

- Delivery (long-term holding)
- Intraday (same-day square-off)
- Margin trading (leveraged positions)

---

## Order Types

### Market Order
- Executes immediately at current market price
- Best for high liquidity stocks
- Use case: Quick entry/exit

### Limit Order
- Executes only at specified price or better
- Good for illiquid stocks
- Use case: Price targeting

### Stop Loss (SL)
- Becomes limit order when trigger price reached
- Use case: Risk management

### Stop Loss Market (SL-M)
- Becomes market order when trigger reached
- Faster execution than SL
- Use case: Quick stop loss

### Cover Order (CO)
- Intraday order with mandatory stop loss
- Higher leverage
- Auto square-off at 3:15 PM
- Use case: Leveraged intraday trading

### Bracket Order (BO) - HDFC Only
- Order with target and stop loss
- Three legs: entry, target, stop loss
- Auto square-off
- Use case: Defined risk-reward intraday trading

---

## Market Data

### Real-Time Data

Both brokers provide:
- Live price quotes (LTP, Bid, Ask)
- Order book depth
- Market depth
- Tick-by-tick data

### Historical Data

Available intervals:
- 1 minute
- 5 minutes
- 15 minutes
- 30 minutes
- 1 hour
- 1 day

### Options Chain

- All strikes for current expiry
- Multiple expiries
- Greeks calculation
- IV surface
- Put-Call Ratio
- Max Pain calculation

---

## Demo vs Live Mode

### Demo Mode

**Advantages:**
- ✅ Test strategies risk-free
- ✅ Learn platform features
- ✅ No real money required
- ✅ Simulated market data
- ✅ Practice order placement

**Limitations:**
- ❌ Not real market conditions
- ❌ No execution delays
- ❌ No slippage simulation
- ❌ May not reflect actual liquidity

**When to Use:**
- Learning the platform
- Testing new strategies
- Understanding order types
- Practicing risk management

### Live Mode

**Advantages:**
- ✅ Real market execution
- ✅ Actual prices and liquidity
- ✅ Real P&L
- ✅ True market experience

**Considerations:**
- ⚠️ Uses real money
- ⚠️ Market risk involved
- ⚠️ Brokerage charges apply
- ⚠️ Requires funded account

**When to Use:**
- After sufficient demo practice
- When confident in strategy
- For actual trading
- Building real track record

---

## API Limits & Costs

### ICICI Direct

**Rate Limits:**
- Order placement: ~10 orders/second
- Market data: ~100 requests/second
- Websocket connections: 5 concurrent

**Costs:**
- API access fee: Contact ICICI Direct
- Standard brokerage applies
- No additional per-API-call charges

### HDFC Securities

**Rate Limits:**
- Order placement: ~10 orders/second
- Market data: ~100 requests/second
- Websocket: 5 connections

**Costs:**
- API access fee: Contact HDFC Securities
- Brokerage as per account plan
- Check for API usage charges

---

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to broker
**Solutions:**
1. Verify credentials are correct
2. Check if API access is enabled
3. Ensure account is active
4. Check internet connection
5. Try regenerating API keys

**Problem:** Session expired
**Solutions:**
1. Logout and login again
2. Regenerate session token
3. Check token expiry settings

### Order Issues

**Problem:** Order rejected
**Possible Causes:**
- Insufficient funds
- Invalid price (outside circuit limits)
- Incorrect symbol format
- Market closed
- Account restrictions

**Solutions:**
- Check account balance
- Verify circuit limits
- Use correct symbol format
- Check market timings
- Contact broker support

### Data Issues

**Problem:** No market data
**Solutions:**
1. Check market hours (9:15 AM - 3:30 PM IST)
2. Verify data subscription
3. Check API rate limits
4. Reload connection

---

## Best Practices

### Security

1. **Never Share Credentials**
   - Keep API Key/Secret secure
   - Don't commit to version control
   - Use environment variables

2. **Use Strong Passwords**
   - Enable 2FA on broker account
   - Change passwords regularly

3. **Monitor Access**
   - Check API access logs
   - Watch for unauthorized activity
   - Disable API when not in use

### Trading

1. **Start Small**
   - Use demo mode first
   - Start with small positions in live
   - Gradually increase size

2. **Risk Management**
   - Always use stop losses
   - Don't risk more than 2% per trade
   - Diversify positions

3. **Order Management**
   - Double-check orders before placing
   - Use limit orders in illiquid stocks
   - Monitor open positions

4. **Market Hours**
   - Pre-market: 9:00 AM - 9:15 AM
   - Regular: 9:15 AM - 3:30 PM
   - Post-market: 3:40 PM - 4:00 PM
   - AMO: After 4:00 PM for next day

### Performance

1. **Batch Requests**
   - Don't poll too frequently
   - Use websockets for real-time data
   - Cache market data when possible

2. **Error Handling**
   - Handle API errors gracefully
   - Implement retry logic
   - Log errors for debugging

---

## Market Timings (IST)

### Equity Market
- **Pre-open:** 9:00 AM - 9:15 AM
- **Normal Trading:** 9:15 AM - 3:30 PM
- **Closing:** 3:30 PM - 3:40 PM
- **Post-close:** 3:40 PM - 4:00 PM

### Derivatives (F&O)
- **Normal Trading:** 9:15 AM - 3:30 PM
- **Expiry Day:** 9:15 AM - 3:30 PM

### Currency (CDS)
- **Normal Trading:** 9:00 AM - 5:00 PM

### Commodities (MCX)
- Varies by commodity
- Crude Oil: 9:00 AM - 11:30 PM (with break)
- Gold/Silver: 9:00 AM - 11:55 PM

---

## Holidays

Indian stock markets are closed on:
- Republic Day (Jan 26)
- Holi
- Good Friday
- Ambedkar Jayanti (Apr 14)
- Maharashtra Day (May 1)
- Independence Day (Aug 15)
- Gandhi Jayanti (Oct 2)
- Diwali (Laxmi Puja day)
- Diwali next day
- Guru Nanak Jayanti
- Christmas (Dec 25)

Check exchange website for current year's holiday list.

---

## Getting Help

### Support Channels

**ICICI Direct:**
- Customer Care: 1800-200-3636
- Email: customer.care@icicidirect.com
- API Support: Check API portal

**HDFC Securities:**
- Customer Care: 1800-266-4500
- Email: customer.care@hdfcsec.com
- API Support: Developer console

**Platform Issues:**
- Check documentation
- Contact platform support
- Report bugs on GitHub

---

## Comparison: ICICI vs HDFC

| Feature | ICICI Direct | HDFC Securities |
|---------|--------------|-----------------|
| **Markets** | NSE, BSE, NFO, CDS, MCX | NSE, BSE, NFO, MCX, CDS |
| **Bracket Orders** | ❌ | ✅ |
| **Cover Orders** | ✅ | ✅ |
| **AMO Orders** | ✅ | ✅ |
| **API Platform** | Breeze API | Official API |
| **Ease of Setup** | Medium | Medium |
| **Documentation** | Good | Good |
| **Best For** | Retail traders | Active traders |
| **3-in-1 Account** | No | Yes (with HDFC Bank) |

---

## Next Steps

1. **Apply for API Access**
   - Choose your broker
   - Submit application
   - Get credentials

2. **Practice in Demo Mode**
   - Connect using demo environment
   - Place test orders
   - Learn platform features

3. **Test with Small Positions**
   - Switch to live mode
   - Start with small capital
   - Build confidence

4. **Scale Up**
   - Increase position sizes gradually
   - Implement full strategies
   - Monitor and optimize

---

## Legal & Compliance

### Regulations

- Trading in India is regulated by SEBI
- Follow all KYC requirements
- Report income for tax purposes
- Maintain trading records

### Tax Implications

- **Equity Delivery:** LTCG/STCG tax applies
- **Intraday & F&O:** Treated as speculative income
- **Options:** Premium taxed as business income
- Consult tax advisor for details

### Risk Disclosure

⚠️ **Important:**
- Trading involves substantial risk
- Past performance doesn't guarantee future results
- Only trade with capital you can afford to lose
- Leverage amplifies both gains and losses
- Seek professional financial advice

---

## Resources

### Official Links

**ICICI Direct:**
- Website: https://www.icicidirect.com
- API Portal: https://api.icicidirect.com
- Breeze Documentation: https://api.icicidirect.com/breezeconnect

**HDFC Securities:**
- Website: https://www.hdfcsec.com
- API Portal: https://api.hdfcsec.com
- Developer Docs: https://api.hdfcsec.com/docs

**Exchanges:**
- NSE: https://www.nseindia.com
- BSE: https://www.bseindia.com
- MCX: https://www.mcxindia.com

### Learning Resources

- NSE Options Trading Guide
- SEBI Investor Education
- Exchange Trading Rules
- Tax guidelines for traders

---

## Version History

- **v1.0** (2025-01) - Initial release
  - ICICI Direct integration
  - HDFC Securities integration
  - Demo & Live mode support
  - Options trading with Greeks
  - Multi-market support

---

## License

Part of the Options Trading Platform
© 2024-2025 - Educational purposes

**Disclaimer:** This is an educational platform. All trading decisions are yours. We are not responsible for any losses incurred through trading.

---

**Happy Trading! 🚀📈**

*Trade smart, trade safe, trade Indian markets!* 🇮🇳
