# Sensibull-Style Strategy Builder

A comprehensive multi-leg options strategy builder inspired by Sensibull's interface.

## Features Implemented

### 1. Strategy Leg Management
- **Add/Remove Legs**: Dynamically add or remove option legs to build complex strategies
- **Buy/Sell Toggle**: Switch between buying and selling with a single click
- **Strike Selection**: Increment/decrement strike prices with +/- buttons or direct input
- **Expiry Selection**: Choose from available expiration dates
- **Lot Size Control**: Select quantity of contracts (1-10 lots)
- **Live Price Updates**: Automatic price updates from available contracts

### 2. Real-time P&L Calculations
- **Max Profit**: Calculate maximum potential profit
- **Max Loss**: Calculate maximum potential loss  
- **Breakeven Points**: Identify exact breakeven prices
- **Reward/Risk Ratio**: Compare potential reward to risk (1x format)
- **POP (Probability of Profit)**: Estimated probability of profit
- **Time Value**: Show time decay component
- **Intrinsic Value**: Show intrinsic value component

### 3. Interactive Payoff Diagram
- **Dual-Axis Chart**: 
  - Primary axis: Profit/Loss curves
  - Secondary axis: Open Interest bars
- **On Expiry vs Target Date**: Shows both scenarios
- **Call/Put OI Visualization**: Green bars for puts, red bars for calls
- **Current Price Marker**: Vertical line showing current underlying price
- **Breakeven Lines**: Visual markers for breakeven points
- **Zoom & Pan**: Interactive chart controls

### 4. Strategy Actions
- **Save Strategy**: Save custom strategies to database (requires login)
- **Share Strategy**: Generate shareable links for strategies
- **Clear/Reset**: Clear all legs or reset prices
- **Multiplier**: Apply strategy multiple times
- **Add to Drafts**: Save work-in-progress strategies

### 5. Tabs & Views
- **Payoff Graph**: Visual P&L representation with OI data
- **Payoff Table**: Tabular profit/loss at different prices
- **Greeks**: Delta, gamma, theta, vega analysis
- **Strategy Chart**: Alternative visual representation

### 6. Metrics Panel
Displays key strategy metrics:
- Max Profit/Loss with color coding (green/red)
- Breakeven with percentage move
- Target price (configurable)
- Expiry date
- Reward/Risk ratio
- POP percentage
- Time & Intrinsic values
- Funds & Margins (placeholder for broker integration)

## Usage

### Access the Strategy Builder
1. Navigate to `/app/strategy-builder` in your app
2. Or click "Strategy Builder" in the Trading menu

### Building a Strategy
1. Click "Add/Edit" to add a new leg
2. Configure each leg:
   - Select B (Buy) or S (Sell)
   - Choose expiry date
   - Set strike price
   - Select CE (Call) or PE (Put)
   - Choose number of lots
   - Verify price
3. View live payoff diagram as you build
4. Adjust multiplier if needed
5. Click "Save Strategy" to persist

### Example: Bull Call Spread
1. Add first leg: BUY 25300 CE
2. Add second leg: SELL 25500 CE
3. Same expiry date for both
4. View max profit, max loss, and breakeven
5. Adjust strikes to optimize risk/reward

## Technical Details

### Components
- **SensibullStrategyBuilder.tsx**: Main strategy builder component
- **StrategyBuilder.tsx**: Page wrapper with ticker selection
- **PayoffCalculationService**: P&L calculation engine
- **SavedStrategiesService**: Database persistence layer

### Database Tables
- `saved_strategies`: User's saved strategies
- `strategy_templates`: Pre-made strategy templates
- `strategy_shares`: Shareable strategy links

### Data Flow
1. Options contracts fetched from generator
2. User builds strategy with legs
3. Real-time P&L calculations
4. Chart renders with recharts library
5. Save action persists to Supabase

## Future Enhancements
- [ ] Greeks sensitivity analysis
- [ ] Scenario modeling (IV changes, time decay)
- [ ] Strategy comparisons
- [ ] Paper trading integration
- [ ] Broker API connections for live trading
- [ ] Strategy backtesting
- [ ] AI strategy suggestions
- [ ] Mobile-responsive design improvements

## Notes
- All calculations assume 100 shares per contract
- Prices update automatically when available
- OI data shown in crores (Cr) for Indian markets
- Strategy persistence requires authentication
