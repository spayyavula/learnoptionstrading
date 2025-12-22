# Options Academy - Application Architecture

A comprehensive paper trading platform for options and stock trading education, featuring real-time market data, advanced analytics, multi-leg strategy building, and community features.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema](#database-schema)
5. [External Services](#external-services)
6. [Authentication](#authentication)
7. [Deployment Infrastructure](#deployment-infrastructure)
8. [Data Flow Patterns](#data-flow-patterns)
9. [Security](#security)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Vite + TypeScript)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Trading  │ │ Options  │ │Analytics │ │Community │ │  Admin   │  │   │
│  │  │  Pages   │ │  Chain   │ │ & Charts │ │ Features │ │Dashboard │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              State Management (React Context)                │   │   │
│  │  │  TradingContext │ OptionsContext │ GamificationContext      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Azure Functions (Node.js v20)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Auth   │ │ Trading  │ │Strategies│ │  Stripe  │ │  Health  │  │   │
│  │  │ Functions│ │ Functions│ │ Functions│ │ Webhooks │ │  Checks  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │  Azure PostgreSQL  │  │     Polygon.io     │  │       Stripe       │    │
│  │   (Primary DB)     │  │   (Market Data)    │  │    (Payments)      │    │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Azure Functions v4, Node.js 20, TypeScript |
| Database | Azure PostgreSQL |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Hosting | Azure Static Web Apps (Frontend), Azure Functions (API) |
| CI/CD | GitHub Actions |
| Market Data | Polygon.io |
| Payments | Stripe |

---

## Frontend Architecture

### Directory Structure

```
src/
├── pages/                 # 38 route components
│   ├── Dashboard.tsx
│   ├── OptionsTrading.tsx
│   ├── OptionsChain.tsx
│   ├── Analytics.tsx
│   ├── SentimentAnalysis.tsx
│   └── ...
├── components/            # 90+ reusable components
│   ├── trading/
│   ├── options/
│   ├── charts/
│   ├── broker/
│   └── common/
├── context/               # State management
│   ├── TradingContext.tsx
│   ├── OptionsContext.tsx
│   ├── OptionsDataContext.tsx
│   ├── GamificationContext.tsx
│   └── AccountContext.tsx
├── services/              # Business logic
│   ├── polygonService.ts
│   ├── blackScholesService.ts
│   ├── strategyValidationService.ts
│   └── ...
├── lib/                   # Core utilities
│   ├── auth.ts
│   ├── api.ts
│   └── supabase.ts
├── types/                 # TypeScript interfaces
└── hooks/                 # Custom React hooks
```

### State Management

Five React Context providers manage global state:

#### TradingContext
Manages stock trading operations.

```typescript
interface TradingState {
  positions: Position[];
  orders: Order[];
  watchlist: WatchlistItem[];
  balance: number;           // Initial: $100,000
  buyingPower: number;
}

// Actions
type TradingAction =
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'CANCEL_ORDER'; payload: string }
  | { type: 'FILL_ORDER'; payload: string }
  | { type: 'ADD_TO_WATCHLIST'; payload: WatchlistItem }
  | { type: 'UPDATE_STOCK_PRICES'; payload: PriceUpdate[] };
```

#### OptionsContext
Manages options trading and multi-leg strategies.

```typescript
interface OptionsState {
  positions: OptionsPosition[];
  orders: OptionsOrder[];
  contracts: OptionsContract[];
  multiLegOrders: MultiLegOrder[];
}

// Supports 12+ strategy types
type StrategyType =
  | 'bull_call_spread' | 'bear_put_spread'
  | 'iron_condor' | 'iron_butterfly'
  | 'calendar_spread' | 'diagonal_spread'
  | 'straddle' | 'strangle'
  | 'covered_call' | 'protective_put';
```

#### OptionsDataContext
Manages real-time options chain data.

```typescript
interface OptionsDataState {
  chains: Map<string, OptionsChain>;
  lastUpdated: Date;
  schedulerStatus: 'running' | 'stopped';
  persistenceEnabled: boolean;
}
```

### Routing Structure

```typescript
// Public Routes
'/'                    → Landing
'/login'               → Login
'/subscription'        → Subscription Page

// App Routes (protected, with AppLayout)
'/app/dashboard'       → Dashboard
'/app/trading'         → Enhanced Trading
'/app/optionschain'    → Options Chain
'/app/portfolio'       → Options Portfolio
'/app/orders'          → Order Management
'/app/analytics'       → Trading Analytics
'/app/sentiment'       → Sentiment Analysis
'/app/screener'        → Options Screener
'/app/learning'        → Educational Content
'/app/journal'         → Trading Journal
'/app/community'       → Community Features
'/app/brokers'         → Broker Connections

// Admin Routes (protected)
'/app/admin'           → Admin Dashboard
'/app/config'          → Configuration Manager
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `EnhancedTrading` | Main trading interface |
| `EnhancedOptionsChain` | Full options chain display |
| `MultiLegStrategyBuilder` | Visual strategy builder |
| `InteractivePayoffDiagram` | Real-time P&L visualization |
| `SentimentDashboard` | Market sentiment analysis |
| `GamificationHUD` | XP, levels, achievements |

---

## Backend Architecture

### Azure Functions Structure

```
azure-functions/
├── src/
│   ├── index.ts              # Function registration
│   ├── functions/
│   │   ├── health.ts         # Health checks
│   │   ├── login.ts          # User login
│   │   ├── register.ts       # User registration
│   │   ├── me.ts             # Current user profile
│   │   ├── refresh.ts        # Token refresh
│   │   ├── ping.ts           # Auth service ping
│   │   ├── trading/
│   │   │   ├── createTrade.ts
│   │   │   ├── getTradeHistory.ts
│   │   │   ├── closeTrade.ts
│   │   │   └── getTradingMetrics.ts
│   │   ├── strategies/
│   │   │   ├── saveStrategy.ts
│   │   │   └── getSavedStrategies.ts
│   │   ├── stripe/
│   │   │   ├── webhook.ts
│   │   │   └── createCheckout.ts
│   │   └── subscription/
│   │       └── getSubscription.ts
│   └── lib/
│       ├── database.ts       # PostgreSQL connection
│       ├── auth.ts           # JWT utilities
│       └── response.ts       # HTTP response helpers
├── host.json                 # Azure Functions config
├── package.json
└── tsconfig.json
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |
| GET | `/api/test/ping` | Connection test |
| POST | `/api/users/login` | User authentication |
| POST | `/api/users/register` | User registration |
| GET | `/api/users/me` | Current user profile |
| POST | `/api/users/refresh` | Refresh JWT token |
| POST | `/api/trading/trades` | Create new trade |
| GET | `/api/trading/history` | Get trade history |
| POST | `/api/trading/trades/:id/close` | Close a trade |
| GET | `/api/trading/metrics` | Trading metrics |
| POST | `/api/strategies` | Save strategy |
| GET | `/api/strategies` | Get saved strategies |
| GET | `/api/subscription` | Subscription status |
| POST | `/api/stripe/webhook` | Stripe events |
| POST | `/api/stripe/checkout` | Create checkout |

### Database Connection

```typescript
// lib/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRESQL_CONNECTION_STRING,
  ssl: { rejectUnauthorized: true },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### Authentication Middleware

```typescript
// lib/auth.ts
export async function requireAuth(request: HttpRequest): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  return {
    id: decoded.sub,
    email: decoded.email,
    displayName: decoded.displayName,
    roles: decoded.roles || []
  };
}
```

---

## Database Schema

### Core Tables

```sql
-- User Management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  azure_oid VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  bio TEXT,
  avatar_url TEXT,
  trading_experience VARCHAR(50),
  risk_tolerance VARCHAR(50),
  preferred_strategies TEXT[]
);

-- Paper Trading
CREATE TABLE paper_trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  balance DECIMAL(15,2) DEFAULT 100000.00,
  buying_power DECIMAL(15,2) DEFAULT 100000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE paper_trading_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES paper_trading_accounts(id),
  symbol VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  entry_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  position_type VARCHAR(10), -- 'stock' or 'option'
  option_type VARCHAR(4),    -- 'call' or 'put'
  strike_price DECIMAL(10,2),
  expiration_date DATE,
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade History
CREATE TABLE trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  entry_price DECIMAL(10,2) NOT NULL,
  exit_price DECIMAL(10,2),
  pnl DECIMAL(15,2),
  strategy_type VARCHAR(50),
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Saved Strategies
CREATE TABLE saved_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  strategy_type VARCHAR(50) NOT NULL,
  underlying_symbol VARCHAR(20) NOT NULL,
  legs JSONB NOT NULL,
  max_profit DECIMAL(15,2),
  max_loss DECIMAL(15,2),
  break_even_points DECIMAL(10,2)[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Data (cached)
CREATE TABLE historical_data (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10,2),
  high DECIMAL(10,2),
  low DECIMAL(10,2),
  close DECIMAL(10,2),
  volume BIGINT,
  UNIQUE(ticker, date)
);

-- Gamification
CREATE TABLE user_gamification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements JSONB DEFAULT '[]',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);
```

### Entity Relationship Diagram

```
┌──────────────┐       ┌────────────────────┐
│    users     │──────<│   user_profiles    │
└──────────────┘       └────────────────────┘
       │
       │       ┌────────────────────────────┐
       ├──────<│  paper_trading_accounts    │
       │       └────────────────────────────┘
       │                    │
       │       ┌────────────────────────────┐
       │       │  paper_trading_positions   │
       │       └────────────────────────────┘
       │
       │       ┌────────────────────────────┐
       ├──────<│      trade_history         │
       │       └────────────────────────────┘
       │
       │       ┌────────────────────────────┐
       ├──────<│     saved_strategies       │
       │       └────────────────────────────┘
       │
       │       ┌────────────────────────────┐
       ├──────<│      subscriptions         │
       │       └────────────────────────────┘
       │
       │       ┌────────────────────────────┐
       └──────<│  user_gamification_stats   │
               └────────────────────────────┘
```

---

## External Services

### Polygon.io (Market Data)

Provides real-time and historical market data.

```typescript
// services/polygonService.ts
class PolygonService {
  async getOptionsChain(symbol: string): Promise<OptionsChain> {
    const response = await fetch(
      `https://api.polygon.io/v3/reference/options/contracts?` +
      `underlying_ticker=${symbol}&limit=1000&apiKey=${API_KEY}`
    );
    return this.transformResponse(await response.json());
  }

  async getStockPrice(symbol: string): Promise<number> {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${API_KEY}`
    );
    return (await response.json()).results[0].c;
  }
}
```

**Features Used:**
- Options chains (contracts, strikes, expirations)
- Real-time stock prices
- Historical OHLCV data
- Options Greeks (when available)

**Fallback:** Mock data generator when API unavailable

### Stripe (Payments)

Handles subscription billing.

```typescript
// Subscription Plans
const PLANS = {
  monthly: 'price_xxx',    // $29/month
  yearly: 'price_xxx',     // $290/year
  pro: 'price_xxx',        // $99/month
  enterprise: 'price_xxx'  // Custom
};

// Webhook Events Handled
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
```

### Broker Integrations

| Broker | Markets | Features |
|--------|---------|----------|
| Alpaca | US Stocks/Options | Paper + Live trading, WebSocket |
| Interactive Brokers | Global | Full brokerage, complex orders |
| Robinhood | US Stocks/Options | Account sync, positions |
| Zerodha | India (NSE/BSE) | WebSocket, options trading |
| ICICI Direct | India | Account integration |
| HDFC Securities | India | Account integration |

---

## Authentication

### JWT-Based Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │   API    │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  POST /login       │                    │
     │  {email, password} │                    │
     ├───────────────────>│                    │
     │                    │  Query user        │
     │                    ├───────────────────>│
     │                    │<───────────────────┤
     │                    │                    │
     │                    │  Verify password   │
     │                    │  (bcrypt.compare)  │
     │                    │                    │
     │                    │  Generate JWT      │
     │  {accessToken,     │  (7 day expiry)    │
     │   refreshToken,    │                    │
     │   user}            │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  GET /api/resource │                    │
     │  Authorization:    │                    │
     │  Bearer <token>    │                    │
     ├───────────────────>│                    │
     │                    │  Verify JWT        │
     │                    │  Extract user      │
     │                    │                    │
     │  {data}            │                    │
     │<───────────────────┤                    │
```

### Token Structure

```typescript
interface JwtPayload {
  sub: string;          // User ID
  email: string;
  displayName: string;
  roles: string[];      // ['user', 'premium', 'admin']
  iat: number;          // Issued at
  exp: number;          // Expiration (7 days for access, 30 days for refresh)
}
```

### Password Security

- Algorithm: bcrypt
- Salt rounds: 12
- Min length: 8 characters

---

## Deployment Infrastructure

### GitHub Actions Workflows

#### Production Deployment

```yaml
# .github/workflows/azure-deploy-production.yml
name: Deploy to Azure Production

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: dist/

  build-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - working-directory: azure-functions
        run: |
          npm ci
          npm run build
          npm ci --omit=dev
      - uses: actions/upload-artifact@v4
        with:
          name: functions-build
          path: azure-functions/

  deploy-functions:
    needs: build-functions
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - run: |
          cd azure-functions
          zip -r ../deploy.zip .
      - uses: azure/functions-action@v1
        with:
          app-name: optionsacademy-prod-api
          package: deploy.zip

  deploy-frontend:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          app_location: frontend-build
          skip_app_build: true

  verify-deployment:
    needs: [deploy-functions, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -f https://optionsacademy-prod-api.azurewebsites.net/api/health
          curl -f https://optionsacademy.ai
```

### Azure Resources

```
Resource Group: optionsacademy
├── Static Web App: optionsacademy-prod-web
│   └── URL: https://optionsacademy.ai
├── Function App: optionsacademy-prod-api
│   ├── Runtime: Node.js 20
│   ├── OS: Windows
│   └── URL: https://optionsacademy-prod-api.azurewebsites.net
├── PostgreSQL Server: optionsacademy-db-prod
│   └── Database: optionsacademy
├── Application Insights: optionsacademy-prod-api
└── Storage Account: optionsacademy8a33
```

### Environment Variables

#### Frontend (VITE_*)
```bash
VITE_API_BASE_URL=https://optionsacademy-prod-api.azurewebsites.net/api
VITE_POLYGON_API_KEY=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
```

#### Backend (Azure App Settings)
```bash
AZURE_POSTGRESQL_CONNECTION_STRING=postgresql://...
JWT_SECRET=xxx
NODE_ENV=production
```

---

## Data Flow Patterns

### Real-Time Options Data Flow

```
┌─────────────────┐
│OptionsData     │
│ Scheduler      │──── Interval (5 min) ────┐
└─────────────────┘                          │
                                             ▼
┌─────────────────┐    ┌─────────────────┐   │
│   Polygon.io   │───>│PolygonOptions   │<──┘
│      API       │    │ DataService     │
└─────────────────┘    └────────┬────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐
│  OptionsData   │<───│  Data Transform │
│    Context     │    │  & Validation   │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   Components   │    │  LocalStorage   │
│   Re-render    │    │   Persistence   │
└─────────────────┘    └─────────────────┘
```

### Multi-Leg Strategy Execution

```
User builds strategy
        │
        ▼
┌─────────────────────────────┐
│ MultiLegStrategyBuilder     │
│ - Select underlying         │
│ - Add legs (calls/puts)     │
│ - Set quantities            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ StrategyValidationService   │
│ - Validate leg combinations │
│ - Calculate max P/L         │
│ - Find break-even points    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ PayoffCalculationService    │
│ - Generate payoff curve     │
│ - Calculate Greeks          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ InteractivePayoffDiagram    │
│ - Visualize P/L at expiry   │
│ - Show current value        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ OptionsContext              │
│ - Create multi-leg order    │
│ - Track each leg position   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ TradingHistoryService       │
│ - Record as single strategy │
│ - Store in database         │
└─────────────────────────────┘
```

---

## Security

### Data Protection

| Layer | Protection |
|-------|------------|
| Transport | TLS 1.2+ required |
| Passwords | bcrypt (12 rounds) |
| Tokens | JWT with HMAC-SHA256 |
| Database | SSL required, encrypted at rest |
| Credentials | AES-256 encryption for broker keys |

### HTTP Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Input Validation

- Email format validation
- Password strength requirements
- SQL injection prevention (parameterized queries)
- XSS prevention (React's built-in escaping)

### Rate Limiting

- Azure Functions: 200 max concurrent requests
- Stripe webhooks: Signature verification
- API: Bearer token required for protected routes

---

## Performance Optimizations

### Frontend

- **Code Splitting**: React.lazy() for all pages
- **Chunk Optimization**: Vendor chunks (react, charts, utils)
- **Caching**: LocalStorage for trading data
- **Asset Hashing**: Cache busting for deployments

### Backend

- **Connection Pooling**: Max 20 PostgreSQL connections
- **Response Compression**: Enabled via Azure
- **Cold Start Mitigation**: Minimal dependencies

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'utils': ['axios', 'date-fns']
        }
      }
    }
  }
});
```

---

## Monitoring & Observability

### Application Insights

- Request tracing
- Exception logging
- Performance metrics
- Custom events

### Health Checks

```bash
# API Health
GET /api/health
Response: {
  "status": "healthy",
  "timestamp": "2025-12-20T15:36:50.090Z",
  "services": {
    "api": true,
    "database": true
  }
}
```

### Logging

- Azure Functions: Application Insights integration
- Frontend: Console + error boundaries
- Database: Query logging in development

---

## Development Workflow

### Local Development

```bash
# Frontend
npm run dev              # Start on port 5173

# Backend
cd azure-functions
npm run build           # Compile TypeScript
func start              # Start Azure Functions locally

# Database
# Use Azure PostgreSQL directly (SSL required)
```

### Testing

```bash
# Frontend unit tests
npm run test

# E2E tests
npm run test:e2e
npx playwright test tests/[file].spec.ts

# Backend tests
cd azure-functions
npm test
```

### Deployment

```bash
# Automatic via GitHub Actions on push to main
git push origin main

# Manual deployment
npm run deploy:prod
```

---

*Last Updated: December 2024*
