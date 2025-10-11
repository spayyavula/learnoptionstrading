# Interactive Brokers Integration - Quick Start Guide

## Overview

This guide shows how to integrate Interactive Brokers (IBKR) Client Portal API into your paper trading application, providing similar functionality to the existing Alpaca integration with full feature parity.

## Prerequisites

### 1. IBKR Account Requirements
- **Account Type**: IBKR Pro (Lite accounts not supported)
- **Account Status**: Fully funded and approved
- **Options Trading**: Account must be approved for options trading (Level 1-3)
- **Paper Trading Account**: Available through Account Management portal

### 2. Client Portal Gateway Setup
The IBKR Client Portal Gateway is a local Java application that handles authentication:

1. **Download Gateway**:
   - Visit https://www.interactivebrokers.com/en/trading/ib-api.php
   - Download "Client Portal Gateway" for your OS
   - Extract the downloaded file

2. **Run Gateway**:
   ```bash
   # On Mac/Linux
   cd clientportal.gw
   ./bin/run.sh root/conf.yaml

   # On Windows
   cd clientportal.gw
   bin\run.bat root\conf.yaml
   ```

3. **Login**:
   - Gateway will open a browser window
   - Log in with your IBKR credentials
   - Complete 2FA authentication
   - Gateway runs at https://localhost:5000 by default

### 3. Environment Configuration

Add the following to your `.env` file:

```bash
# Required - Shared encryption key (32 characters minimum)
VITE_ENCRYPTION_KEY=your-secure-32-character-encryption-key-here

# Interactive Brokers Configuration
VITE_IBKR_ENABLED=true
VITE_IBKR_GATEWAY_HOST=localhost
VITE_IBKR_GATEWAY_PORT=5000
VITE_IBKR_GATEWAY_SSL=true
VITE_IBKR_DEFAULT_ENVIRONMENT=paper
VITE_IBKR_SYNC_INTERVAL=30000          # 30 seconds
VITE_IBKR_TICKLE_INTERVAL=240000       # 4 minutes
VITE_IBKR_SESSION_WARNING_MINUTES=60   # Warn 1 hour before expiry
```

## Step-by-Step Integration

### 1. Apply Database Migration

The IBKR integration requires several database tables. The migration has already been created:

```bash
# Migration file: supabase/migrations/20251011150000_create_ibkr_tables.sql
```

Tables created:
- `ibkr_credentials` - Encrypted gateway connection details
- `ibkr_account_info` - Account metadata and buying power
- `ibkr_positions` - Real-time position synchronization
- `ibkr_orders` - Order history and status tracking
- `ibkr_session_tracking` - Gateway session management
- `ibkr_trading_activity_log` - Audit trail for all activities
- `ibkr_compliance_acknowledgments` - User compliance acknowledgments

### 2. Enable IBKR in Settings

Add IBKR setup section to your Settings page:

```typescript
// src/pages/Settings.tsx
import IBKRSetupWizard from '../components/IBKRSetupWizard'
import { useState } from 'react'

export default function Settings() {
  const [showIBKRSetup, setShowIBKRSetup] = useState(false)

  return (
    <div>
      {/* Existing settings content */}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Interactive Brokers</h2>
        <button
          onClick={() => setShowIBKRSetup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Connect IBKR Account
        </button>
      </div>

      {showIBKRSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <IBKRSetupWizard
            onComplete={() => {
              setShowIBKRSetup(false)
              alert('IBKR account connected successfully!')
            }}
            onCancel={() => setShowIBKRSetup(false)}
          />
        </div>
      )}
    </div>
  )
}
```

### 3. Connect Your IBKR Account

1. Navigate to Settings page
2. Click "Connect IBKR Account"
3. Follow the 4-step wizard:
   - **Step 1**: Choose Paper or Live trading environment
   - **Step 2**: Configure Gateway connection and enter username
   - **Step 3**: Verify account connection and review account info
   - **Step 4**: Acknowledge required compliance disclosures

### 4. Session Management

IBKR sessions require active management:

**Automatic Session Maintenance:**
- Sessions automatically "tickle" every 4 minutes to prevent timeout
- Sessions last up to 24 hours before requiring re-authentication
- Warning appears 1 hour before session expiry

**Manual Session Management:**
- Check connection status in Settings
- Re-authenticate if session expires
- Logout when done trading

### 5. Testing with Paper Trading

**Important**: Always test with paper trading first!

1. **Setup Paper Account**:
   - Log into IBKR Account Management
   - Navigate to Settings > Account Management
   - Request Paper Trading Account
   - Note your paper trading username (different from live)

2. **Connect Paper Account**:
   - Run Client Portal Gateway
   - Login with paper trading credentials
   - Connect via setup wizard using paper username

3. **Verify Functionality**:
   - Check account dashboard loads correctly
   - View positions and buying power
   - Place a test order
   - Verify compliance checks work
   - Test position synchronization

### 6. Using IBKR for Trading

Once connected, you can:

**Switch Trading Modes:**
- Use trading mode selector in app header
- Choose between: Local Paper, Alpaca Paper, Alpaca Live, IBKR Paper, IBKR Live
- Visual indicators show active broker and environment

**Place Orders:**
- Select options contracts as usual
- Orders route to IBKR when in IBKR mode
- Pre-trade compliance checks run automatically
- Some orders may require confirmation via reply endpoint

**Monitor Positions:**
- Real-time position sync every 30 seconds
- View unrealized P&L
- Close positions directly
- Exercise options when in-the-money

**View Account Info:**
- Portfolio value and equity
- Buying power and available funds
- Day trade count and PDT status
- Options trading level and restrictions

## Architecture Overview

### Service Layer

**ibkrService.ts** - Core Client Portal API integration:
- Gateway connection management
- Authentication and session handling
- Account data retrieval
- Order placement and management
- Position synchronization
- Contract search and details

**ibkrComplianceService.ts** - Regulatory compliance:
- Pattern Day Trader (PDT) status checking
- Buying power validation
- Trading level restrictions enforcement
- Pre-trade compliance checks
- Regulatory disclosure management

**ibkrSessionService.ts** - Session lifecycle:
- Session initialization and authentication
- Automatic tickle mechanism (4-minute interval)
- Session expiry detection and warnings
- Re-authentication flow
- Background session monitoring

### Database Tables

All tables include Row Level Security (RLS) policies ensuring users can only access their own data:

**ibkr_credentials**:
- Gateway connection configuration
- Encrypted username storage
- Environment selection (paper/live)
- Options trading level

**ibkr_session_tracking**:
- Current session status
- Authentication state
- Last tickle timestamp
- Session expiry time

**ibkr_account_info**:
- Account ID and number
- Buying power and equity
- PDT status and day trade count
- Portfolio value

**ibkr_positions**:
- Contract ID (conid) and symbol
- Quantity and average price
- Current market value
- Unrealized P&L

**ibkr_orders**:
- Order ID and status
- Symbol and contract details
- Fill information
- Timestamps

## Important Limitations and Considerations

### IBKR-Specific Requirements

1. **Gateway Must Be Running**:
   - Client Portal Gateway must be running locally
   - Gateway must be authenticated before API calls
   - Gateway disconnects during IBKR maintenance windows (typically 11:45 PM - 12:30 AM ET)

2. **Rate Limits**:
   - Gateway users: 10 requests per second
   - OAuth users: 50 requests per second
   - Plan API calls accordingly

3. **Session Management**:
   - Sessions expire after 24 hours or at midnight (NY/Zug/HK time)
   - Must tickle every 5 minutes to maintain session
   - Re-authentication requires browser interaction

4. **Order Confirmations**:
   - Some orders require user confirmation via `/iserver/reply` endpoint
   - Handle confirmation dialogs appropriately

5. **Paper vs Live Accounts**:
   - Different usernames for paper and live
   - Must specify correct environment when connecting
   - Cannot switch environments without reconnecting

### Common Issues and Solutions

**"Gateway not running" error:**
- Ensure Client Portal Gateway is running
- Check gateway is at specified host:port
- Verify SSL setting matches gateway configuration

**"Not authenticated" error:**
- Log in to Gateway via browser
- Complete 2FA authentication
- Check session hasn't expired

**"Invalid credentials" error:**
- Verify you're using correct username for environment
- Paper username differs from live username
- Check credentials in IBKR Account Management

**Session expires frequently:**
- Verify tickle mechanism is running
- Check browser doesn't block cookies
- Ensure Gateway stays running

**Orders not executing:**
- Check compliance requirements (PDT, buying power, trading level)
- Verify order confirmation if required
- Check order status in IBKR

**Positions not syncing:**
- Verify session is authenticated
- Check sync interval configuration
- Manually trigger sync from dashboard

## Security Best Practices

1. **Encryption Key**:
   - Generate a secure 32-character encryption key
   - Store in environment variable, never commit to code
   - Rotate periodically for enhanced security

2. **Gateway Security**:
   - Gateway runs on localhost by default
   - Uses HTTPS with self-signed certificate
   - Do not expose Gateway to external networks

3. **Session Management**:
   - Log out when done trading
   - Don't leave Gateway running unattended
   - Monitor session activity logs

4. **Credential Storage**:
   - Credentials encrypted with AES-256
   - Stored separately per environment
   - Can be deleted via Settings page

5. **Audit Trail**:
   - All API calls logged to `ibkr_trading_activity_log`
   - Compliance checks recorded in `trading_compliance_log`
   - Review logs periodically for suspicious activity

## Testing Checklist

### Paper Trading Mode
- [ ] Gateway runs successfully
- [ ] Can log in to paper account
- [ ] Connection test passes
- [ ] Account dashboard loads
- [ ] Positions sync correctly
- [ ] Can place market orders
- [ ] Can place limit orders
- [ ] Compliance checks work
- [ ] PDT warnings appear
- [ ] Session tickle maintains connection

### Compliance Checks
- [ ] PDT status displays correctly
- [ ] Day trade count accurate
- [ ] Buying power validated
- [ ] Trading level enforced
- [ ] Pre-trade warnings shown
- [ ] Blocked trades don't execute

### Session Management
- [ ] Session initializes successfully
- [ ] Tickle maintains session
- [ ] Expiry warning appears
- [ ] Can re-authenticate
- [ ] Logout works correctly

### Data Synchronization
- [ ] Positions sync automatically
- [ ] Orders sync automatically
- [ ] Account info updates
- [ ] P&L calculations correct

## Transitioning to Live Trading

**Only proceed to live trading after thorough paper trading testing!**

1. **Requirements**:
   - Successfully tested all features in paper mode
   - Understand options trading risks
   - Acknowledged all compliance disclosures
   - Have minimum $25,000 for PDT (if day trading)

2. **Setup**:
   - Disconnect paper account in Settings
   - Click "Connect IBKR Account" again
   - Select "Live Trading" environment
   - Use live account username
   - Test connection

3. **Safety Measures**:
   - Start with small positions
   - Use limit orders initially
   - Monitor positions closely
   - Review compliance warnings carefully
   - Keep adequate buying power buffer

4. **Monitoring**:
   - Check positions multiple times daily
   - Review order fills promptly
   - Monitor PDT status if day trading
   - Review audit logs regularly

## Support and Troubleshooting

**For IBKR API Issues**:
- IBKR Client Portal API Documentation: https://interactivebrokers.github.io/cpwebapi/
- IBKR Support: https://www.interactivebrokers.com/en/support/main.php

**For Integration Issues**:
- Check console logs for detailed error messages
- Review `ibkr_trading_activity_log` table for API call history
- Verify environment variables are set correctly
- Ensure Gateway is running and authenticated

**Common Gateway Issues**:
- Check Gateway logs in console output
- Verify Java is installed and updated
- Try restarting Gateway
- Clear browser cookies if auth fails

## Next Steps

1. **Complete Paper Trading Testing**:
   - Test all order types
   - Verify multi-leg strategies
   - Check position management
   - Test option exercise

2. **Review Compliance**:
   - Understand PDT rules
   - Know your trading level restrictions
   - Review margin requirements
   - Read all risk disclosures

3. **Monitor and Optimize**:
   - Track trading performance
   - Review compliance logs
   - Optimize session management
   - Refine order strategies

4. **Consider Live Trading**:
   - Only after extensive paper testing
   - Start small and scale gradually
   - Maintain strict risk management
   - Keep learning and adapting

## Additional Resources

- [IBKR Client Portal API Documentation](https://interactivebrokers.github.io/cpwebapi/)
- [IBKR Options Trading Guide](https://www.interactivebrokers.com/en/trading/options.php)
- [Pattern Day Trader Rules](https://www.finra.org/investors/learn-to-invest/advanced-investing/day-trading-margin-requirements-know-rules)
- [Options Risk Disclosure](https://www.theocc.com/components/docs/riskstoc.pdf)

---

**Remember**: Options trading involves significant risk. Only trade with money you can afford to lose, and always paper trade first to familiarize yourself with the platform and strategies.
