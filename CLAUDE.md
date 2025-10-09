# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A paper trading platform for options and stock trading education, built with React, TypeScript, and Vite. Features real-time market data integration via Polygon.io, options pricing with Black-Scholes, multi-leg strategy builder, sentiment analysis, and community sharing features.

## Common Development Commands

### Development
```bash
npm run dev              # Start dev server on port 5173
npm run build            # Production build (output: dist/)
npm run preview          # Preview production build locally
```

### Testing
```bash
npm run test             # Run unit tests with Vitest
npm run test:e2e         # Run Playwright E2E tests
npx playwright test tests/[file].spec.ts  # Run specific test file
```

### Deployment
```bash
npm run deploy           # Deploy to Netlify (preview)
npm run deploy:prod      # Deploy to Netlify (production)
```

## Architecture

### State Management
The app uses React Context API for global state, organized into three main contexts:

- **TradingContext** (`src/context/TradingContext.tsx`): Stock trading state, positions, orders, watchlist
- **OptionsContext** (`src/context/OptionsContext.tsx`): Options positions, orders, multi-leg strategies, contract data
- **OptionsDataContext** (`src/context/OptionsDataContext.tsx`): Real-time options chain data, price updates

All contexts use reducer patterns for state updates and persist data to localStorage.

### Service Layer Architecture
Services in `src/services/` follow a class-based pattern with static methods. Key services:

- **polygonService.ts**: Market data provider, falls back to mock data when API unavailable
- **optionsChainGenerator.ts**: Generates comprehensive options chains (20 strikes × multiple expirations per underlying)
- **blackScholesService.ts**: Options pricing and Greeks calculations
- **greeksCalculator.ts**: Real-time Greeks updates for positions
- **liveOptionsDataService.ts**: Manages real-time price updates via polling
- **strategyValidationService.ts**: Validates multi-leg strategies, calculates payoffs
- **communityService.ts**: Multi-platform sharing (Slack, Discord, Telegram, WhatsApp, Facebook)
- **tradingHistoryService.ts**: Tracks trade history with localStorage persistence

### Data Flow Pattern

1. **Real-time Updates**: `liveOptionsDataService` polls Polygon API → updates OptionsDataContext → components re-render
2. **Trading Actions**: Component dispatches action → Context reducer updates state → localStorage sync → position/order updates
3. **Multi-leg Strategies**: User builds strategy → strategyValidationService validates → OptionsContext creates multi-leg order → positions created for each leg

### Key Components

- **MultiLegStrategyBuilder** (`src/components/MultiLegStrategyBuilder.tsx`): Visual strategy builder with payoff diagrams
- **InteractivePayoffDiagram** (`src/components/InteractivePayoffDiagram.tsx`): Real-time P&L visualization
- **EnhancedOptionsChain** (`src/components/EnhancedOptionsChain.tsx`): Full options chain display with filtering
- **EnhancedTrading** (`src/components/EnhancedTrading.tsx`): Main trading interface

### Routing Structure

- **Public routes**: Landing (`/`), Login, Subscription pages
- **App routes**: Nested under `/app/*` with AppLayout wrapper
- **Landing page gate**: Users must visit landing page before accessing app routes (enforced by RequireLandingVisit component)

### Environment Variables

All variables must be prefixed with `VITE_` to be accessible in frontend.

**Required**:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Database/auth
- `VITE_POLYGON_API_KEY`: Market data (defaults to 'demo_api_key')

**Feature flags**:
- `VITE_ENABLE_REAL_TIME_DATA`: Enable live API calls (default: false)
- `VITE_ENABLE_MOCK_DATA`: Use simulated data (default: true)

**Optional**: Stripe keys, community webhooks, analytics APIs (see `.env.example`)

After changing environment variables, restart the dev server.

### Options Chain Data Structure

Options chains are generated with:
- 20 strike prices per expiration (10 OTM, 10 ITM relative to current underlying price)
- Multiple expirations per underlying (typically 4-6 dates)
- Full Greeks (delta, gamma, theta, vega) calculated via Black-Scholes
- Implied volatility, intrinsic/time value, bid/ask/last prices

Contracts are filtered to remove expired options using `filterExpiredContracts()` helper.

## Important Patterns

### Error Handling
- ErrorBoundary component wraps entire app
- Services catch API errors and fall back to mock data
- ErrorDisplay component shows errors in dev mode only

### Mock Data Strategy
In development or when API keys are missing, the app seamlessly falls back to simulated data. This allows full feature testing without external dependencies. Check service files for `ENABLE_MOCK_DATA` conditionals.

### Multi-leg Order Processing
When placing multi-leg strategies (spreads, strangles, etc.):
1. StrategyValidationService validates the strategy configuration
2. OptionsContext creates individual positions for each leg
3. TradingHistoryService records the strategy as a single trade
4. Greeks are aggregated across all legs for portfolio Greeks

### Component Lazy Loading
Pages are lazy-loaded via React.lazy() in App.tsx to improve initial load time. All lazy components are wrapped in Suspense with LoadingFallback.

## Testing Notes

- E2E tests use Playwright and cover navigation, trading workflows, portfolio management
- Tests in `tests/` directory mirror page structure
- Mock data is used for all tests (no external API calls during testing)
- Run specific tests with: `npx playwright test tests/[filename].spec.ts`

## Build Configuration

- **Vite** handles bundling with code splitting configured in vite.config.ts
- Manual chunks: `react-vendor`, `chart-vendor`, `utils`
- Build target: ES2020
- TypeScript strict mode is disabled for faster prototyping (tsconfig.json)
- Assets are hashed for cache busting

## Deployment (Netlify)

- Build command: `npm run build`
- Publish directory: `dist/`
- Node version: 20 (specified in netlify.toml)
- SPA routing handled via redirects in netlify.toml
- Environment variables must be set in Netlify dashboard

## Code Organization Guidelines

- **Pages** (`src/pages/`): Route components, should compose smaller components
- **Components** (`src/components/`): Reusable UI components
- **Services** (`src/services/`): Business logic, API calls, calculations
- **Types** (`src/types/`): TypeScript interfaces for domain models
- **Context** (`src/context/`): Global state management

When adding new options-related features, always update the relevant Context (OptionsContext or OptionsDataContext) and ensure localStorage persistence is maintained.
