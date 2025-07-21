import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

// Validate configuration
const isValidConfig = supabaseUrl !== 'https://demo.supabase.co' && 
                     supabaseAnonKey !== 'demo-key' &&
                     supabaseUrl.includes('supabase.co') &&
                     supabaseAnonKey.length > 50

if (!isValidConfig) {
  console.warn('⚠️ Supabase configuration missing or using demo values. Using local storage fallback.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth service wrapper
export const auth = {
  async signIn(email: string, password: string) {
    if (!isValidConfig) {
      throw new Error('Authentication service not available. Supabase configuration is missing or invalid.')
    }
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signUp(email: string, password: string) {
    if (!isValidConfig) {
      throw new Error('Authentication service not available. Supabase configuration is missing or invalid.')
    }
    return await supabase.auth.signUp({ email, password })
  },

  async signOut() {
    if (!isValidConfig) {
      throw new Error('Authentication service not available. Supabase configuration is missing or invalid.')
    }
    return await supabase.auth.signOut()
  },

  async getUser() {
    if (!isValidConfig) {
      throw new Error('Authentication service not available. Supabase configuration is missing or invalid.')
    }
    return await supabase.auth.getUser()
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isValidConfig) {
      console.warn('Auth state change listener not available without valid Supabase configuration')
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

export { isValidConfig }