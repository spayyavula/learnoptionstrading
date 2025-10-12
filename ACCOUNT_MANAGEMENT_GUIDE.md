# Account Management System - Developer Guide

Complete guide for using the Paper/Live Trading account management system.

## Overview

The account management system provides a clear distinction between paper trading and live broker accounts with:
- ✅ **AccountContext**: Manages selected account state
- ✅ **AccountSelector**: Header dropdown to switch accounts
- ✅ **ModeIndicatorBanner**: Persistent banner showing current mode
- ✅ **useAccountTheme**: Hook for color-coded UI themes
- ✅ **TradeConfirmationDialog**: Enhanced dialogs with live trade warnings
- ✅ **Account Filtering**: Filter data by selected account

## Quick Start

### 1. Access Account Information

```typescript
import { useAccount } from '../context/AccountContext'

function MyComponent() {
  const {
    selectedAccount,     // Current account object
    isPaperMode,         // true if paper trading
    isLiveMode,          // true if live broker account
    selectAccount,       // Function to switch accounts
    availableAccounts,   // Array of all accounts
    refreshAccounts      // Refresh broker connections
  } = useAccount()

  return (
    <div>
      <h2>Trading with: {selectedAccount.displayName}</h2>
      <p>Balance: ${selectedAccount.balance}</p>
      {isPaperMode && <span>📝 Paper Trading Mode</span>}
      {isLiveMode && <span>🔴 Live Trading Mode</span>}
    </div>
  )
}
```

### 2. Use Color-Coded Themes

```typescript
import { useAccountTheme } from '../hooks/useAccountTheme'

function MyComponent() {
  const theme = useAccountTheme()

  return (
    <div className={`${theme.bgPrimary} ${theme.border} border-2 rounded-lg p-6`}>
      <h2 className={theme.textPrimary}>
        {theme.modeIcon} {theme.modeName}
      </h2>
      <button className={`${theme.buttonPrimary} ${theme.buttonText} px-4 py-2 rounded`}>
        Place Trade
      </button>
    </div>
  )
}
```

### 3. Show Trade Confirmation Dialog

```typescript
import { TradeConfirmationDialog } from '../components/TradeConfirmationDialog'

function TradingComponent() {
  const [showDialog, setShowDialog] = useState(false)
  const [tradeDetails, setTradeDetails] = useState(null)

  const handleTrade = () => {
    setTradeDetails({
      action: 'BUY',
      symbol: 'AAPL',
      quantity: 100,
      price: 150.00,
      orderType: 'MARKET',
      totalCost: 15000.00
    })
    setShowDialog(true)
  }

  return (
    <>
      <button onClick={handleTrade}>Buy AAPL</button>

      <TradeConfirmationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={() => {
          // Execute trade
          console.log('Trade confirmed')
          setShowDialog(false)
        }}
        tradeDetails={tradeDetails}
      />
    </>
  )
}
```

### 4. Filter Data by Account

```typescript
import { useAccount } from '../context/AccountContext'

function PositionsTable() {
  const { selectedAccount } = useAccount()

  // Your positions data
  const allPositions = [
    { id: '1', symbol: 'AAPL', accountId: 'paper', ... },
    { id: '2', symbol: 'TSLA', accountId: 'alpaca-live', ... },
    { id: '3', symbol: 'SPY', accountId: 'paper', ... }
  ]

  // Filter by selected account
  const positions = allPositions.filter(
    pos => pos.accountId === selectedAccount.id
  )

  return (
    <table>
      {positions.map(pos => (
        <tr key={pos.id}>
          <td>{pos.symbol}</td>
          {/* ... */}
        </tr>
      ))}
    </table>
  )
}
```

## AccountContext API

### Selected Account Object

```typescript
interface TradingAccount {
  id: string                    // Unique account ID
  name: string                  // Broker name
  mode: 'paper' | 'live'        // Account mode
  broker?: BrokerType           // Broker type
  balance: number               // Account balance
  currency: string              // 'USD' or 'INR'
  isConnected: boolean          // Connection status
  displayName: string           // Display name (with emoji)
  description: string           // Account description
}
```

### Account IDs

- `'paper'` - Paper trading account
- `'alpaca-paper'` - Alpaca paper account
- `'alpaca-live'` - Alpaca live account
- `'ibkr-live'` - Interactive Brokers live
- `'robinhood-live'` - Robinhood Crypto live
- `'zerodha-live'` - Zerodha live
- `'icici-live'` or `'icici-demo'` - ICICI Direct
- `'hdfc-live'` or `'hdfc-demo'` - HDFC Securities

## Theme Colors

The `useAccountTheme()` hook provides these classes:

**Paper Mode (Green)**:
```typescript
{
  bgPrimary: 'bg-green-50',
  bgSecondary: 'bg-green-100',
  textPrimary: 'text-green-900',
  buttonPrimary: 'bg-green-600 hover:bg-green-700',
  badgeBg: 'bg-green-100',
  badgeText: 'text-green-800',
  border: 'border-green-300',
  modeIcon: '📝',
  modeName: 'Paper Trading'
}
```

**Live Mode (Red)**:
```typescript
{
  bgPrimary: 'bg-red-50',
  bgSecondary: 'bg-red-100',
  textPrimary: 'text-red-900',
  buttonPrimary: 'bg-red-600 hover:bg-red-700',
  badgeBg: 'bg-red-100',
  badgeText: 'text-red-800',
  border: 'border-red-300',
  modeIcon: '🔴',
  modeName: 'Live Trading'
}
```

## Integration Examples

### Example 1: Position Card

```typescript
import { useAccount } from '../context/AccountContext'
import { useAccountTheme } from '../hooks/useAccountTheme'

function PositionCard({ position }) {
  const { selectedAccount } = useAccount()
  const theme = useAccountTheme()

  return (
    <div className={`${theme.bgPrimary} border-2 ${theme.border} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-bold ${theme.textPrimary}`}>{position.symbol}</h3>
        <span className={`${theme.badgeBg} ${theme.badgeText} px-2 py-1 rounded text-xs font-bold`}>
          {selectedAccount.name}
        </span>
      </div>
      <div className="text-2xl font-bold">
        ${position.currentPrice}
      </div>
      <div className={`text-sm ${theme.textSecondary}`}>
        P/L: {position.pl >= 0 ? '+' : ''}{position.pl}%
      </div>
    </div>
  )
}
```

### Example 2: Trading Button

```typescript
function TradeButton({ onClick }) {
  const { isPaperMode } = useAccount()
  const theme = useAccountTheme()

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-bold ${theme.buttonPrimary} ${theme.buttonText} transition-all hover:shadow-lg`}
    >
      {theme.modeIcon} {isPaperMode ? 'Place Paper Trade' : '⚠️ PLACE LIVE TRADE'}
    </button>
  )
}
```

### Example 3: Account Status Banner

```typescript
function AccountStatusBanner() {
  const { selectedAccount, isPaperMode } = useAccount()
  const theme = useAccountTheme()

  return (
    <div className={`${theme.alertBg} border ${theme.alertBorder} rounded-lg p-3 flex items-center space-x-3`}>
      <span className="text-2xl">{theme.modeIcon}</span>
      <div>
        <div className={`font-bold ${theme.alertText}`}>
          {theme.modeName}
        </div>
        <div className="text-sm text-gray-600">
          {selectedAccount.displayName} • Balance: ${selectedAccount.balance.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Always Filter by Account

```typescript
// ❌ Don't show all positions
const positions = allPositions

// ✅ Filter by selected account
const positions = allPositions.filter(
  pos => pos.accountId === selectedAccount.id
)
```

### 2. Use Confirmation Dialogs

```typescript
// ❌ Don't execute trades directly
const executeTrade = () => {
  api.placeTrade(...)
}

// ✅ Show confirmation dialog first
const executeTrade = () => {
  setTradeDetails(...)
  setShowConfirmation(true)
}
```

### 3. Show Account Context

```typescript
// ❌ Generic message
<p>You have 5 positions</p>

// ✅ Account-specific message
<p>You have 5 positions in {selectedAccount.displayName}</p>
```

### 4. Use Theme Colors

```typescript
// ❌ Hardcoded colors
<div className="bg-blue-50 border-blue-300">

// ✅ Theme colors
<div className={`${theme.bgPrimary} ${theme.border} border-2`}>
```

### 5. Handle Currency

```typescript
const formatCurrency = (amount: number) => {
  if (selectedAccount.currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  return `$${amount.toLocaleString('en-US')}`
}
```

## Migration Guide

To update existing components:

### Step 1: Add Hooks

```typescript
// Add at top of component
import { useAccount } from '../context/AccountContext'
import { useAccountTheme } from '../hooks/useAccountTheme'

function MyComponent() {
  const { selectedAccount, isPaperMode } = useAccount()
  const theme = useAccountTheme()

  // Rest of component...
}
```

### Step 2: Filter Data

```typescript
// Find where you load positions/orders
const allPositions = useContext(TradingContext).positions

// Add filter
const positions = allPositions.filter(
  pos => pos.accountId === selectedAccount.id
)
```

### Step 3: Update Styles

```typescript
// Replace hardcoded colors with theme
// Before:
<div className="bg-blue-50 text-blue-900">

// After:
<div className={`${theme.bgPrimary} ${theme.textPrimary}`}>
```

### Step 4: Add Confirmation Dialogs

```typescript
import { TradeConfirmationDialog } from '../components/TradeConfirmationDialog'

// Add state
const [showConfirmation, setShowConfirmation] = useState(false)
const [tradeDetails, setTradeDetails] = useState(null)

// Update trade handler
const handleTrade = () => {
  setTradeDetails({ ... })
  setShowConfirmation(true)
}

// Add dialog
<TradeConfirmationDialog ... />
```

## Testing

### Test Different Accounts

```typescript
// In your component or test
const { selectAccount } = useAccount()

// Switch to paper
selectAccount('paper')

// Switch to live
selectAccount('alpaca-live')
```

### Mock Account Context

```typescript
// In tests
import { AccountProvider } from '../context/AccountContext'

<AccountProvider>
  <YourComponent />
</AccountProvider>
```

## Troubleshooting

**Q: Theme colors not showing?**
A: Make sure you're using the `useAccountTheme()` hook and applying the classes.

**Q: Positions not filtering?**
A: Check that your position data has `accountId` field matching `selectedAccount.id`.

**Q: Confirmation dialog not showing?**
A: Ensure `isOpen` prop is true and `tradeDetails` is populated.

**Q: Account selector not showing brokers?**
A: Brokers need to be connected first via BrokerConnections page.

## Examples

See these files for complete examples:
- `src/components/AccountAwarePositions.tsx` - Full example component
- `src/components/AccountSelector.tsx` - Account switching
- `src/components/TradeConfirmationDialog.tsx` - Confirmation dialogs
- `src/context/AccountContext.tsx` - Context implementation

## Next Steps

1. ✅ Review the example component: `AccountAwarePositions.tsx`
2. ✅ Use `TradeConfirmationDialog` in your trading forms
3. ✅ Apply `useAccountTheme()` for consistent styling
4. ✅ Filter all positions/orders by `selectedAccount.id`
5. ✅ Test switching between paper and live accounts

---

**Happy Trading! 📝💰**

*Build safe, user-friendly trading experiences with clear paper/live distinctions.*
