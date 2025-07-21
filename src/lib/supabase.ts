import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('🔧 Supabase Configuration Check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlValid: supabaseUrl.startsWith('https://'),
  keyValid: supabaseAnonKey.length > 20,
  actualUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set',
  keyLength: supabaseAnonKey.length
})

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.startsWith('eyJ') && // JWT tokens start with eyJ
  supabaseAnonKey.length > 100 // Real JWT tokens are much longer

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase configuration missing or invalid:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    isConfigured: isSupabaseConfigured
  })
  console.log('🔧 Using local storage fallback for authentication')
} else {
  console.log('✅ Supabase configuration valid')
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Local storage fallback for authentication when Supabase is not available
const localAuth = {
  users: JSON.parse(localStorage.getItem('local_users') || '[]'),
  currentUser: JSON.parse(localStorage.getItem('current_user') || 'null'),
  
  saveUsers() {
    localStorage.setItem('local_users', JSON.stringify(this.users))
  },
  
  saveCurrentUser(user: any) {
    this.currentUser = user
    localStorage.setItem('current_user', JSON.stringify(user))
  },
  
  clearCurrentUser() {
    this.currentUser = null
    localStorage.removeItem('current_user')
  }
}
// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      console.log('🔧 Using local storage fallback for signUp')
      
      // Check if user already exists
      const existingUser = localAuth.users.find((u: any) => u.email === email)
      if (existingUser) {
        return { 
          data: { user: null }, 
          error: { message: 'User already registered' } 
        }
      }
      
      // Create new user
      const newUser = {
        id: `local_${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString()
      }
      
      localAuth.users.push({ ...newUser, password })
      localAuth.saveUsers()
      localAuth.saveCurrentUser(newUser)
      
      return { 
        data: { user: newUser }, 
        error: null 
      }
    }
    console.log('🔐 Attempting sign up for:', email)
    return await supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    if (!supabase) {
      console.log('🔧 Using local storage fallback for signIn')
      
      const user = localAuth.users.find((u: any) => u.email === email && u.password === password)
      if (!user) {
        return { 
          data: { user: null }, 
          error: { message: 'Invalid login credentials' } 
        }
      }
      
      const userWithoutPassword = { ...user }
      delete userWithoutPassword.password
      
      localAuth.saveCurrentUser(userWithoutPassword)
      
      return { 
        data: { user: userWithoutPassword }, 
        error: null 
      }
    }
    console.log('🔐 Attempting sign in for:', email)
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    if (!supabase) {
      console.log('🔧 Using local storage fallback for signOut')
      localAuth.clearCurrentUser()
      return { error: null }
    }
    console.log('🔐 Signing out')
    return await supabase.auth.signOut()
  },
  
  getUser: async () => {
    if (!supabase) {
      console.log('🔧 Using local storage fallback for getUser')
      return { data: { user: localAuth.currentUser }, error: null }
    }
    return await supabase.auth.getUser()
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      console.log('🔧 Using local storage fallback for onAuthStateChange')
      
      // Simulate auth state change for local storage
      setTimeout(() => {
        const user = localAuth.currentUser
        const session = user ? { user, access_token: 'local_token' } : null
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      }, 100)
      
      return { 
        data: { 
          subscription: {
            unsubscribe: () => console.log('🔧 Local auth listener unsubscribed')
          }
        } 
      }
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