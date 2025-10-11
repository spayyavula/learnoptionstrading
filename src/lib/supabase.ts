import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isValidUrl = supabaseUrl &&
                   supabaseUrl !== 'https://demo.supabase.co' &&
                   supabaseUrl.includes('supabase.co')

const isValidKey = supabaseAnonKey &&
                   supabaseAnonKey !== 'demo-key' &&
                   supabaseAnonKey.length > 50

const isValidConfig = isValidUrl && isValidKey

if (!isValidConfig) {
  console.warn('⚠️ Supabase configuration missing or invalid.')
  console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'Set but invalid' : 'Missing')
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set but invalid' : 'Missing')
}

const finalUrl = isValidUrl ? supabaseUrl : 'https://demo.supabase.co'
const finalKey = isValidKey ? supabaseAnonKey : 'demo-key'

export const supabase = createClient(finalUrl, finalKey)

// Auth service wrapper
export const auth = {
  async signIn(email: string, password: string) {
    if (!isValidConfig) {
      throw new Error('Authentication service is not configured. This appears to be a demo environment where you can explore the platform features without signing in.')
    }
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signUp(email: string, password: string, metadata?: { full_name?: string }) {
    if (!isValidConfig) {
      throw new Error('Authentication service is not configured. This appears to be a demo environment where you can explore the platform features without signing in.')
    }
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    })
  },

  async resetPasswordForEmail(email: string, options: any) {
    if (!isValidConfig) {
      throw new Error('Password reset is not available. Authentication service is not configured.')
    }
    return await supabase.auth.resetPasswordForEmail(email, options)
  },

  async signOut() {
    if (!isValidConfig) {
      throw new Error('Sign out is not available. Authentication service is not configured.')
    }
    return await supabase.auth.signOut()
  },

  async getUser() {
    if (!isValidConfig) {
      return { data: { user: null }, error: null }
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