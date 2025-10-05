# Paper Trading Platform with Options Trading

A comprehensive paper trading platform built with React, TypeScript, and Vite, featuring both stock and options trading simulation with Polygon.io integration and Supabase for data persistence.

## 🚀 Features

### Stock Trading
- Real-time stock price simulation
- Portfolio management and tracking
- Order management (Market, Limit, Stop orders)
- Watchlist functionality
- Advanced analytics and charts
- Risk management tools

### Options Trading
- Top 5 most liquid options contracts simulation
- Complete options chain with Greeks (Delta, Gamma, Theta, Vega)
- Implied volatility tracking
- Historical data (2 weeks) for each option
- Buy/Sell to Open/Close functionality
- Real-time P&L tracking
- Options portfolio analysis

### Data Integration
- Polygon.io API integration for real market data
- TradingView charts integration for advanced technical analysis
- **Community integration with Slack, Discord, Telegram, WhatsApp, and Facebook**
- Fallback to simulated data for development
- Historical data storage and retrieval
- Real-time price updates

### Subscription System
- Subscription management with Stripe integration
- Coupon system for discounts and promotions
- Subscription status tracking
- Terms and conditions acceptance flow

### Error Handling & Testing
- Enhanced error logging and display
- Error boundary for graceful error handling
- Testing tools for subscription and E2E tests
- Comprehensive test suite for all major features

## 🛠️ Setup

### Prerequisites
- Node.js 18+ (specified in package.json engines)
- npm 8+ (specified in package.json engines)
- npm or yarn
- Polygon.io API key (optional, for real data)
- Supabase account (optional, for data persistence)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment Configuration:**
```bash
# Edit .env with your configuration
# For real Polygon.io data, add your API key:
VITE_POLYGON_API_KEY=your_actual_api_key_here

# For Supabase integration:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Stripe integration:
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**📖 For detailed setup instructions on enabling live options data, see [LIVE_DATA_SETUP.md](./LIVE_DATA_SETUP.md)**

3. **Start the development server:**
```bash
npm run dev
```

## 🌐 Community Integration Setup

The platform includes a robust community integration system that connects with popular messaging platforms:

### Supported Platforms

1. **Slack** - Share trades and analysis to Slack channels
2. **Discord** - Post updates to Discord servers
3. **Telegram** - Send messages to Telegram channels or groups
4. **WhatsApp** - Share links to WhatsApp groups
5. **Facebook** - Post to Facebook groups

### Configuration

To enable community integrations, add the following to your `.env` file:

```bash
# Slack Configuration
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/slack/webhook

# Discord Configuration
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/discord/webhook

# Telegram Configuration
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_CHAT_ID=your_telegram_chat_id
VITE_TELEGRAM_CHANNEL=your_telegram_channel_username

# WhatsApp Configuration
VITE_WHATSAPP_GROUP_INVITE=your_whatsapp_group_invite_code

# Facebook Configuration
VITE_FACEBOOK_GROUP_ID=your_facebook_group_id
```

> **Note:** In development mode, these integrations are mocked for testing purposes. No actual API calls are made to external services.

### Setting Up Webhooks

#### Slack Webhook
1. Go to your Slack workspace
2. Create a new Slack app from the [Slack API dashboard](https://api.slack.com/apps)
3. Enable "Incoming Webhooks"
4. Create a new webhook URL for a specific channel
5. Copy the webhook URL to your `.env` file

#### Discord Webhook
1. Go to your Discord server
2. Edit a channel → Integrations → Webhooks
3. Create a new webhook
4. Copy the webhook URL to your `.env` file

#### Telegram Bot
1. Create a bot using [BotFather](https://t.me/BotFather)
2. Copy the bot token provided
3. Add the bot to your group or channel
4. Get the chat ID by sending a message and checking the getUpdates API
5. Add these details to your `.env` file

### Running Standalone

To run the community features standalone:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the platform configurations
4. Start the development server: `npm run dev`
5. Navigate to the Community page

### Features

- **Share Trading Alerts**: Post your trades with analysis
- **Market Analysis**: Share market insights and commentary
- **Journal Entries**: Share your trading journal entries
- **Position Updates**: Post updates about your current positions
- **Multi-platform Sharing**: Send to multiple platforms simultaneously

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POLYGON_API_KEY` | Your Polygon.io API key | `demo_api_key` |
| `VITE_ENABLE_MOCK_DATA` | Use simulated data | `true` |
| `VITE_ENABLE_REAL_TIME_DATA` | Enable real API calls | `false` |
| `VITE_OPTIONS_UPDATE_INTERVAL` | Price update frequency (ms) | `5000` |
| `VITE_MAX_HISTORICAL_DAYS` | Historical data range | `14` |
| `VITE_DEFAULT_PORTFOLIO_VALUE` | Starting portfolio value | `100000` |
| `VITE_SUPABASE_URL` | Supabase project URL | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `VITE_ENABLE_DATA_PERSISTENCE` | Enable data persistence with Supabase | `true` |
| `VITE_HISTORICAL_DATA_RETENTION_DAYS` | Days to retain historical data | `30` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `VITE_STRIPE_MONTHLY_PRICE_ID` | Stripe monthly subscription price ID | - |
| `VITE_STRIPE_YEARLY_PRICE_ID` | Stripe yearly subscription price ID | - |

### Community Platform Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SLACK_WEBHOOK_URL` | Slack webhook for community alerts | `https://hooks.slack.com/services/...` |
| `VITE_DISCORD_WEBHOOK_URL` | Discord webhook for community alerts | `https://discord.com/api/webhooks/...` |
| `VITE_TELEGRAM_BOT_TOKEN` | Telegram bot token | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `VITE_TELEGRAM_CHAT_ID` | Telegram chat/channel ID | `-1001234567890` |
| `VITE_TELEGRAM_CHANNEL` | Telegram channel username | `optionsworld` |
| `VITE_WHATSAPP_GROUP_INVITE` | WhatsApp group invite code | `ABC123DEF456` |
| `VITE_FACEBOOK_GROUP_ID` | Facebook group ID | `1234567890` |

## 🔄 Community Integration API

The community integration system provides the following API:

```typescript
// Share a trading alert
CommunityService.shareTradingAlert({
  symbol: 'AAPL',
  action: 'buy',
  price: 185.43,
  quantity: 10,
  strategy: 'Long Call',
  reasoning: 'Strong technical breakout with increasing volume'
}, ['slack', 'discord']); // Optional platform selection

// Share market analysis
CommunityService.shareMarketAnalysis(
  'Market Outlook',
  'SPY showing strong support at the 200-day moving average...',
  ['telegram'] // Optional platform selection
);

// Share a position
CommunityService.sharePosition(position);

// Share a journal entry
CommunityService.shareJournalEntry(journalEntry);
```

### Message Formatting

Messages are automatically formatted for each platform with appropriate markdown/formatting:

- **Trading Alerts**: Includes symbol, action, price, quantity, and reasoning
- **Market Analysis**: Includes title, content, and relevant hashtags
- **Position Updates**: Includes contract details, P&L, and Greeks
- **Journal Entries**: Includes trade details, reasoning, and lessons learned

### Webhook Security

For production use, consider these security practices:

1. Store webhook URLs and API keys securely
2. Implement rate limiting to prevent abuse
3. Use environment variables for all sensitive credentials
4. Consider using a backend service to proxy webhook requests
5. Rotate webhook URLs and API keys periodically

## 🧪 Testing Tools

The platform includes built-in testing tools accessible from the landing page:

### Subscription Tests

Test the subscription system with mock data:

```bash
# Run subscription tests
npm run test:subscription
```

### E2E Tests

Run end-to-end tests for the entire application:

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test files
npx playwright test tests/subscription.spec.ts
npx playwright test tests/options-trading.spec.ts
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test files
npx playwright test tests/options-trading.spec.ts
npx playwright test tests/options-portfolio.spec.ts
```

### Test Coverage
- Complete navigation testing
- Stock trading workflow tests
- Options trading functionality
- Portfolio management
- Order placement and management
- Mobile responsiveness
- Data persistence
- Subscription and payment flows
- Error handling and recovery

## 📊 Options Trading Features

### TradingView Integration
- **Advanced Charts**: Professional-grade charting with technical indicators
- **Real-time Data**: Live market data and price updates
- **Technical Analysis**: RSI, MACD, Bollinger Bands, and 100+ indicators
- **Multiple Timeframes**: From 1-minute to monthly charts
- **Drawing Tools**: Trend lines, support/resistance levels, and annotations
- **Custom Studies**: Create and save custom technical analysis studies

### Community Features
- **Multi-Platform Integration**: Connect with Slack, Discord, Telegram, WhatsApp, and Facebook
- **Trade Sharing**: Share your successful trades and strategies with the community
- **Real-time Alerts**: Get notified of important market moves and community discussions
- **Educational Content**: Share and receive market analysis and trading insights
- **Community Guidelines**: Built-in moderation and educational disclaimers
- **Activity Feed**: See recent community messages and trading alerts

### Supported Options Contracts
1. **SPY $580 Call** - Dec 20, 2024 (High liquidity)
2. **QQQ $500 Call** - Dec 20, 2024 (Tech sector exposure)
3. **AAPL $230 Call** - Dec 20, 2024 (Individual stock)
4. **TSLA $1000 Call** - Dec 20, 2024 (High volatility)
5. **NVDA $1400 Call** - Dec 20, 2024 (AI/Semiconductor play)

### Options Data Points
- **Pricing**: Bid, Ask, Last, Mark
- **Greeks**: Delta, Gamma, Theta, Vega
- **Volatility**: Implied Volatility (IV)
- **Volume**: Daily trading volume
- **Open Interest**: Total open contracts
- **Intrinsic Value**: In-the-money value
- **Time Value**: Extrinsic option value

### Trading Capabilities
- **Buy to Open**: Enter new long positions
- **Sell to Close**: Close existing long positions
- **Sell to Open**: Enter new short positions (coming soon)
- **Buy to Close**: Close existing short positions (coming soon)

### Subscription Features
- **Tiered Plans**: Monthly and yearly subscription options
- **Coupon System**: Apply discount codes at checkout
- **Special Deals**: Limited-time offers with automatic discounts
- **Secure Checkout**: Powered by Stripe
- **Subscription Management**: View and manage subscription status

## 🏗️ Architecture

### High-Level Overview

The application follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Pages, Components, Routing, UI State Management)          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Application Layer                         │
│     (Context Providers, Business Logic, State Flow)         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      Service Layer                           │
│  (API Services, Data Processing, External Integrations)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      Data Layer                              │
│    (Polygon.io, Supabase, Stripe, External APIs)           │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure
```
project/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthProvider.tsx            # Authentication wrapper
│   │   ├── ErrorBoundary.tsx           # Error handling
│   │   ├── TradingViewWidget.tsx       # Chart integration
│   │   ├── OptionChain.tsx             # Options chain display
│   │   ├── MultiLegStrategyBuilder.tsx # Strategy builder
│   │   ├── PayoffDiagram.tsx           # Visual P&L charts
│   │   └── ...
│   │
│   ├── context/             # React Context providers (Global State)
│   │   ├── OptionsContext.tsx          # Options data & state
│   │   ├── TradingContext.tsx          # Portfolio & trading state
│   │   └── OptionsDataContext.tsx      # Live market data
│   │
│   ├── pages/               # Page components (Routes)
│   │   ├── Landing.tsx                 # Landing page
│   │   ├── Dashboard.tsx               # Main dashboard
│   │   ├── OptionsTrading.tsx          # Options trading interface
│   │   ├── OptionsPortfolio.tsx        # Portfolio management
│   │   ├── OptionsChain.tsx            # Options chain viewer
│   │   ├── Analytics.tsx               # Performance analytics
│   │   ├── TradingJournal.tsx          # Trade journal
│   │   ├── Community.tsx               # Community integration
│   │   ├── SentimentAnalysis.tsx       # Market sentiment
│   │   ├── RegimeAnalysis.tsx          # Market regime analysis
│   │   ├── EventOptionsAnalysis.tsx    # Event-driven analysis
│   │   ├── OptionsStrategies.tsx       # Strategy templates
│   │   ├── OptionsLearning.tsx         # Educational content
│   │   ├── SubscriptionPage.tsx        # Subscription management
│   │   ├── AdminDashboard.tsx          # Admin panel
│   │   └── ...
│   │
│   ├── services/            # Business logic & API integrations
│   │   ├── polygonService.ts           # Polygon.io API client
│   │   ├── polygonOptionsDataService.ts # Options data fetching
│   │   ├── liveOptionsDataService.ts   # Real-time data management
│   │   ├── optionsChainGenerator.ts    # Options chain generation
│   │   ├── greeksCalculator.ts         # Options Greeks calculation
│   │   ├── greeksUpdateService.ts      # Greeks real-time updates
│   │   ├── blackScholesService.ts      # Pricing models
│   │   ├── historicalDataService.ts    # Historical data management
│   │   ├── payoffCalculationService.ts # P&L calculations
│   │   ├── strategyValidationService.ts # Strategy validation
│   │   ├── sentimentAnalysisService.ts # Sentiment analysis
│   │   ├── finbertSentimentService.ts  # FinBERT ML sentiment
│   │   ├── optionsSentimentService.ts  # Options-specific sentiment
│   │   ├── newsFeedService.ts          # News aggregation
│   │   ├── marketEventsService.ts      # Corporate events tracking
│   │   ├── eventAdjustedPricingService.ts # Event impact pricing
│   │   ├── regimeAnalysisService.ts    # Market regime detection
│   │   ├── kellyCriterionService.ts    # Position sizing
│   │   ├── tradingHistoryService.ts    # Trade history management
│   │   ├── communityService.ts         # Multi-platform integration
│   │   ├── stripeService.ts            # Payment processing
│   │   ├── stripeCheckout.ts           # Checkout flow
│   │   ├── couponService.ts            # Discount management
│   │   ├── adminService.ts             # Admin operations
│   │   ├── learningService.ts          # Educational content
│   │   ├── constantContactService.ts   # Email marketing
│   │   ├── buyMeCoffeeService.ts       # Donation integration
│   │   └── ...
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts                    # Shared types
│   │
│   ├── utils/               # Utility functions
│   │   └── errorHandling.ts            # Error handling utilities
│   │
│   ├── api/                 # API utilities
│   │   └── testRunner.ts               # Test automation
│   │
│   └── App.tsx              # Root application component
│
├── e2e/                     # End-to-end tests
│   ├── optionschain.spec.ts
│   └── ...
│
├── public/                  # Static assets
├── .env                     # Environment configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── playwright.config.ts     # Playwright test configuration
```

### Architecture Layers

#### 1. **Presentation Layer**

**Components:**
- **Pages**: Full-page components mapped to routes
- **UI Components**: Reusable building blocks (buttons, forms, charts, tables)
- **Layout Components**: App structure (AppLayout, ErrorBoundary, ProtectedRoute)
- **Specialized Components**: TradingView widgets, options chains, payoff diagrams

**Responsibilities:**
- Render UI based on application state
- Handle user interactions and events
- Route navigation and lazy loading
- Display loading states and errors
- Responsive design and mobile optimization

**Key Patterns:**
- Lazy loading for performance optimization
- Error boundaries for graceful error handling
- Protected routes for authentication
- SEO optimization with React Helmet

#### 2. **Application Layer (Context Providers)**

**Contexts:**

1. **AuthProvider** (`components/AuthProvider.tsx`)
   - User authentication state
   - Login/logout flows
   - Session management
   - Supabase integration

2. **TradingContext** (`context/TradingContext.tsx`)
   - Portfolio state management
   - Order execution and management
   - Position tracking
   - P&L calculation
   - Trade history

3. **OptionsContext** (`context/OptionsContext.tsx`)
   - Selected options contracts
   - Strategy management
   - Multi-leg strategy state
   - Greeks and pricing data

4. **OptionsDataContext** (`context/OptionsDataContext.tsx`)
   - Real-time market data
   - Options chain data
   - Live price updates
   - Data refresh scheduling

**Responsibilities:**
- Global state management using React Context
- Centralized business logic
- Data flow coordination between components
- State persistence to localStorage/Supabase
- Cross-component communication

#### 3. **Service Layer**

**Categories:**

**Market Data Services:**
- `polygonService.ts` - Core API client for Polygon.io
- `polygonOptionsDataService.ts` - Options data fetching
- `liveOptionsDataService.ts` - Real-time data orchestration
- `historicalDataService.ts` - Historical data caching
- `optionsChainGenerator.ts` - Options chain construction

**Pricing & Analytics Services:**
- `greeksCalculator.ts` - Delta, Gamma, Theta, Vega calculations
- `blackScholesService.ts` - Black-Scholes pricing model
- `payoffCalculationService.ts` - Strategy P&L calculations
- `eventAdjustedPricingService.ts` - Event-driven pricing adjustments
- `kellyCriterionService.ts` - Position sizing optimization

**Sentiment & Analysis Services:**
- `sentimentAnalysisService.ts` - Overall sentiment analysis
- `finbertSentimentService.ts` - ML-based financial sentiment
- `optionsSentimentService.ts` - Options-specific indicators
- `newsFeedService.ts` - News aggregation and parsing
- `marketEventsService.ts` - Corporate events tracking
- `regimeAnalysisService.ts` - Market regime detection

**Trading & Strategy Services:**
- `strategyValidationService.ts` - Strategy validation logic
- `tradingHistoryService.ts` - Trade history management
- `optionsDataScheduler.ts` - Scheduled data updates
- `greeksUpdateService.ts` - Real-time Greeks updates

**Integration Services:**
- `stripeService.ts` - Stripe payment integration
- `stripeCheckout.ts` - Checkout session management
- `couponService.ts` - Promotional code handling
- `communityService.ts` - Multi-platform community integration
- `constantContactService.ts` - Email marketing
- `buyMeCoffeeService.ts` - Donation platform

**Admin & Educational Services:**
- `adminService.ts` - Admin dashboard operations
- `learningService.ts` - Educational content management

**Responsibilities:**
- Abstract external API interactions
- Implement business logic and calculations
- Handle data transformations
- Manage caching and data persistence
- Error handling and retry logic
- Rate limiting and throttling

**Key Patterns:**
- Singleton pattern for service instances
- Factory pattern for data generation
- Strategy pattern for multiple pricing models
- Observer pattern for real-time updates

#### 4. **Data Layer**

**External Integrations:**

1. **Polygon.io API**
   - Real-time stock quotes
   - Options chain data
   - Historical OHLCV data
   - Market status and holidays

2. **Supabase**
   - User authentication and authorization
   - Portfolio data persistence
   - Trade history storage
   - User preferences and settings
   - Subscription management

3. **Stripe**
   - Payment processing
   - Subscription management
   - Webhook handling
   - Coupon and discount management

4. **Community Platforms**
   - Slack webhooks
   - Discord webhooks
   - Telegram bot API
   - WhatsApp integration
   - Facebook Graph API

5. **TradingView**
   - Advanced charting widgets
   - Technical indicators
   - Drawing tools and annotations

**Data Flow:**
```
External APIs → Service Layer → Context Providers → Components
                      ↓
               localStorage/Supabase
```

### Key Architectural Patterns

#### 1. **State Management Strategy**
- **Global State**: React Context API for shared application state
- **Local State**: React useState for component-specific state
- **Derived State**: useMemo for computed values
- **Persistence**: localStorage for offline support, Supabase for cross-device sync

#### 2. **Data Fetching Strategy**
- **Real-time Updates**: Scheduled polling at configurable intervals
- **Caching**: Service-level caching with TTL
- **Fallbacks**: Mock data when API unavailable
- **Error Recovery**: Automatic retry with exponential backoff

#### 3. **Code Splitting**
- Lazy loading of page components
- Dynamic imports for large dependencies
- Route-based code splitting
- Optimized bundle sizes

#### 4. **Error Handling**
- React Error Boundaries for component-level errors
- Service-level try-catch with detailed logging
- User-friendly error messages
- Error reporting and analytics

#### 5. **Security**
- Environment variable protection for API keys
- Protected routes for authenticated pages
- Admin routes with role-based access
- Secure webhook integrations
- HTTPS-only in production

### Data Flow Examples

#### Options Trading Flow
```
User Action (Buy Option)
    ↓
Component (OptionsTrading.tsx)
    ↓
Context (TradingContext)
    ↓
Services (polygonOptionsDataService, greeksCalculator)
    ↓
External API (Polygon.io)
    ↓
State Update (TradingContext)
    ↓
UI Re-render (Portfolio, P&L Display)
    ↓
Persistence (Supabase)
```

#### Real-time Price Update Flow
```
Scheduler (optionsDataScheduler)
    ↓
Service (liveOptionsDataService)
    ↓
API Call (polygonService)
    ↓
Data Processing (greeksCalculator, payoffCalculationService)
    ↓
Context Update (OptionsDataContext)
    ↓
Component Re-render (All subscribed components)
```

#### Community Sharing Flow
```
User Action (Share Trade)
    ↓
Component (Community.tsx)
    ↓
Service (communityService)
    ↓
Platform APIs (Slack, Discord, Telegram, etc.)
    ↓
Success/Error Feedback
    ↓
UI Update (Activity Feed)
```

### Performance Optimizations

1. **Lazy Loading**: Route-based code splitting reduces initial bundle size
2. **Memoization**: React.memo and useMemo prevent unnecessary re-renders
3. **Debouncing**: Input debouncing for search and filters
4. **Virtual Scrolling**: For large options chains and tables
5. **Caching**: Intelligent caching at service layer
6. **Batch Updates**: Batch state updates to minimize re-renders

### Scalability Considerations

1. **Modular Services**: Easy to add new data sources or pricing models
2. **Extensible Strategy System**: Plug-and-play strategy templates
3. **Multi-tenant Ready**: User isolation via Supabase RLS
4. **Horizontal Scaling**: Stateless architecture suitable for CDN deployment
5. **API Rate Limiting**: Built-in throttling and queue management

### Key Technologies
- **React 18** - UI framework with concurrent features
- **TypeScript** - Static typing for code safety
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Declarative client-side routing
- **Recharts** - Composable charting library
- **TradingView** - Professional-grade charting and technical analysis
- **Playwright** - Reliable end-to-end testing
- **Polygon.io** - Real-time and historical market data API
- **Supabase** - PostgreSQL database with realtime subscriptions
- **Stripe** - Secure payment processing and subscription management
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

## 🔧 Development

### Adding New Options Contracts
1. Update `TOP_LIQUID_OPTIONS` in `src/services/polygonService.ts`
2. Add corresponding test data
3. Update E2E tests if needed

### Customizing Update Intervals
Modify `VITE_OPTIONS_UPDATE_INTERVAL` in your `.env` file:
```bash
# Update every 2 seconds (faster)
VITE_OPTIONS_UPDATE_INTERVAL=2000

# Update every 10 seconds (slower)
VITE_OPTIONS_UPDATE_INTERVAL=10000
```

### Enabling Real Data
To use real Polygon.io data:
1. Get an API key from [Polygon.io](https://polygon.io)
2. Update your `.env` file:
```bash
VITE_POLYGON_API_KEY=your_real_api_key
VITE_ENABLE_REAL_TIME_DATA=true
VITE_ENABLE_MOCK_DATA=false
```

### Enabling Data Persistence
To use Supabase for data persistence:
1. Create a Supabase project at [Supabase](https://supabase.com)
2. Update your `.env` file:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_DATA_PERSISTENCE=true
```

### Setting Up Stripe Integration
To enable subscription features:
1. Create a Stripe account at [Stripe](https://stripe.com)
2. Create products and prices in the Stripe dashboard
3. Update your `.env` file:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id
VITE_STRIPE_YEARLY_PRICE_ID=your_yearly_price_id
```

## 📱 Mobile Support

The platform is fully responsive and includes:
- Mobile-optimized navigation
- Touch-friendly trading interfaces
- Responsive charts and tables
- Mobile-specific E2E tests

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Netlify
The project is configured for easy deployment to Netlify:

1. Connect your GitHub repository to Netlify
2. Set up the build command: `npm run build`
3. Set the publish directory: `dist`
4. Configure environment variables in the Netlify dashboard
5. Deploy!

## 📈 Performance

- **Real-time Updates**: Configurable update intervals
- **Data Persistence**: Local storage for offline capability
- **Lazy Loading**: Optimized component loading
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error boundaries and logging
- **Testing Tools**: Built-in testing utilities for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Review the environment configuration
3. Verify your Polygon.io API key (if using real data)
4. Run the E2E tests to identify specific problems

---

**Happy Trading! 📈**