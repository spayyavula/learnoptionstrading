import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client for Database Operations
 *
 * Note: Authentication is handled by Azure AD B2C (see azure-auth.ts)
 * This client is used only for database operations (data storage, queries, etc.)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isValidUrl = supabaseUrl &&
                   supabaseUrl !== 'https://demo.supabase.co' &&
                   supabaseUrl.includes('supabase.co')

const isValidKey = supabaseAnonKey &&
                   supabaseAnonKey !== 'demo-key' &&
                   supabaseAnonKey.length > 50

const isValidConfig = isValidUrl && isValidKey

// Only warn in development mode and only once
if (!isValidConfig && import.meta.env.DEV) {
  console.info('ℹ️ Supabase database not configured - using local storage fallback')
}

const finalUrl = isValidUrl ? supabaseUrl : 'https://demo.supabase.co'
const finalKey = isValidKey ? supabaseAnonKey : 'demo-key'

// Create Supabase client for database operations
export const supabase = createClient(finalUrl, finalKey)

// Export config status for services that need to know
export { isValidConfig }

// Legacy auth export - deprecated, use azure-auth.ts instead
export const auth = {
  async signIn(_email: string, _password: string) {
    console.warn('⚠️ supabase.auth.signIn is deprecated. Use azure-auth.ts instead.')
    throw new Error('Authentication has moved to Azure AD B2C. Use the new auth system.')
  },

  async signUp(_email: string, _password: string, _metadata?: { full_name?: string }) {
    console.warn('⚠️ supabase.auth.signUp is deprecated. Use azure-auth.ts instead.')
    throw new Error('Authentication has moved to Azure AD B2C. Use the new auth system.')
  },

  async resetPasswordForEmail(_email: string, _options: any) {
    console.warn('⚠️ supabase.auth.resetPasswordForEmail is deprecated. Use azure-auth.ts instead.')
    throw new Error('Authentication has moved to Azure AD B2C. Use the new auth system.')
  },

  async signOut() {
    console.warn('⚠️ supabase.auth.signOut is deprecated. Use azure-auth.ts instead.')
    throw new Error('Authentication has moved to Azure AD B2C. Use the new auth system.')
  },

  async getUser() {
    console.warn('⚠️ supabase.auth.getUser is deprecated. Use azure-auth.ts instead.')
    return { data: { user: null }, error: null }
  },

  onAuthStateChange(_callback: (event: string, session: any) => void) {
    console.warn('⚠️ supabase.auth.onAuthStateChange is deprecated. Use azure-auth.ts instead.')
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
}
