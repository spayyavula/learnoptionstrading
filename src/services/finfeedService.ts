/**
 * FinFeed Service - Aggregates prediction markets from multiple sources
 * Sources: Polymarket, Manifold, Metaculus, PredictIt, and more
 */

import { supabase } from '../lib/supabase';

export interface FinFeedMarket {
  id: string;
  ticker: string;
  title: string;
  description: string;
  category: string;
  source: 'polymarket' | 'manifold' | 'metaculus' | 'predictit' | 'kalshi';
  source_name: string;
  yes_price: number;
  no_price: number;
  yes_ask: number;
  no_ask: number;
  volume_24h: number;
  total_volume: number;
  liquidity: number;
  open_interest?: number;
  close_date: string;
  status: 'active' | 'closed' | 'resolved';
  resolution?: 'yes' | 'no' | null;
  created_at: string;
  updated_at: string;
  metadata?: {
    tags?: string[];
    image_url?: string;
    url?: string;
    creator?: string;
  };
}

export interface FinFeedPosition {
  id: string;
  user_id: string;
  market_id: string;
  market_ticker: string;
  market_title: string;
  source: string;
  position_side: 'yes' | 'no';
  quantity: number;
  average_price: number;
  market_price: number;
  unrealized_pnl: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface FinFeedOrder {
  id: string;
  market_ticker: string;
  order_type: 'market' | 'limit';
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  quantity: number;
  limit_price?: number;
  filled_quantity?: number;
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled';
  submitted_at: string;
  filled_at?: string;
}

export interface FinFeedAccount {
  user_id: string;
  total_balance: number;
  available_balance: number;
  portfolio_value: number;
  total_pnl: number;
  total_trades: number;
  win_rate: number;
}

export interface MarketFilters {
  source?: string;
  category?: string;
  status?: string;
  search?: string;
  min_volume?: number;
  max_days_to_close?: number;
  limit?: number;
  offset?: number;
}

export class FinFeedService {
  private static readonly BASE_URL = 'https://api.finfeed.io/v1'; // Mock URL
  private static readonly DEMO_MARKETS_KEY = 'finfeed_demo_markets';
  private static readonly DEMO_POSITIONS_KEY = 'finfeed_demo_positions';
  private static readonly DEMO_ORDERS_KEY = 'finfeed_demo_orders';
  private static readonly DEMO_ACCOUNT_KEY = 'finfeed_demo_account';

  /**
   * Check if user has configured FinFeed access
   */
  static async isConfigured(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<boolean> {
    if (environment === 'demo') {
      // Demo mode is always configured
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('finfeed_credentials')
        .select('*')
        .eq('user_id', userId)
        .single();

      return !error && data?.api_key != null;
    } catch {
      return false;
    }
  }

  /**
   * Get user account information
   */
  static async getAccount(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<FinFeedAccount> {
    if (environment === 'demo') {
      return this.getDemoAccount(userId);
    }

    // In production, would call FinFeed API
    return this.getDemoAccount(userId);
  }

  /**
   * Get markets from multiple sources
   */
  static async getMarkets(
    userId: string,
    environment: 'live' | 'demo' = 'demo',
    filters: MarketFilters = {}
  ): Promise<{ markets: FinFeedMarket[]; total: number }> {
    if (environment === 'demo') {
      return this.getDemoMarkets(filters);
    }

    // In production, would call FinFeed API
    return this.getDemoMarkets(filters);
  }

  /**
   * Get user positions across all sources
   */
  static async getPositions(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<FinFeedPosition[]> {
    if (environment === 'demo') {
      return this.getDemoPositions(userId);
    }

    // In production, would call FinFeed API
    return this.getDemoPositions(userId);
  }

  /**
   * Get user orders
   */
  static async getOrders(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<FinFeedOrder[]> {
    if (environment === 'demo') {
      return this.getDemoOrders(userId);
    }

    // In production, would call FinFeed API
    return this.getDemoOrders(userId);
  }

  /**
   * Place an order
   */
  static async placeOrder(
    userId: string,
    environment: 'live' | 'demo' = 'demo',
    order: Partial<FinFeedOrder>
  ): Promise<FinFeedOrder> {
    if (environment === 'demo') {
      return this.placeDemoOrder(userId, order);
    }

    // In production, would call FinFeed API
    return this.placeDemoOrder(userId, order);
  }

  /**
   * Get market orderbook (for advanced trading)
   */
  static async getMarketOrderbook(
    userId: string,
    environment: 'live' | 'demo',
    marketTicker: string
  ): Promise<any> {
    // Mock orderbook data
    return {
      yes_bids: [
        { price: 0.52, quantity: 1000 },
        { price: 0.51, quantity: 2000 },
        { price: 0.50, quantity: 5000 },
      ],
      yes_asks: [
        { price: 0.53, quantity: 1500 },
        { price: 0.54, quantity: 2500 },
        { price: 0.55, quantity: 3000 },
      ],
      no_bids: [
        { price: 0.47, quantity: 1200 },
        { price: 0.46, quantity: 2200 },
        { price: 0.45, quantity: 4500 },
      ],
      no_asks: [
        { price: 0.48, quantity: 1800 },
        { price: 0.49, quantity: 2800 },
        { price: 0.50, quantity: 3500 },
      ],
    };
  }

  // ========== DEMO MODE METHODS ==========

  private static getDemoAccount(userId: string): FinFeedAccount {
    const stored = localStorage.getItem(this.DEMO_ACCOUNT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const account: FinFeedAccount = {
      user_id: userId,
      total_balance: 10000,
      available_balance: 7500,
      portfolio_value: 10500,
      total_pnl: 500,
      total_trades: 0,
      win_rate: 0,
    };

    localStorage.setItem(this.DEMO_ACCOUNT_KEY, JSON.stringify(account));
    return account;
  }

  private static getDemoMarkets(filters: MarketFilters = {}): { markets: FinFeedMarket[]; total: number } {
    const stored = localStorage.getItem(this.DEMO_MARKETS_KEY);
    let markets: FinFeedMarket[];

    if (stored) {
      markets = JSON.parse(stored);
    } else {
      markets = this.generateDemoMarkets();
      localStorage.setItem(this.DEMO_MARKETS_KEY, JSON.stringify(markets));
    }

    // Apply filters
    let filtered = markets;

    if (filters.source) {
      filtered = filtered.filter(m => m.source === filters.source);
    }

    if (filters.category) {
      filtered = filtered.filter(m => m.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search)
      );
    }

    if (filters.min_volume) {
      filtered = filtered.filter(m => m.volume_24h >= filters.min_volume);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    return {
      markets: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  private static getDemoPositions(userId: string): FinFeedPosition[] {
    const stored = localStorage.getItem(this.DEMO_POSITIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }

  private static getDemoOrders(userId: string): FinFeedOrder[] {
    const stored = localStorage.getItem(this.DEMO_ORDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }

  private static placeDemoOrder(userId: string, orderData: Partial<FinFeedOrder>): FinFeedOrder {
    const orders = this.getDemoOrders(userId);
    const positions = this.getDemoPositions(userId);
    const markets = this.getDemoMarkets().markets;
    const account = this.getDemoAccount(userId);

    const market = markets.find(m => m.ticker === orderData.market_ticker);
    if (!market) {
      throw new Error('Market not found');
    }

    const price = orderData.side === 'yes' ? market.yes_ask : market.no_ask;
    const cost = (orderData.quantity || 0) * price;

    if (cost > account.available_balance) {
      throw new Error('Insufficient balance');
    }

    // Create order
    const order: FinFeedOrder = {
      id: `order-${Date.now()}`,
      market_ticker: orderData.market_ticker!,
      order_type: orderData.order_type || 'market',
      side: orderData.side!,
      action: 'buy',
      quantity: orderData.quantity || 0,
      limit_price: orderData.limit_price,
      filled_quantity: orderData.quantity,
      status: 'filled',
      submitted_at: new Date().toISOString(),
      filled_at: new Date().toISOString(),
    };

    // Update or create position
    const existingPosition = positions.find(
      p => p.market_ticker === order.market_ticker && p.position_side === order.side
    );

    if (existingPosition) {
      // Update existing position
      const totalQuantity = existingPosition.quantity + order.quantity;
      const totalCost = existingPosition.total_cost + cost;
      existingPosition.quantity = totalQuantity;
      existingPosition.average_price = totalCost / totalQuantity;
      existingPosition.total_cost = totalCost;
      existingPosition.market_price = price;
      existingPosition.unrealized_pnl = (price - existingPosition.average_price) * totalQuantity;
      existingPosition.updated_at = new Date().toISOString();
    } else {
      // Create new position
      const newPosition: FinFeedPosition = {
        id: `pos-${Date.now()}`,
        user_id: userId,
        market_id: market.id,
        market_ticker: market.ticker,
        market_title: market.title,
        source: market.source_name,
        position_side: order.side,
        quantity: order.quantity,
        average_price: price,
        market_price: price,
        unrealized_pnl: 0,
        total_cost: cost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      positions.push(newPosition);
    }

    // Update account
    account.available_balance -= cost;
    account.total_trades += 1;

    // Save
    orders.push(order);
    localStorage.setItem(this.DEMO_ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem(this.DEMO_POSITIONS_KEY, JSON.stringify(positions));
    localStorage.setItem(this.DEMO_ACCOUNT_KEY, JSON.stringify(account));

    return order;
  }

  private static generateDemoMarkets(): FinFeedMarket[] {
    const sources: Array<{ source: FinFeedMarket['source']; name: string }> = [
      { source: 'polymarket', name: 'Polymarket' },
      { source: 'manifold', name: 'Manifold' },
      { source: 'metaculus', name: 'Metaculus' },
      { source: 'predictit', name: 'PredictIt' },
      { source: 'kalshi', name: 'Kalshi' },
    ];

    const categories = ['Politics', 'Economics', 'Technology', 'Sports', 'Entertainment', 'Science', 'Crypto'];

    const templates = [
      { title: 'Will Bitcoin reach $100,000 in 2025?', category: 'Crypto' },
      { title: 'Will inflation be below 3% by end of Q2 2025?', category: 'Economics' },
      { title: 'Will AI GPT-5 be released in 2025?', category: 'Technology' },
      { title: 'Will the S&P 500 reach 6000 by June 2025?', category: 'Economics' },
      { title: 'Will Apple announce a foldable iPhone in 2025?', category: 'Technology' },
      { title: 'Will Ethereum surpass $5000 in 2025?', category: 'Crypto' },
      { title: 'Will unemployment rate drop below 3% in 2025?', category: 'Economics' },
      { title: 'Will any new social media platform reach 100M users in 2025?', category: 'Technology' },
      { title: 'Will Tesla stock reach $300 in 2025?', category: 'Economics' },
      { title: 'Will a quantum computer solve a practical problem in 2025?', category: 'Science' },
      { title: 'Will the Lakers win the NBA championship 2024-25?', category: 'Sports' },
      { title: 'Will any movie gross over $2 billion in 2025?', category: 'Entertainment' },
      { title: 'Will US GDP growth exceed 3% in 2025?', category: 'Economics' },
      { title: 'Will a major tech company be broken up in 2025?', category: 'Technology' },
      { title: 'Will Dogecoin reach $1 in 2025?', category: 'Crypto' },
      { title: 'Will interest rates drop below 4% by end of 2025?', category: 'Economics' },
      { title: 'Will SpaceX successfully land humans on Mars in 2025?', category: 'Science' },
      { title: 'Will a new COVID variant cause lockdowns in 2025?', category: 'Science' },
      { title: 'Will any country ban Bitcoin in 2025?', category: 'Crypto' },
      { title: 'Will Google release a new AI model better than GPT-4 in 2025?', category: 'Technology' },
    ];

    const markets: FinFeedMarket[] = [];

    templates.forEach((template, idx) => {
      const source = sources[idx % sources.length];
      const yesPrice = 0.3 + Math.random() * 0.4; // 30-70%
      const noPrice = 1 - yesPrice;
      const closeDate = new Date();
      closeDate.setMonth(closeDate.getMonth() + (idx % 6 + 1)); // 1-6 months

      markets.push({
        id: `market-${idx + 1}`,
        ticker: `MKT-${(idx + 1).toString().padStart(4, '0')}`,
        title: template.title,
        description: `This market resolves YES if ${template.title.toLowerCase().replace('will ', '').replace('?', '')}. Otherwise, it resolves NO.`,
        category: template.category,
        source: source.source,
        source_name: source.name,
        yes_price: yesPrice,
        no_price: noPrice,
        yes_ask: yesPrice + 0.01,
        no_ask: noPrice + 0.01,
        volume_24h: Math.random() * 100000,
        total_volume: Math.random() * 1000000,
        liquidity: Math.random() * 500000,
        open_interest: Math.floor(Math.random() * 50000),
        close_date: closeDate.toISOString(),
        status: 'active',
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          tags: [template.category.toLowerCase()],
          url: `https://${source.name.toLowerCase()}.com/market/${idx + 1}`,
        },
      });
    });

    return markets;
  }

  /**
   * Sync markets from all sources
   */
  static async syncMarkets(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<void> {
    if (environment === 'demo') {
      // Refresh demo markets with updated prices
      const markets = this.generateDemoMarkets();
      localStorage.setItem(this.DEMO_MARKETS_KEY, JSON.stringify(markets));
      return;
    }

    // In production, would call FinFeed API to refresh all market data
  }

  /**
   * Sync portfolio data
   */
  static async syncPortfolio(userId: string, environment: 'live' | 'demo' = 'demo'): Promise<void> {
    if (environment === 'demo') {
      const positions = this.getDemoPositions(userId);
      const markets = this.getDemoMarkets().markets;

      // Update position prices
      positions.forEach(position => {
        const market = markets.find(m => m.ticker === position.market_ticker);
        if (market) {
          const price = position.position_side === 'yes' ? market.yes_price : market.no_price;
          position.market_price = price;
          position.unrealized_pnl = (price - position.average_price) * position.quantity;
        }
      });

      localStorage.setItem(this.DEMO_POSITIONS_KEY, JSON.stringify(positions));
      return;
    }

    // In production, would call FinFeed API
  }

  /**
   * Get available sources
   */
  static getAvailableSources(): Array<{ id: string; name: string; enabled: boolean }> {
    return [
      { id: 'polymarket', name: 'Polymarket', enabled: true },
      { id: 'manifold', name: 'Manifold', enabled: true },
      { id: 'metaculus', name: 'Metaculus', enabled: true },
      { id: 'predictit', name: 'PredictIt', enabled: true },
      { id: 'kalshi', name: 'Kalshi', enabled: false }, // Temporarily disabled
    ];
  }
}
