import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('🔧 Supabase Configuration Check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlValid: supabaseUrl.startsWith('https://'),
  keyValid: supabaseAnonKey.length > 20
})
// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://demo.supabase.co' &&
  supabaseAnonKey !== 'demo_anon_key'

if (!isSupabaseConfigured) {
  console.error('❌ Supabase configuration missing or invalid:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    isConfigured: isSupabaseConfigured
  })
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      console.error('❌ Supabase not configured for signUp')
      throw new Error('Authentication service not available. Please check configuration.')
    }
    console.log('🔐 Attempting sign up for:', email)
    return await supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    if (!supabase) {
      console.error('❌ Supabase not configured for signIn')
      throw new Error('Authentication service not available. Please check configuration.')
    }
    console.log('🔐 Attempting sign in for:', email)
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    if (!supabase) {
      console.error('❌ Supabase not configured for signOut')
      throw new Error('Authentication service not available. Please check configuration.')
    }
    console.log('🔐 Signing out')
    return await supabase.auth.signOut()
  },
  
  getUser: async () => {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured for getUser')
      return { data: { user: null }, error: null }
    }
    return await supabase.auth.getUser()
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured for onAuthStateChange')
      return { data: { subscription: null } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}
export type Database = {
  public: {
    Tables: {
      historical_data: {
        Row: {
          id: string
          ticker: string
          date: string
          open: number
          high: number
          low: number
          close: number
          volume: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticker: string
          date: string
          open: number
          high: number
          low: number
          close: number
          volume: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticker?: string
          date?: string
          open?: number
          high?: number
          low?: number
          close?: number
          volume?: number
          created_at?: string
          updated_at?: string
        }
      }
      options_historical_data: {
        Row: {
          id: string
          contract_ticker: string
          underlying_ticker: string
          date: string
          bid: number
          ask: number
          last: number
          volume: number
          open_interest: number
          implied_volatility: number
          delta: number
          gamma: number
          theta: number
          vega: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_ticker: string
          underlying_ticker: string
          date: string
          bid: number
          ask: number
          last: number
          volume: number
          open_interest: number
          implied_volatility: number
          delta: number
          gamma: number
          theta: number
          vega: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_ticker?: string
          underlying_ticker?: string
          date?: string
          bid?: number
          ask?: number
          last?: number
          volume?: number
          open_interest?: number
          implied_volatility?: number
          delta?: number
          gamma?: number
          theta?: number
          vega?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_portfolios: {
        Row: {
          id: string
          user_id: string
          balance: number
          buying_power: number
          total_value: number
          day_change: number
          day_change_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance: number
          buying_power: number
          total_value: number
          day_change?: number
          day_change_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          buying_power?: number
          total_value?: number
          day_change?: number
          day_change_percent?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    subscriptions: {
      Row: {
        id: string
        customer_id: string
        user_id: string
        status: string
        price_id: string
        quantity: number
        cancel_at_period_end: boolean
        cancel_at: string | null
        canceled_at: string | null
        current_period_start: string
        current_period_end: string | null
        created: string
        ended_at: string | null
        trial_start: string | null
        trial_end: string | null
        metadata: any
        terms_accepted: boolean
        terms_accepted_at: string | null
      }
      Insert: {
        id: string
        customer_id: string
        user_id: string
        status: string
        price_id?: string
        quantity?: number
        cancel_at_period_end?: boolean
        cancel_at?: string | null
        canceled_at?: string | null
        current_period_start: string
        current_period_end?: string | null
        created?: string
        ended_at?: string | null
        trial_start?: string | null
        trial_end?: string | null
        metadata?: any
        terms_accepted?: boolean
        terms_accepted_at?: string | null
      }
      Update: {
        id?: string
        customer_id?: string
        user_id?: string
        status?: string
        price_id?: string
        quantity?: number
        cancel_at_period_end?: boolean
        cancel_at?: string | null
        canceled_at?: string | null
        current_period_start?: string
        current_period_end?: string | null
        created?: string
        ended_at?: string | null
        trial_start?: string | null
        trial_end?: string | null
        metadata?: any
        terms_accepted?: boolean
        terms_accepted_at?: string | null
      }
    }
  }
}