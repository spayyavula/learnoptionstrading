import { supabase } from '../lib/supabase'
import type { StrategyLeg, ValidationResult } from './strategyValidationService'

export interface SavedStrategy {
  id: string
  user_id: string
  strategy_name: string
  custom_name?: string
  underlying_ticker: string
  expiration_date: string
  legs: StrategyLeg[]
  validation_result?: ValidationResult
  notes?: string
  is_favorite: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface StrategyTemplate {
  id: string
  name: string
  description: string
  strategy_type: string
  is_public: boolean
  created_by?: string
  legs_config: {
    legs: Array<{
      action: 'buy' | 'sell'
      type: 'call' | 'put'
      strike_offset: number
    }>
  }
  created_at: string
  updated_at: string
}

export interface StrategyShare {
  id: string
  strategy_id: string
  share_token: string
  shared_by: string
  view_count: number
  expires_at?: string
  created_at: string
}

export class SavedStrategiesService {
  static async saveStrategy(strategy: Partial<SavedStrategy>): Promise<SavedStrategy> {
    const { data, error } = await supabase
      .from('saved_strategies')
      .insert([strategy])
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Failed to save strategy')

    return data
  }

  static async getUserStrategies(userId: string): Promise<SavedStrategy[]> {
    const { data, error } = await supabase
      .from('saved_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getFavoriteStrategies(userId: string): Promise<SavedStrategy[]> {
    const { data, error } = await supabase
      .from('saved_strategies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getStrategyById(strategyId: string): Promise<SavedStrategy | null> {
    const { data, error } = await supabase
      .from('saved_strategies')
      .select('*')
      .eq('id', strategyId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async updateStrategy(
    strategyId: string,
    updates: Partial<SavedStrategy>
  ): Promise<SavedStrategy> {
    const { data, error } = await supabase
      .from('saved_strategies')
      .update(updates)
      .eq('id', strategyId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Failed to update strategy')

    return data
  }

  static async deleteStrategy(strategyId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_strategies')
      .delete()
      .eq('id', strategyId)

    if (error) throw error
  }

  static async toggleFavorite(strategyId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('saved_strategies')
      .update({ is_favorite: isFavorite })
      .eq('id', strategyId)

    if (error) throw error
  }

  static async getPublicTemplates(): Promise<StrategyTemplate[]> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createTemplate(template: Partial<StrategyTemplate>): Promise<StrategyTemplate> {
    const { data, error } = await supabase
      .from('strategy_templates')
      .insert([template])
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Failed to create template')

    return data
  }

  static async createShareLink(
    strategyId: string,
    expiresInDays?: number
  ): Promise<StrategyShare> {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('strategy_shares')
      .insert([
        {
          strategy_id: strategyId,
          shared_by: userData.user.id,
          expires_at: expiresAt
        }
      ])
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Failed to create share link')

    return data
  }

  static async getSharedStrategy(shareToken: string): Promise<{
    strategy: SavedStrategy
    share: StrategyShare
  } | null> {
    const { data: share, error: shareError } = await supabase
      .from('strategy_shares')
      .select('*')
      .eq('share_token', shareToken)
      .maybeSingle()

    if (shareError || !share) return null

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return null
    }

    await supabase
      .from('strategy_shares')
      .update({ view_count: share.view_count + 1 })
      .eq('id', share.id)

    const { data: strategy, error: strategyError } = await supabase
      .from('saved_strategies')
      .select('*')
      .eq('id', share.strategy_id)
      .maybeSingle()

    if (strategyError || !strategy) return null

    return { strategy, share }
  }

  static async deleteShareLink(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('strategy_shares')
      .delete()
      .eq('id', shareId)

    if (error) throw error
  }

  static async searchStrategies(
    userId: string,
    filters: {
      strategyName?: string
      underlyingTicker?: string
      isFavorite?: boolean
    }
  ): Promise<SavedStrategy[]> {
    let query = supabase
      .from('saved_strategies')
      .select('*')
      .eq('user_id', userId)

    if (filters.strategyName) {
      query = query.eq('strategy_name', filters.strategyName)
    }

    if (filters.underlyingTicker) {
      query = query.eq('underlying_ticker', filters.underlyingTicker)
    }

    if (filters.isFavorite !== undefined) {
      query = query.eq('is_favorite', filters.isFavorite)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static getShareUrl(shareToken: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/shared-strategy/${shareToken}`
  }

  static async duplicateStrategy(strategyId: string): Promise<SavedStrategy> {
    const original = await this.getStrategyById(strategyId)
    if (!original) throw new Error('Strategy not found')

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const duplicate = {
      user_id: userData.user.id,
      strategy_name: original.strategy_name,
      custom_name: original.custom_name ? `${original.custom_name} (Copy)` : undefined,
      underlying_ticker: original.underlying_ticker,
      expiration_date: original.expiration_date,
      legs: original.legs,
      validation_result: original.validation_result,
      notes: original.notes,
      is_favorite: false,
      is_template: false
    }

    return this.saveStrategy(duplicate)
  }
}
