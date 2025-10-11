import { supabase } from '../lib/supabase'
import type { StrategyTemplate } from '../types/learning'

export interface SavedStrategyTemplate extends StrategyTemplate {
  id: string
  userId: string
  isPublic: boolean
  isFavorite: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface StrategyTemplateUsage {
  id: string
  userId: string
  templateId: string
  underlyingTicker: string
  quantity: number
  entryDate: Date
  exitDate?: Date
  pnl?: number
  notes?: string
  createdAt: Date
}

export class StrategyTemplateService {
  static async saveTemplate(template: StrategyTemplate, userId: string): Promise<SavedStrategyTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('strategy_templates')
        .insert({
          user_id: userId,
          name: template.name,
          description: template.description,
          type: template.type,
          complexity: template.complexity,
          legs: template.legs,
          max_risk: template.maxRisk,
          max_profit: template.maxProfit === Infinity ? 999999999 : template.maxProfit,
          breakeven: template.breakeven,
          best_market_conditions: template.bestMarketConditions,
          worst_market_conditions: template.worstMarketConditions,
          time_decay: template.timeDecay,
          volatility_impact: template.volatilityImpact,
          instructions: template.instructions || [],
          examples: template.examples || [],
          is_public: false,
          is_favorite: false
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data ? this.mapToTemplate(data) : null
    } catch (error) {
      console.error('Error saving strategy template:', error)
      return null
    }
  }

  static async getUserTemplates(userId: string): Promise<SavedStrategyTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ? data.map(this.mapToTemplate) : []
    } catch (error) {
      console.error('Error fetching user templates:', error)
      return []
    }
  }

  static async getPublicTemplates(): Promise<SavedStrategyTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ? data.map(this.mapToTemplate) : []
    } catch (error) {
      console.error('Error fetching public templates:', error)
      return []
    }
  }

  static async getFavoriteTemplates(userId: string): Promise<SavedStrategyTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data ? data.map(this.mapToTemplate) : []
    } catch (error) {
      console.error('Error fetching favorite templates:', error)
      return []
    }
  }

  static async toggleFavorite(templateId: string, userId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('strategy_templates')
        .update({ is_favorite: isFavorite })
        .eq('id', templateId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return false
    }
  }

  static async deleteTemplate(templateId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('strategy_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      return false
    }
  }

  static async recordTemplateUsage(
    templateId: string,
    userId: string,
    underlyingTicker: string,
    quantity: number,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('strategy_template_usage')
        .insert({
          user_id: userId,
          template_id: templateId,
          underlying_ticker: underlyingTicker,
          quantity,
          notes
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error recording template usage:', error)
      return false
    }
  }

  static async getTemplateUsageHistory(userId: string): Promise<StrategyTemplateUsage[]> {
    try {
      const { data, error } = await supabase
        .from('strategy_template_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ? data.map(this.mapToUsage) : []
    } catch (error) {
      console.error('Error fetching usage history:', error)
      return []
    }
  }

  private static mapToTemplate(data: any): SavedStrategyTemplate {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      type: data.type,
      complexity: data.complexity,
      legs: data.legs,
      maxRisk: parseFloat(data.max_risk),
      maxProfit: parseFloat(data.max_profit) >= 999999999 ? Infinity : parseFloat(data.max_profit),
      breakeven: data.breakeven,
      bestMarketConditions: data.best_market_conditions,
      worstMarketConditions: data.worst_market_conditions,
      timeDecay: data.time_decay,
      volatilityImpact: data.volatility_impact,
      instructions: data.instructions || [],
      examples: data.examples || [],
      isPublic: data.is_public,
      isFavorite: data.is_favorite,
      usageCount: data.usage_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  private static mapToUsage(data: any): StrategyTemplateUsage {
    return {
      id: data.id,
      userId: data.user_id,
      templateId: data.template_id,
      underlyingTicker: data.underlying_ticker,
      quantity: data.quantity,
      entryDate: new Date(data.entry_date),
      exitDate: data.exit_date ? new Date(data.exit_date) : undefined,
      pnl: data.pnl ? parseFloat(data.pnl) : undefined,
      notes: data.notes,
      createdAt: new Date(data.created_at)
    }
  }
}
