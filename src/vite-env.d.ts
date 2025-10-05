/// <reference types="vite/client" />

declare global {
  interface Window {
    TradingView?: any;
  }
}

export {};

interface ImportMetaEnv {
  readonly VITE_POLYGON_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEV_MODE: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_POLYGON_BASE_URL: string
  readonly VITE_OPTIONS_UPDATE_INTERVAL: string
  readonly VITE_MAX_HISTORICAL_DAYS: string
  readonly VITE_DEFAULT_PORTFOLIO_VALUE: string
  readonly VITE_ENABLE_OPTIONS_TRADING: string
  readonly VITE_ENABLE_REAL_TIME_DATA: string
  readonly VITE_ENABLE_ADVANCED_CHARTS: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_ENABLE_DATA_PERSISTENCE: string
  readonly VITE_HISTORICAL_DATA_RETENTION_DAYS: string
  readonly VITE_STRIPE_MONTHLY_PRICE_ID: string
  readonly VITE_STRIPE_YEARLY_PRICE_ID: string
  readonly VITE_STRIPE_COFFEE_PRICE_ID: string
  readonly VITE_CONSTANT_CONTACT_API_KEY: string
  readonly VITE_CONSTANT_CONTACT_ACCESS_TOKEN: string
  readonly VITE_CONSTANT_CONTACT_LIST_ID: string
  readonly VITE_BUY_ME_COFFEE_USERNAME: string
  readonly VITE_BUY_ME_COFFEE_WIDGET_ID: string
  readonly VITE_SLACK_WEBHOOK_URL: string
  readonly VITE_DISCORD_WEBHOOK_URL: string
  readonly VITE_TELEGRAM_BOT_TOKEN: string
  readonly VITE_TELEGRAM_CHAT_ID: string
  readonly VITE_TELEGRAM_CHANNEL: string
  readonly VITE_WHATSAPP_GROUP_INVITE: string
  readonly VITE_FACEBOOK_GROUP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}