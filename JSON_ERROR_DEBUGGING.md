# 🔍 JSON Error Debugging Guide

## ⚠️ "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

This error typically occurs when:
1. **Network requests fail** and return empty responses
2. **Stripe API calls timeout** or get interrupted
3. **Environment variables are missing** or incorrect
4. **localStorage data becomes corrupted**

## 🛠️ Debugging Steps

### Step 1: Run Diagnostics
Open your browser's Developer Console and run:
```javascript
DiagnosticTool.runDiagnostics()
```

This will check:
- ✅ Environment variables
- ✅ localStorage health
- ✅ Stripe integration
- ✅ Network connectivity
- ✅ JSON parsing history

### Step 2: Check Console Logs
Look for these specific error patterns:
- `🚨 JSON-related error detected`
- `❌ JSON parsing failed`
- `🔍 JSON Debug: PARSE_ERROR`

### Step 3: Test Subscription Flow
Test the subscription process in isolation:
```javascript
DiagnosticTool.testSubscriptionFlow('monthly')
```

### Step 4: Clear Corrupted Data
If localStorage is corrupted, clear it:
```javascript
DiagnosticTool.clearAllSubscriptionData()
```

## 🔧 Common Solutions

### Solution 1: Environment Variables
Ensure all required environment variables are set in `.env.production`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_MONTHLY_PRICE_ID=price_1...
VITE_STRIPE_YEARLY_PRICE_ID=price_1...
# etc.
```

### Solution 2: Network Issues
If in production:
1. Check if your domain can reach `api.stripe.com`
2. Verify CORS settings
3. Check Content Security Policy (CSP)

### Solution 3: Stripe Configuration
1. Verify Stripe keys are correct
2. Ensure Price IDs exist in Stripe Dashboard
3. Check if Stripe products are active

### Solution 4: localStorage Corruption
The app now automatically detects and clears corrupted JSON data, but you can manually clear it:
```javascript
localStorage.clear()
```

## 🚨 Emergency Debugging

If the error persists, enable verbose logging by running:
```javascript
// Enable maximum debugging
JsonDebugger.clearLog()
window.addEventListener('error', console.error)
window.addEventListener('unhandledrejection', console.error)

// Then reproduce the error and export the log
JsonDebugger.exportLog()
```

## 📊 Error Patterns & Fixes

| Error Message | Likely Cause | Fix |
|---------------|--------------|-----|
| "Unexpected end of JSON input" | Incomplete network response | Check network, retry request |
| "Unexpected token < in JSON" | Server returned HTML instead of JSON | Check API endpoint, CORS |
| "Failed to load Stripe" | Network/CDN issue | Check connectivity to Stripe |
| "Price ID not found" | Invalid Stripe configuration | Verify environment variables |

## 🎯 Production Checklist

Before deploying to production:
- [ ] All environment variables set correctly
- [ ] Stripe products and prices created
- [ ] Network connectivity to Stripe API confirmed
- [ ] localStorage operations tested
- [ ] Error handling tested with invalid data

## 💬 Getting Help

If the issue persists:
1. Run `DiagnosticTool.runDiagnostics()`
2. Copy the entire console output
3. Include your environment configuration (without sensitive keys)
4. Note the exact steps that trigger the error

The enhanced error handling will now:
- ✅ Catch and log all JSON parsing errors
- ✅ Provide context about what failed
- ✅ Automatically clear corrupted data
- ✅ Prevent crashes from JSON errors
- ✅ Give detailed debugging information
