# Alpaca Integration - Quick Start Guide

## Overview

This guide shows how to integrate the Alpaca trading components into your existing paper trading application.

## Prerequisites

1. **Encryption Key Setup**
   - Generate a secure 32-character encryption key
   - Add to `.env` file:
   ```bash
   VITE_ENCRYPTION_KEY=your-32-character-key-here-xxx
   VITE_ALPACA_ENABLED=true
   ```

2. **Alpaca Account**
   - Sign up at [Alpaca Markets](https://alpaca.markets)
   - Get approved for options trading (Level 1-3)
   - Generate API keys from dashboard

## Step-by-Step Integration

### 1. Add Alpaca Setup to Settings Page

```typescript
// src/pages/Settings.tsx
import AlpacaSetupWizard from '../components/AlpacaSetupWizard'
import { useState } from 'react'

export default function Settings() {
  const [showAlpacaSetup, setShowAlpacaSetup] = useState(false)

  return (
    <div>
      {/* Existing settings content */}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Live Trading</h2>
        <button
          onClick={() => setShowAlpacaSetup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Connect Alpaca Account
        </button>
      </div>

      {showAlpacaSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AlpacaSetupWizard
            onComplete={() => {
              setShowAlpacaSetup(false)
              alert('Alpaca account connected successfully!')
            }}
            onCancel={() => setShowAlpacaSetup(false)}
          />
        </div>
      )}
    </div>
  )
}
```

### 2. Add Trading Mode Toggle to Header

```typescript
// src/components/Layout.tsx or AppLayout.tsx
import TradingModeToggle from './TradingModeToggle'
import { useState } from 'react'

export default function AppLayout() {
  const [tradingMode, setTradingMode] = useState<'paper' | 'alpaca-paper' | 'alpaca-live'>('paper')

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold">Options Trading Platform</div>

          {/* Add trading mode toggle */}
          <TradingModeToggle
            currentMode={tradingMode}
            onModeChange={setTradingMode}
          />
        </div>
      </header>

      {/* Rest of layout */}
    </div>
  )
}
```

### 3. Add Alpaca Dashboard to Dashboard Page

```typescript
// src/pages/Dashboard.tsx
import AlpacaAccountDashboard from '../components/AlpacaAccountDashboard'
import { useContext } from 'react'

export default function Dashboard() {
  const tradingMode = 'alpaca-paper' // Get from context

  return (
    <div className="space-y-6">
      {/* Show Alpaca dashboard when in Alpaca mode */}
      {tradingMode.startsWith('alpaca-') && (
        <AlpacaAccountDashboard
          environment={tradingMode === 'alpaca-live' ? 'live' : 'paper'}
        />
      )}

      {/* Existing dashboard content */}
    </div>
  )
}
```

### 4. Extend OptionsContext for Alpaca Orders

```typescript
// src/context/OptionsContext.tsx
import { AlpacaService } from '../services/alpacaService'
import { AlpacaComplianceService } from '../services/alpacaComplianceService'

// Add to state
interface OptionsState {
  // ... existing state
  tradingMode: 'paper' | 'alpaca-paper' | 'alpaca-live'
  alpacaAccountInfo: any | null
}

// Add action types
type OptionsAction =
  | { type: 'SET_TRADING_MODE'; payload: 'paper' | 'alpaca-paper' | 'alpaca-live' }
  | { type: 'PLACE_ALPACA_ORDER'; payload: any }
  // ... existing actions

// In reducer
case 'PLACE_ALPACA_ORDER': {
  // Handle Alpaca order placement
  const { orderDetails } = action.payload

  // For paper mode, use existing logic
  if (state.tradingMode === 'paper') {
    return { ...state, /* existing paper trading logic */ }
  }

  // For Alpaca mode, mark as pending (actual placement happens in effect)
  const newOrder = {
    id: Date.now().toString(),
    ...orderDetails,
    status: 'pending_alpaca',
    timestamp: new Date()
  }

  return {
    ...state,
    orders: [...state.orders, newOrder]
  }
}

// Add effect to handle Alpaca orders
useEffect(() => {
  const pendingAlpacaOrders = state.orders.filter(o => o.status === 'pending_alpaca')

  pendingAlpacaOrders.forEach(async (order) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const environment = state.tradingMode === 'alpaca-live' ? 'live' : 'paper'

      // Get account info for compliance check
      const accountInfo = await AlpacaService.getAccount(user.id, environment)

      // Pre-trade compliance
      const { canProceed, checks } = await AlpacaComplianceService.performPreTradeCompliance(
        user.id,
        order,
        accountInfo
      )

      if (!canProceed) {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: {
          orderId: order.id,
          status: 'rejected',
          error: checks.find(c => c.severity === 'error')?.message
        }})
        return
      }

      // Place order with Alpaca
      const alpacaOrder = await AlpacaService.placeOrder(user.id, environment, {
        symbol: order.contractTicker,
        qty: order.quantity,
        side: order.type === 'buy_to_open' ? 'buy' : 'sell',
        type: order.orderType,
        time_in_force: 'day',
        limit_price: order.price
      })

      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: {
        orderId: order.id,
        status: 'filled',
        alpacaOrderId: alpacaOrder.id
      }})
    } catch (error: any) {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: {
        orderId: order.id,
        status: 'rejected',
        error: error.message
      }})
    }
  })
}, [state.orders, state.tradingMode])
```

### 5. Add Compliance Warning Modal

```typescript
// src/components/ComplianceWarningModal.tsx
import { AlertTriangle } from 'lucide-react'

interface ComplianceWarningModalProps {
  checks: any[]
  onProceed: () => void
  onCancel: () => void
}

export function ComplianceWarningModal({ checks, onProceed, onCancel }: ComplianceWarningModalProps) {
  const errors = checks.filter(c => c.severity === 'error')
  const warnings = checks.filter(c => c.severity === 'warning')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
          <h3 className="text-xl font-bold text-gray-900">Compliance Check</h3>
        </div>

        {errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-900 mb-2">Errors (Cannot Proceed):</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              {errors.map((e, i) => <li key={i}>{e.message}</li>)}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Warnings:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              {warnings.map((w, i) => <li key={i}>{w.message}</li>)}
            </ul>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {errors.length === 0 && (
            <button
              onClick={onProceed}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {warnings.length > 0 ? 'Proceed Anyway' : 'Proceed'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 6. Update Order Placement Component

```typescript
// In your order placement component
import { AlpacaComplianceService } from '../services/alpacaComplianceService'
import { ComplianceWarningModal } from './ComplianceWarningModal'

function OrderPlacementComponent() {
  const [showComplianceModal, setShowComplianceModal] = useState(false)
  const [complianceChecks, setComplianceChecks] = useState([])
  const [pendingOrder, setPendingOrder] = useState(null)

  const handlePlaceOrder = async (orderDetails) => {
    const tradingMode = 'alpaca-live' // Get from context

    if (tradingMode.startsWith('alpaca-')) {
      // Run compliance checks
      const { data: { user } } = await supabase.auth.getUser()
      const environment = tradingMode === 'alpaca-live' ? 'live' : 'paper'
      const accountInfo = await AlpacaService.getAccount(user.id, environment)

      const { canProceed, checks } = await AlpacaComplianceService.performPreTradeCompliance(
        user.id,
        orderDetails,
        accountInfo
      )

      setComplianceChecks(checks)

      if (checks.some(c => c.severity === 'error')) {
        setShowComplianceModal(true)
        setPendingOrder(orderDetails)
        return
      }

      if (checks.some(c => c.severity === 'warning')) {
        setShowComplianceModal(true)
        setPendingOrder(orderDetails)
        return
      }
    }

    // Place order
    dispatch({ type: 'PLACE_ALPACA_ORDER', payload: orderDetails })
  }

  return (
    <>
      {/* Order form */}

      {showComplianceModal && (
        <ComplianceWarningModal
          checks={complianceChecks}
          onProceed={() => {
            dispatch({ type: 'PLACE_ALPACA_ORDER', payload: pendingOrder })
            setShowComplianceModal(false)
          }}
          onCancel={() => setShowComplianceModal(false)}
        />
      )}
    </>
  )
}
```

## Environment Configuration

Add these to your `.env` file:

```bash
# Required
VITE_ENCRYPTION_KEY=generate-a-secure-32-character-key

# Optional
VITE_ALPACA_ENABLED=true
VITE_ALPACA_DEFAULT_ENVIRONMENT=paper
VITE_ALPACA_SYNC_INTERVAL=30000
```

## Testing Checklist

### Paper Trading Mode
- [ ] Can place orders in paper mode
- [ ] Orders execute instantly
- [ ] Positions update correctly
- [ ] No Alpaca API calls made

### Alpaca Paper Mode
- [ ] Credentials connect successfully
- [ ] Account dashboard loads
- [ ] Orders route to Alpaca
- [ ] Positions sync from Alpaca
- [ ] Compliance checks run
- [ ] PDT warnings appear

### Alpaca Live Mode
- [ ] Safety confirmation modal appears
- [ ] Live trading indicator visible
- [ ] All compliance checks enforced
- [ ] Real money warning shown
- [ ] Orders execute on live account

### Compliance
- [ ] PDT status displays correctly
- [ ] Day trade count accurate
- [ ] Buying power validated
- [ ] Trading level enforced
- [ ] Pre-trade warnings shown
- [ ] Blocked trades don't execute

### Security
- [ ] Credentials encrypted in database
- [ ] API keys never visible in logs
- [ ] RLS policies prevent data leaks
- [ ] Audit trail records all actions
- [ ] IP addresses captured

## Troubleshooting

### "Encryption key not found"
- Add `VITE_ENCRYPTION_KEY` to `.env` file
- Must be exactly 32 characters
- Restart dev server after adding

### "Invalid credentials"
- Verify API keys from Alpaca dashboard
- Ensure correct environment (paper vs live)
- Check keys have options trading permissions
- Try regenerating keys in Alpaca

### "Buying power insufficient"
- Check account buying power in Alpaca
- Verify order size
- Options require 100x multiplier consideration
- Paper accounts may have limited buying power

### "Pattern Day Trader violation"
- Check day trade count in last 5 days
- Verify account equity > $25,000 if PDT
- Hold positions overnight to avoid day trades
- Switch to paper mode to practice

## Support

For issues with:
- **Alpaca API**: Contact Alpaca support or check [docs.alpaca.markets](https://docs.alpaca.markets)
- **Integration**: Check console logs for detailed error messages
- **Compliance**: Review `trading_compliance_log` table for check history
- **Database**: Check `alpaca_trading_activity_log` for audit trail

## Next Steps

1. Test in paper mode first
2. Verify compliance checks work
3. Practice with small positions
4. Monitor audit logs
5. Review PDT status regularly
6. Keep encryption key secure
