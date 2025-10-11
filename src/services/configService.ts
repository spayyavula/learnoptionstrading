import { supabase } from '../lib/supabase'

export interface ConfigKey {
  id: string
  key: string
  value: string | null
  description: string | null
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  is_required: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConfigSummary {
  id: string
  key: string
  description: string | null
  category: string
  priority: string
  is_required: boolean
  is_active: boolean
  is_configured: boolean
  created_at: string
  updated_at: string
}

export interface ConfigAuditLog {
  id: string
  config_id: string
  action: 'created' | 'updated' | 'deleted' | 'accessed'
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  ip_address: string | null
  user_agent: string | null
}

export class ConfigService {
  static async getAllConfigs(): Promise<ConfigKey[]> {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .order('priority', { ascending: true })
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching configs:', error)
      throw error
    }

    return data || []
  }

  static async getConfigSummary(): Promise<ConfigSummary[]> {
    const { data, error } = await supabase
      .from('config_summary')
      .select('*')
      .order('priority', { ascending: true })
      .order('key', { ascending: true })

    if (error) {
      console.error('Error fetching config summary:', error)
      throw error
    }

    return data || []
  }

  static async getConfigsByCategory(category: string): Promise<ConfigKey[]> {
    const { data, error } = await supabase.rpc('get_configs_by_category', {
      config_category: category
    })

    if (error) {
      console.error('Error fetching configs by category:', error)
      throw error
    }

    return data || []
  }

  static async getConfigValue(key: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('get_config_value', {
      config_key: key
    })

    if (error) {
      console.error('Error getting config value:', error)
      throw error
    }

    return data
  }

  static async setConfigValue(key: string, value: string): Promise<void> {
    const { error } = await supabase.rpc('set_config_value', {
      config_key: key,
      config_value: value
    })

    if (error) {
      console.error('Error setting config value:', error)
      throw error
    }
  }

  static async createConfig(config: {
    key: string
    value?: string
    description?: string
    category: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    is_required?: boolean
  }): Promise<ConfigKey> {
    const { data, error } = await supabase
      .from('app_config')
      .insert({
        key: config.key,
        value: config.value || null,
        description: config.description || null,
        category: config.category,
        priority: config.priority,
        is_required: config.is_required || false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating config:', error)
      throw error
    }

    return data
  }

  static async updateConfig(key: string, updates: Partial<ConfigKey>): Promise<void> {
    const { error } = await supabase
      .from('app_config')
      .update(updates)
      .eq('key', key)

    if (error) {
      console.error('Error updating config:', error)
      throw error
    }
  }

  static async deleteConfig(key: string): Promise<void> {
    const { error } = await supabase
      .from('app_config')
      .delete()
      .eq('key', key)

    if (error) {
      console.error('Error deleting config:', error)
      throw error
    }
  }

  static async bulkSetConfigs(configs: { key: string; value: string }[]): Promise<void> {
    for (const config of configs) {
      try {
        await this.setConfigValue(config.key, config.value)
      } catch (error) {
        console.error(`Error setting ${config.key}:`, error)
        throw error
      }
    }
  }

  static async importFromEnv(envContent: string): Promise<number> {
    const lines = envContent.split('\n')
    let imported = 0

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const match = trimmed.match(/^([A-Z_]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        const cleanValue = value.replace(/^["']|["']$/g, '')

        try {
          await this.setConfigValue(key, cleanValue)
          imported++
        } catch (error) {
          console.warn(`Could not import ${key}:`, error)
        }
      }
    }

    return imported
  }

  static async exportToEnv(): Promise<string> {
    const configs = await this.getAllConfigs()

    const lines: string[] = [
      '# Application Configuration',
      '# Generated on ' + new Date().toISOString(),
      '',
      '# =============================================================================',
      '# CRITICAL - Required for app to function',
      '# =============================================================================',
    ]

    const grouped: Record<string, ConfigKey[]> = {}

    configs.forEach(config => {
      if (!grouped[config.category]) {
        grouped[config.category] = []
      }
      grouped[config.category].push(config)
    })

    const categoryTitles: Record<string, string> = {
      database: 'DATABASE & AUTHENTICATION',
      market_data: 'MARKET DATA',
      sentiment: 'SENTIMENT ANALYSIS',
      payments: 'PAYMENTS',
      trading: 'TRADING INTEGRATION',
      community: 'COMMUNITY INTEGRATIONS',
      marketing: 'EMAIL MARKETING',
      feature_flags: 'FEATURE FLAGS',
      general: 'GENERAL SETTINGS'
    }

    Object.entries(grouped).forEach(([category, configs]) => {
      lines.push('')
      lines.push('# =============================================================================')
      lines.push(`# ${categoryTitles[category] || category.toUpperCase()}`)
      lines.push('# =============================================================================')

      configs.forEach(config => {
        if (config.description) {
          lines.push(`# ${config.description}`)
        }
        lines.push(`${config.key}=${config.value || ''}`)
      })
    })

    return lines.join('\n')
  }

  static async getAuditLog(configId?: string, limit: number = 50): Promise<ConfigAuditLog[]> {
    let query = supabase
      .from('config_audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit)

    if (configId) {
      query = query.eq('config_id', configId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit log:', error)
      throw error
    }

    return data || []
  }

  static async getConfigurationStatus(): Promise<{
    total: number
    configured: number
    missing: number
    criticalMissing: string[]
    highPriorityMissing: string[]
  }> {
    const summary = await this.getConfigSummary()

    const configured = summary.filter(c => c.is_configured).length
    const missing = summary.filter(c => !c.is_configured).length
    const criticalMissing = summary
      .filter(c => c.priority === 'critical' && !c.is_configured)
      .map(c => c.key)
    const highPriorityMissing = summary
      .filter(c => c.priority === 'high' && !c.is_configured)
      .map(c => c.key)

    return {
      total: summary.length,
      configured,
      missing,
      criticalMissing,
      highPriorityMissing
    }
  }

  static getLocalEnvValue(key: string): string | undefined {
    return import.meta.env[key]
  }

  static async syncFromLocalEnv(): Promise<{
    synced: number
    errors: string[]
  }> {
    const configs = await this.getAllConfigs()
    let synced = 0
    const errors: string[] = []

    for (const config of configs) {
      const localValue = this.getLocalEnvValue(config.key)

      if (localValue && (!config.value || config.value !== localValue)) {
        try {
          await this.setConfigValue(config.key, localValue)
          synced++
        } catch (error) {
          errors.push(`${config.key}: ${error}`)
        }
      }
    }

    return { synced, errors }
  }

  static async validateConfiguration(): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const configs = await this.getAllConfigs()
    const errors: string[] = []
    const warnings: string[] = []

    const requiredConfigs = configs.filter(c => c.is_required)

    for (const config of requiredConfigs) {
      if (!config.value || config.value.trim() === '') {
        if (config.priority === 'critical') {
          errors.push(`CRITICAL: ${config.key} is required but not configured`)
        } else {
          warnings.push(`${config.key} is marked as required but not configured`)
        }
      }
    }

    const criticalConfigs = configs.filter(c => c.priority === 'critical')
    for (const config of criticalConfigs) {
      if (!config.value || config.value.trim() === '') {
        if (!errors.includes(`CRITICAL: ${config.key} is required but not configured`)) {
          errors.push(`CRITICAL: ${config.key} must be configured`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}
