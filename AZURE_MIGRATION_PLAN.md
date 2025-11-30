# Azure Migration Plan: optionsacademy.ai

## Executive Summary

This document outlines the migration strategy for moving optionsacademy.ai from:
- **Current Hosting:** Netlify → **Azure Static Web Apps** or **Azure App Service**
- **Current Database:** Supabase PostgreSQL → **Azure Database for PostgreSQL**
- **Current Auth:** Supabase Auth → **Azure AD B2C** or **Custom JWT with Azure**
- **Current Functions:** Supabase Edge Functions → **Azure Functions**

---

## Current Architecture Analysis

### Supabase Integration Summary

| Component | Current State | Files Affected |
|-----------|--------------|----------------|
| Database Tables | 60+ tables | 70+ migration files |
| RLS Policies | 675+ policies | All user-scoped tables |
| Auth Methods | 7 client + 3 admin | `src/lib/supabase.ts`, `AuthProvider.tsx` |
| Edge Functions | 6 functions | `supabase/functions/*` |
| Service Files | 20 services | `src/services/*` |
| Frontend Files | 74+ files | Components, pages, contexts |

### Key Supabase Features in Use

1. **Authentication** (Supabase Auth)
   - Email/password sign-in/sign-up
   - Password reset
   - Auth state management
   - Admin user management

2. **Database** (PostgreSQL via Supabase)
   - Direct client queries via `supabase.from('table')`
   - Row Level Security for multi-tenant data isolation
   - Complex joins and aggregations

3. **Edge Functions** (Deno-based)
   - `create-checkout` - Stripe checkout session creation
   - `stripe-webhook` - Subscription lifecycle management
   - `cancel-subscription` - Subscription cancellation
   - `apply-coupon` - Coupon application
   - `customer-portal` - Stripe customer portal
   - `load-historical-data` - Historical data loading

---

## Migration Architecture

### Target Azure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Static Web Apps                        │
│                    (React Frontend - Vite)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Azure API Management                         │
│                    (Optional - Rate Limiting)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Functions                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth API   │  │  Trading API │  │  Stripe API  │           │
│  │  /api/auth/* │  │ /api/trades/*│  │/api/stripe/* │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Sentiment API│  │ Broker APIs  │  │  Admin API   │           │
│  │/api/sentiment│  │ /api/broker/*│  │ /api/admin/* │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Azure AD B2C    │ │ Azure PostgreSQL │ │  Azure Key Vault │
│  (Authentication)│ │   (Database)     │ │    (Secrets)     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## Phase 1: Azure Infrastructure Setup

### 1.1 Azure Resource Group
```bash
# Create resource group
az group create --name optionsacademy-rg --location eastus
```

### 1.2 Azure Database for PostgreSQL Flexible Server
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group optionsacademy-rg \
  --name optionsacademy-db \
  --location eastus \
  --admin-user optionsadmin \
  --admin-password <secure-password> \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 15

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group optionsacademy-rg \
  --name optionsacademy-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 1.3 Azure Static Web Apps
```bash
# Create Static Web App
az staticwebapp create \
  --name optionsacademy-frontend \
  --resource-group optionsacademy-rg \
  --location eastus \
  --sku Standard
```

### 1.4 Azure Function App
```bash
# Create storage account for Functions
az storage account create \
  --name optionsacademyfuncstor \
  --resource-group optionsacademy-rg \
  --location eastus \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group optionsacademy-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name optionsacademy-api \
  --storage-account optionsacademyfuncstor
```

### 1.5 Azure Key Vault
```bash
# Create Key Vault
az keyvault create \
  --name optionsacademy-kv \
  --resource-group optionsacademy-rg \
  --location eastus
```

### 1.6 Azure AD B2C (for Authentication)
```bash
# Create Azure AD B2C tenant via Azure Portal
# Configure user flows for:
# - Sign up and sign in
# - Password reset
# - Profile editing
```

---

## Phase 2: Database Migration

### 2.1 Export Supabase Schema

```bash
# Export schema from Supabase
pg_dump -h db.<project-ref>.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  -f supabase_schema.sql

# Export data
pg_dump -h db.<project-ref>.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  -f supabase_data.sql
```

### 2.2 Schema Modifications Required

Since Azure PostgreSQL doesn't have Supabase's built-in RLS with `auth.uid()`, we need to:

1. **Remove RLS policies** - Handle authorization in the API layer
2. **Replace `auth.uid()` references** - Use application-level user ID from JWT
3. **Add indexes** for user_id columns for performance

```sql
-- Example: Convert RLS-protected table to standard table
-- Before (Supabase):
CREATE POLICY "select_own" ON trade_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- After (Azure): Remove RLS, add proper indexing
CREATE INDEX idx_trade_history_user_id ON trade_history(user_id);
-- Authorization handled in Azure Functions API layer
```

### 2.3 Migration Script

Create `scripts/migrate-to-azure.sql`:
```sql
-- 1. Create extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Run converted schema (without RLS)
\i converted_schema.sql

-- 3. Import data
\i supabase_data.sql

-- 4. Add performance indexes
CREATE INDEX CONCURRENTLY idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX CONCURRENTLY idx_trade_history_user ON trade_history(user_id);
-- ... add indexes for all user-scoped tables
```

### 2.4 Tables to Migrate (Priority Order)

**Critical (User Data):**
1. `subscriptions` - Stripe subscriptions
2. `trade_history` - Trading history
3. `user_trading_metrics` - Trading stats
4. `saved_strategies` - User strategies
5. `strategy_shares` - Shared strategies

**Broker Credentials:**
6. `alpaca_credentials`
7. `ibkr_credentials`
8. `robinhood_credentials`
9. `zerodha_credentials`
10. `icici_direct_credentials`
11. `hdfc_securities_credentials`
12. `kalshi_credentials`

**Market Data:**
13. `options_contracts_live`
14. `screener_data`
15. `sentiment scores tables`
16. `news_articles`
17. `market_events`

**Admin/System:**
18. `user_roles`
19. `admin_audit_log`
20. `feature_flags_global`

---

## Phase 3: Authentication Migration

### 3.1 Option A: Azure AD B2C (Recommended)

**Pros:**
- Enterprise-grade security
- Built-in MFA support
- Social identity providers
- Customizable user flows

**Implementation:**

1. **Create Azure AD B2C Tenant**
2. **Configure User Flows:**
   - Sign up and sign in (email/password)
   - Password reset
   - Profile editing

3. **Frontend Integration (MSAL.js):**

```typescript
// src/lib/azure-auth.ts
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://${import.meta.env.VITE_AZURE_B2C_TENANT}.b2clogin.com/${import.meta.env.VITE_AZURE_B2C_TENANT}.onmicrosoft.com/${import.meta.env.VITE_AZURE_B2C_POLICY}`,
    knownAuthorities: [`${import.meta.env.VITE_AZURE_B2C_TENANT}.b2clogin.com`],
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

export async function signIn() {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return { user: response.account, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signOut() {
  await msalInstance.logoutPopup();
}

export async function getAccessToken() {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    return response.accessToken;
  } catch (error) {
    // Fallback to interactive
    const response = await msalInstance.acquireTokenPopup(loginRequest);
    return response.accessToken;
  }
}
```

### 3.2 Option B: Custom JWT with Azure Functions

If you prefer more control, implement custom JWT auth:

```typescript
// Azure Function: api/auth/login.ts
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.AZURE_POSTGRESQL_CONNECTION_STRING,
});

export async function login(request: HttpRequest): Promise<HttpResponseInit> {
  const { email, password } = await request.json();

  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return { status: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return { status: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    status: 200,
    body: JSON.stringify({ token, user: { id: user.id, email: user.email } }),
  };
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
```

### 3.3 User Migration

```sql
-- Migrate users from Supabase auth.users to Azure
INSERT INTO azure_users (id, email, email_confirmed, created_at, metadata)
SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL,
  created_at,
  raw_user_meta_data
FROM auth.users;
```

---

## Phase 4: Backend API Layer (Azure Functions)

### 4.1 Project Structure

```
azure-functions/
├── package.json
├── host.json
├── local.settings.json
├── src/
│   ├── functions/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── resetPassword.ts
│   │   │   └── verifyToken.ts
│   │   ├── trading/
│   │   │   ├── getTradeHistory.ts
│   │   │   ├── createTrade.ts
│   │   │   ├── getTradingMetrics.ts
│   │   │   └── updateTrade.ts
│   │   ├── strategies/
│   │   │   ├── getSavedStrategies.ts
│   │   │   ├── saveStrategy.ts
│   │   │   ├── shareStrategy.ts
│   │   │   └── getSharedStrategy.ts
│   │   ├── broker/
│   │   │   ├── alpaca/
│   │   │   ├── ibkr/
│   │   │   ├── robinhood/
│   │   │   └── zerodha/
│   │   ├── stripe/
│   │   │   ├── createCheckout.ts
│   │   │   ├── webhook.ts
│   │   │   ├── cancelSubscription.ts
│   │   │   └── customerPortal.ts
│   │   ├── sentiment/
│   │   │   ├── getSentiment.ts
│   │   │   └── updateSentiment.ts
│   │   └── admin/
│   │       ├── getUsers.ts
│   │       ├── updateUser.ts
│   │       └── auditLog.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rateLimit.ts
│   ├── db/
│   │   └── client.ts
│   └── utils/
│       └── validation.ts
```

### 4.2 Database Client

```typescript
// src/db/client.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.AZURE_POSTGRESQL_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}
```

### 4.3 Auth Middleware

```typescript
// src/middleware/auth.ts
import { HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export function authenticateRequest(request: HttpRequest): AuthenticatedUser | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(request: HttpRequest): AuthenticatedUser {
  const user = authenticateRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
```

### 4.4 Example API Endpoint: Trade History

```typescript
// src/functions/trading/getTradeHistory.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/auth';
import { query } from '../../db/client';

interface Trade {
  id: string;
  contract_ticker: string;
  underlying_ticker: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  profit_loss: number | null;
  entry_date: string;
  exit_date: string | null;
}

export async function getTradeHistory(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);

    const trades = await query<Trade>(
      `SELECT id, contract_ticker, underlying_ticker, trade_type,
              entry_price, exit_price, quantity, profit_loss,
              entry_date, exit_date
       FROM trade_history
       WHERE user_id = $1
       ORDER BY entry_date DESC
       LIMIT 100`,
      [user.userId]
    );

    return {
      status: 200,
      jsonBody: { trades },
    };
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return { status: 401, jsonBody: { error: 'Unauthorized' } };
    }
    context.error('Error fetching trade history:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('getTradeHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'trading/history',
  handler: getTradeHistory,
});
```

### 4.5 Stripe Webhook (Converted from Supabase Edge Function)

```typescript
// src/functions/stripe/webhook.ts
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import Stripe from 'stripe';
import { query } from '../../db/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function stripeWebhook(request: HttpRequest): Promise<HttpResponseInit> {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return { status: 400, body: `Webhook Error: ${err.message}` };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await query(
        `INSERT INTO subscriptions
         (user_id, customer_id, subscription_id, status, price_id,
          current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           customer_id = EXCLUDED.customer_id,
           subscription_id = EXCLUDED.subscription_id,
           status = EXCLUDED.status,
           price_id = EXCLUDED.price_id,
           current_period_start = EXCLUDED.current_period_start,
           current_period_end = EXCLUDED.current_period_end`,
        [
          session.client_reference_id,
          session.customer,
          subscription.id,
          subscription.status,
          subscription.items.data[0].price.id,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
        ]
      );
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await query(
        `UPDATE subscriptions
         SET status = $1,
             current_period_start = $2,
             current_period_end = $3,
             cancel_at_period_end = $4
         WHERE subscription_id = $5`,
        [
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.cancel_at_period_end,
          subscription.id,
        ]
      );
      break;
    }
  }

  return { status: 200, body: JSON.stringify({ received: true }) };
}

app.http('stripeWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'stripe/webhook',
  handler: stripeWebhook,
});
```

---

## Phase 5: Frontend Migration

### 5.1 Package Changes

```bash
# Remove Supabase
npm uninstall @supabase/supabase-js

# Add Azure dependencies
npm install @azure/msal-browser @azure/msal-react
```

### 5.2 Create API Client

Replace Supabase client with REST API client:

```typescript
// src/lib/api-client.ts
import { getAccessToken } from './azure-auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
```

### 5.3 Service Layer Updates

Convert service files from Supabase to API calls:

```typescript
// src/services/tradingHistoryService.ts - BEFORE (Supabase)
import { supabase } from '../lib/supabase';

export class TradingHistoryService {
  static async getTradeHistory(userId: string) {
    const { data, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });
    return { data, error };
  }
}

// src/services/tradingHistoryService.ts - AFTER (Azure API)
import { api } from '../lib/api-client';

export class TradingHistoryService {
  static async getTradeHistory() {
    // userId is extracted from JWT on the server
    return await api.get<{ trades: Trade[] }>('/trading/history');
  }

  static async createTrade(trade: CreateTradeRequest) {
    return await api.post<Trade>('/trading/trades', trade);
  }

  static async updateTrade(tradeId: string, updates: Partial<Trade>) {
    return await api.put<Trade>(`/trading/trades/${tradeId}`, updates);
  }
}
```

### 5.4 Files Requiring Updates

**Core Files:**
- [ ] `src/lib/supabase.ts` → `src/lib/azure-auth.ts` + `src/lib/api-client.ts`
- [ ] `src/components/AuthProvider.tsx` → Use MSAL React hooks

**Service Files (20 files):**
- [ ] `tradingHistoryService.ts`
- [ ] `savedStrategiesService.ts`
- [ ] `adminService.ts`
- [ ] `sentimentAnalysisService.ts`
- [ ] `sentimentHeatmapService.ts`
- [ ] `greeksUpdateService.ts`
- [ ] `strategyTemplateService.ts`
- [ ] `marketEventsService.ts`
- [ ] `newsFeedService.ts`
- [ ] `screenerDataSyncService.ts`
- [ ] `optionsSentimentService.ts`
- [ ] `liquidOptionsSentimentService.ts`
- [ ] `liveOptionsDataService.ts`
- [ ] `robinhoodService.ts`
- [ ] `kalshiService.ts`
- [ ] `alpacaService.ts`
- [ ] `zerodhaService.ts`
- [ ] `ibkrService.ts`
- [ ] `iciciDirectService.ts`
- [ ] `hdfcSecuritiesService.ts`

**Context Files:**
- [ ] `src/context/AccountContext.tsx` - Update credential fetching

---

## Phase 6: Environment Variables

### 6.1 Frontend (.env)

```env
# Azure AD B2C
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_B2C_TENANT=your-b2c-tenant
VITE_AZURE_B2C_POLICY=B2C_1_signupsignin1

# API
VITE_API_BASE_URL=https://optionsacademy-api.azurewebsites.net/api

# Existing (unchanged)
VITE_POLYGON_API_KEY=your-polygon-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
```

### 6.2 Azure Functions (local.settings.json)

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "AZURE_POSTGRESQL_CONNECTION_STRING": "postgresql://...",
    "JWT_SECRET": "your-jwt-secret",
    "STRIPE_SECRET_KEY": "sk_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "POLYGON_API_KEY": "your-polygon-key"
  }
}
```

### 6.3 Azure Key Vault Secrets

Store sensitive values in Key Vault:
- `postgresql-connection-string`
- `jwt-secret`
- `stripe-secret-key`
- `stripe-webhook-secret`
- `polygon-api-key`
- Broker API credentials

---

## Phase 7: Deployment Pipeline

### 7.1 GitHub Actions for Frontend

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_AZURE_CLIENT_ID: ${{ secrets.VITE_AZURE_CLIENT_ID }}
          VITE_AZURE_B2C_TENANT: ${{ secrets.VITE_AZURE_B2C_TENANT }}
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/'
          output_location: 'dist'
```

### 7.2 GitHub Actions for Azure Functions

```yaml
# .github/workflows/azure-functions.yml
name: Deploy Azure Functions

on:
  push:
    branches: [main]
    paths:
      - 'azure-functions/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and Build
        working-directory: azure-functions
        run: |
          npm ci
          npm run build

      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: optionsacademy-api
          package: azure-functions
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## Phase 8: Migration Execution Checklist

### Pre-Migration
- [ ] Back up Supabase database
- [ ] Document all Supabase Edge Function configurations
- [ ] Create Azure resource group and resources
- [ ] Set up Azure AD B2C tenant
- [ ] Configure Key Vault with all secrets

### Database Migration
- [ ] Export Supabase schema
- [ ] Convert schema (remove RLS, add indexes)
- [ ] Create tables in Azure PostgreSQL
- [ ] Migrate data
- [ ] Verify data integrity
- [ ] Test queries performance

### Authentication Migration
- [ ] Configure Azure AD B2C user flows
- [ ] Export Supabase users
- [ ] Import users to Azure AD B2C (or send password reset emails)
- [ ] Test authentication flow

### API Migration
- [ ] Create Azure Functions project
- [ ] Implement all API endpoints
- [ ] Add authentication middleware
- [ ] Deploy to Azure
- [ ] Test all endpoints

### Frontend Migration
- [ ] Remove Supabase dependencies
- [ ] Add Azure/MSAL dependencies
- [ ] Create API client
- [ ] Update AuthProvider
- [ ] Update all service files
- [ ] Update environment variables
- [ ] Deploy to Azure Static Web Apps

### Post-Migration
- [ ] Monitor error rates
- [ ] Performance testing
- [ ] Security audit
- [ ] Update DNS (optionsacademy.ai)
- [ ] Deprecate Supabase project

---

## Timeline Estimate

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| Phase 1 | Azure Infrastructure Setup | None |
| Phase 2 | Database Migration | Phase 1 |
| Phase 3 | Authentication Migration | Phase 1 |
| Phase 4 | Backend API Layer | Phase 2, 3 |
| Phase 5 | Frontend Migration | Phase 4 |
| Phase 6 | Environment Configuration | Phase 4, 5 |
| Phase 7 | Deployment Pipeline | Phase 5, 6 |
| Phase 8 | Testing & Cutover | Phase 7 |

---

## Risk Mitigation

1. **Data Loss**: Keep Supabase running in parallel until Azure is verified
2. **Auth Disruption**: Implement password reset flow for migrated users
3. **API Downtime**: Use feature flags to toggle between Supabase and Azure
4. **Performance**: Run load tests before cutover
5. **Security**: Conduct security audit of Azure configuration

---

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Azure PostgreSQL Flexible Server | Standard_B2s | ~$30-50 |
| Azure Static Web Apps | Standard | ~$9 |
| Azure Functions | Consumption | ~$0-20 (based on usage) |
| Azure AD B2C | First 50K MAU free | $0-varies |
| Azure Key Vault | Standard | ~$0.03/secret/month |
| Azure Storage | Standard LRS | ~$5-10 |
| **Total** | | **~$50-100/month** |

*Note: Costs vary based on usage and region*

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Authentication | **Azure AD B2C** (managed, enterprise-grade) |
| User Migration | **Force password reset** (send reset emails to all users) |
| Cutover Strategy | **Big Bang** (single cutover, not parallel) |
| Staging Environment | **Yes** (separate Azure environment for testing) |

---

## Environment Structure

### Production Environment
- Resource Group: `optionsacademy-prod-rg`
- PostgreSQL: `optionsacademy-prod-db`
- Static Web App: `optionsacademy-prod-web`
- Function App: `optionsacademy-prod-api`
- Key Vault: `optionsacademy-prod-kv`
- AD B2C Tenant: `optionsacademyprod.onmicrosoft.com`

### Staging Environment
- Resource Group: `optionsacademy-staging-rg`
- PostgreSQL: `optionsacademy-staging-db`
- Static Web App: `optionsacademy-staging-web`
- Function App: `optionsacademy-staging-api`
- Key Vault: `optionsacademy-staging-kv`
- AD B2C Tenant: `optionsacademystaging.onmicrosoft.com`
