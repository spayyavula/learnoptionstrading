# Options Academy — Learning Project

A personal learning project for exploring options trading concepts hands-on. Built with React, TypeScript, and Vite, with Polygon.io for market data and Supabase for optional persistence.

> **This is not a paid service, not a SaaS, and not financial advice.** It exists as a sandbox for the author to learn options pricing, Greeks, paper trading mechanics, and related domain concepts. You're welcome to read the code or run it locally — there is nothing to subscribe to.

## What's in here

### Paper trading
- Options chain with Greeks (Delta, Gamma, Theta, Vega) and implied volatility
- Buy/Sell to Open/Close simulation against simulated or live prices
- Portfolio and P&L tracking, position analysis
- Stock and watchlist tooling alongside the options surface

### Market data
- Polygon.io for live data when an API key is provided
- TradingView widgets for charting
- Simulated fallback data when no key is present

### Learning surface
- Educational modules, strategy library, journal, regime/sentiment analysis pages
- All UI is local — no payments anywhere in the app

### Stack notes
- React 18 + TypeScript + Vite + Tailwind
- React Router for routing, Recharts for plots
- Supabase auth/persistence (optional)
- Playwright + Vitest for testing

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

# For Supabase integration (optional):
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── pages/              # Page components
├── services/           # API and data services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and error handling
└── tests/              # E2E test files
```

### Key Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **TradingView** - Advanced charting and technical analysis
- **Playwright** - E2E testing
- **Polygon.io** - Market data API
- **Supabase** - Database and authentication
- **Tailwind CSS** - Utility-first CSS framework

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