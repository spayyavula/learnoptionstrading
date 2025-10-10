# Zerodha Kite Connect Integration Guide

This guide will help you set up Zerodha Kite Connect API to access Indian stock market options data.

## 📋 Prerequisites

- Zerodha trading account (open at https://zerodha.com)
- Kite Connect API subscription

## 💰 Pricing (as of 2025)

- **One-time setup fee**: ₹2,000
- **Monthly subscription**: ₹2,000/month per API key
- **Total first month**: ₹4,000
- **Subsequent months**: ₹2,000/month

## 🚀 Step-by-Step Setup

### Step 1: Sign up for Kite Connect

1. Visit https://kite.trade/
2. Click on "Sign up" or go to https://developers.kite.trade/
3. Log in with your Zerodha credentials
4. Create a new app

### Step 2: Create Your App

1. In the Kite Connect dashboard, click "Create new app"
2. Fill in the details:
   - **App name**: Learn Options Trading (or your preferred name)
   - **Redirect URL**: `http://localhost:5173/auth/zerodha/callback` (for development)
   - **Description**: Options trading learning platform
   - **Type**: Connect

3. Submit the form

### Step 3: Get Your API Credentials

After creating the app, you'll receive:
- **API Key**: Public key used for authentication
- **API Secret**: Secret key used for generating checksums (keep this secure!)

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Zerodha credentials to `.env`:
   ```env
   # Zerodha Kite Connect API
   VITE_ZERODHA_API_KEY=your_api_key_here
   VITE_ZERODHA_API_SECRET=your_api_secret_here
   VITE_ZERODHA_ACCESS_TOKEN=  # Leave empty initially

   # Set default market to India
   VITE_DEFAULT_MARKET=INDIA
   ```

3. **Important**: Never commit your `.env` file to Git!

### Step 5: Complete the Login Flow

Kite Connect requires a one-time login flow to get an access token:

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the login URL**:
   The app will show you a "Connect Zerodha" button. Click it to:
   - Redirect to Zerodha login page
   - Log in with your Zerodha credentials
   - Authorize the app
   - Get redirected back with a `request_token`

3. **Exchange request token for access token**:
   The app will automatically exchange the request token for an access token and save it.

4. **Copy the access token**:
   Once logged in, copy the access token from the browser console and add it to your `.env` file:
   ```env
   VITE_ZERODHA_ACCESS_TOKEN=your_access_token_here
   ```

### Step 6: Verify Connection

Once configured, you should see:
```
✅ Zerodha API configured
```

in your browser console.

## 📊 Available Data

With Zerodha Kite Connect, you can access:

### 1. **Options Chain Data**
- All available strikes for a symbol
- Call and Put options
- Real-time prices
- Open Interest (OI)
- Bid/Ask spreads

### 2. **Real-time Quotes**
- Last Traded Price (LTP)
- Bid/Ask prices
- Volume
- Open Interest
- Market depth (5 levels)

### 3. **Historical Data**
- OHLC candles
- Multiple timeframes (1min to daily)
- Up to 60 days of historical data

### 4. **Popular Indian Instruments**
Pre-configured symbols:
- **Indices**: NIFTY, BANKNIFTY, FINNIFTY
- **Stocks**: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, etc.

## 🔧 Usage Examples

### Get Options Chain
```typescript
import zerodhaService from './services/zerodhaService'

// Get NIFTY options chain for nearest expiry
const optionsChain = await zerodhaService.getOptionsChain('NIFTY')

console.log('Calls:', optionsChain.calls)
console.log('Puts:', optionsChain.puts)
```

### Get Real-time Quote
```typescript
// Get quote for NIFTY 50 index option
const quote = await zerodhaService.getQuote(['NFO:NIFTY25JAN24000CE'])

console.log('Last Price:', quote['NFO:NIFTY25JAN24000CE'].last_price)
console.log('Open Interest:', quote['NFO:NIFTY25JAN24000CE'].oi)
```

### Get LTP (Faster)
```typescript
// Get just the last traded price
const ltp = await zerodhaService.getLTP(['NFO:NIFTY25JAN24000CE', 'NFO:NIFTY25JAN24000PE'])

console.log(ltp)
```

### Get Historical Data
```typescript
const historicalData = await zerodhaService.getHistoricalData(
  12345678,  // instrument_token
  '2025-01-01',
  '2025-01-10',
  'day'
)

console.log('OHLC Data:', historicalData)
```

## 🔒 Security Best Practices

1. **Never expose your API Secret**:
   - Keep it only in `.env` file
   - Never commit `.env` to version control
   - Never share it with anyone

2. **Access Token Rotation**:
   - Access tokens expire daily
   - Re-login every day or implement token refresh logic
   - Store tokens securely (not in localStorage)

3. **Rate Limiting**:
   - Kite Connect has rate limits (3 requests/second)
   - Implement proper throttling
   - Cache data when possible

4. **Production Deployment**:
   - Update redirect URL to your production domain
   - Use environment-specific API keys
   - Enable HTTPS

## 🐛 Troubleshooting

### "API not configured" Error
- Check if all three env variables are set (API_KEY, API_SECRET, ACCESS_TOKEN)
- Restart your dev server after updating `.env`

### "Invalid access token" Error
- Access tokens expire daily
- Complete the login flow again
- Update `VITE_ZERODHA_ACCESS_TOKEN` in `.env`

### "Instrument not found" Error
- Verify the instrument symbol (case-sensitive)
- Check if it's available on NFO exchange
- Use correct format: `EXCHANGE:TRADINGSYMBOL` (e.g., `NFO:NIFTY25JAN24000CE`)

### CORS Errors
- Kite Connect API doesn't support CORS
- You'll need to proxy requests through your backend
- Or use the browser extension "CORS Unblock" for development

## 📚 Resources

- **Official Documentation**: https://kite.trade/docs/connect/v3/
- **API Libraries**: https://github.com/zerodha/
- **Developer Forum**: https://tradingqna.com/
- **Support**: https://support.zerodha.com/

## 🎯 Next Steps

After setup:
1. ✅ Test the connection with a simple quote request
2. ✅ Explore available instruments
3. ✅ Build your options chain display
4. ✅ Implement real-time updates with WebSockets
5. ✅ Add historical data charts

## 💡 Tips

- **Test with NIFTY first**: It's the most liquid and easiest to work with
- **Cache instruments list**: It's a 30-40MB file, download and cache it locally
- **Use WebSockets for real-time data**: More efficient than polling
- **Respect rate limits**: Implement proper throttling to avoid bans
- **Start with mock data**: Test your UI before connecting real API

## ⚠️ Important Notes

1. **Market Hours**: Indian markets operate Mon-Fri, 9:15 AM - 3:30 PM IST
2. **Lot Sizes**: Options have different lot sizes (NIFTY = 25, BANKNIFTY = 15, etc.)
3. **Strike Intervals**: Vary by instrument (NIFTY = 50 points, BANKNIFTY = 100 points)
4. **Expiry Days**:
   - NIFTY: Weekly (Thursday)
   - BANKNIFTY: Weekly (Wednesday)
   - Monthly options: Last Thursday of the month

---

**Need Help?** Open an issue or contact support@learnoptions.com
