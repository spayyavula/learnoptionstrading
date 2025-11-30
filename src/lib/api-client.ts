/**
 * API Client for Azure Functions Backend
 *
 * This module replaces direct Supabase calls with REST API calls
 * to the Azure Functions backend.
 */

import { getAccessToken, isValidConfig as isAuthConfigured } from './azure-auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get access token if authenticated
    const token = await getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        return { data: null, error: `HTTP ${response.status}: ${response.statusText}` };
      }
      return { data: null, error: null };
    }

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('API request failed:', error);
    return { data: null, error: error.message || 'Network error' };
  }
}

/**
 * API client with typed methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, params?: Record<string, string>) => {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return request<T>(url, { method: 'GET' });
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ============================================================
// Trading API
// ============================================================

export interface Trade {
  id: string;
  contract_ticker: string;
  underlying_ticker: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  profit_loss: number | null;
  entry_date: string;
  exit_date: string | null;
  strategy_type: string | null;
  is_winner: boolean | null;
  notes: string | null;
}

export interface TradingMetrics {
  user_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  average_win: number;
  average_loss: number;
  win_rate: number;
  win_loss_ratio: number;
  kelly_percentage: number;
  total_profit_loss: number;
  best_trade: number;
  worst_trade: number;
  average_holding_period_days: number;
}

export const tradingApi = {
  getHistory: (page = 1, pageSize = 50) =>
    api.get<{ trades: Trade[]; total: number; page: number; pageSize: number }>(
      '/trading/history',
      { page: String(page), pageSize: String(pageSize) }
    ),

  createTrade: (trade: Omit<Trade, 'id' | 'exit_price' | 'exit_date' | 'profit_loss' | 'is_winner'>) =>
    api.post<{ trade: Trade }>('/trading/trades', trade),

  closeTrade: (tradeId: string, exitPrice: number, notes?: string) =>
    api.put<{ trade: Trade }>(`/trading/trades/${tradeId}/close`, {
      exit_price: exitPrice,
      notes,
    }),

  getMetrics: () =>
    api.get<{ metrics: TradingMetrics }>('/trading/metrics'),
};

// ============================================================
// Strategies API
// ============================================================

export interface StrategyLeg {
  type: 'call' | 'put';
  side: 'buy' | 'sell';
  strike: number;
  expiration: string;
  quantity: number;
}

export interface SavedStrategy {
  id: string;
  strategy_name: string;
  underlying_ticker: string;
  legs: StrategyLeg[];
  notes: string | null;
  is_favorite: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export const strategiesApi = {
  getAll: (options?: { favorites?: boolean; ticker?: string }) =>
    api.get<{ strategies: SavedStrategy[] }>('/strategies', {
      ...(options?.favorites && { favorites: 'true' }),
      ...(options?.ticker && { ticker: options.ticker }),
    }),

  save: (strategy: Omit<SavedStrategy, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ strategy: SavedStrategy }>('/strategies', strategy),

  update: (strategyId: string, updates: Partial<SavedStrategy>) =>
    api.put<{ strategy: SavedStrategy }>(`/strategies/${strategyId}`, updates),

  delete: (strategyId: string) =>
    api.delete<void>(`/strategies/${strategyId}`),

  toggleFavorite: (strategyId: string, isFavorite: boolean) =>
    api.patch<{ strategy: SavedStrategy }>(`/strategies/${strategyId}`, {
      is_favorite: isFavorite,
    }),
};

// ============================================================
// Subscription API
// ============================================================

export interface Subscription {
  user_id: string;
  customer_id: string;
  subscription_id: string;
  status: string;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number | null;
}

export const subscriptionApi = {
  getStatus: () =>
    api.get<SubscriptionStatus>('/subscription'),

  createCheckout: (priceId: string, successUrl: string, cancelUrl: string) =>
    api.post<{ sessionId: string; url: string }>('/stripe/checkout', {
      priceId,
      successUrl,
      cancelUrl,
    }),

  cancel: (subscriptionId: string) =>
    api.post<{ success: boolean }>('/stripe/cancel', { subscriptionId }),

  getPortalUrl: () =>
    api.get<{ url: string }>('/stripe/portal'),
};

// ============================================================
// Broker Credentials API
// ============================================================

export interface BrokerCredentials {
  broker: string;
  is_active: boolean;
  environment: 'paper' | 'live';
  last_synced: string | null;
}

export const brokerApi = {
  getCredentials: (broker: string) =>
    api.get<{ credentials: BrokerCredentials | null }>(`/broker/${broker}/credentials`),

  saveCredentials: (broker: string, credentials: Record<string, any>) =>
    api.post<{ success: boolean }>(`/broker/${broker}/credentials`, credentials),

  deleteCredentials: (broker: string) =>
    api.delete<{ success: boolean }>(`/broker/${broker}/credentials`),

  testConnection: (broker: string) =>
    api.post<{ success: boolean; message: string }>(`/broker/${broker}/test`, {}),
};

// ============================================================
// Health Check
// ============================================================

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    api: boolean;
    database: boolean;
  };
}

export const healthApi = {
  check: () => api.get<HealthStatus>('/health'),
};

// ============================================================
// Demo Mode Support
// ============================================================

/**
 * Check if we should use demo mode (no auth configured or user not logged in)
 */
export function shouldUseDemoMode(): boolean {
  return !isAuthConfigured;
}

/**
 * Get demo mode notice
 */
export function getDemoModeNotice(): string {
  return 'Running in demo mode. Data is stored locally and will not persist across sessions.';
}
