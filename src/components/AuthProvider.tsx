import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth } from '../lib/supabase.ts'

export type AuthContextType = {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  loading: boolean
  signOut: () => Promise<{ error: Error | null }> // <-- Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check for demo mode first
    const demoMode = localStorage.getItem('demo_mode')
    const demoUser = localStorage.getItem('demo_user')
    
    if (demoMode === 'true' && demoUser) {
      try {
        const parsedDemoUser = JSON.parse(demoUser)
        console.log('🔐 Demo mode detected, setting demo user')
        setUser(parsedDemoUser)
        setLoading(false)
        return
      } catch (error) {
        console.error('Error parsing demo user:', error)
        localStorage.removeItem('demo_mode')
        localStorage.removeItem('demo_user')
      }
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...')
        const { data: { user } } = await auth.getUser()
        console.log('🔐 Initial user:', user ? 'Found' : 'None')
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const authListener = auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider signIn attempt for:', email)
      
      // Check if Supabase is properly configured
      const { isValidConfig } = await import('../lib/supabase')
      if (!isValidConfig) {
        throw new Error('Authentication service is not configured. Please check your Supabase settings.')
      }
      
      const result = await auth.signIn(email, password)
      console.log('🔐 SignIn result:', result.error ? 'Error' : 'Success')
      if (result.error) {
        console.error('🔐 SignIn error:', result.error)
        return { error: result.error }
      } else if (result.data?.user) {
        console.log('🔐 SignIn successful, setting user')
        setUser(result.data.user)
      }
      return { error: null }
    } catch (error) {
      console.error('🔐 SignIn exception:', error)
      return { error: error instanceof Error ? error : new Error('Authentication service is temporarily unavailable. Please try again later.') }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider signUp attempt for:', email)
      
      // Check if Supabase is properly configured
      const { isValidConfig } = await import('../lib/supabase')
      if (!isValidConfig) {
        throw new Error('Authentication service is not configured. Please check your Supabase settings.')
      }
      
      const result = await auth.signUp(email, password)
      console.log('🔐 SignUp result:', result.error ? 'Error' : 'Success')
      if (result.error) {
        console.error('🔐 SignUp error:', result.error)
        return { error: result.error }
      } else if (result.data?.user) {
        console.log('🔐 SignUp successful, setting user')
        setUser(result.data.user)
      }
      return { error: null }
    } catch (error) {
      console.error('🔐 SignUp exception:', error)
      return { error: error instanceof Error ? error : new Error('Authentication service is temporarily unavailable. Please try again later.') }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider: Attempting password reset for:', email)
      
      // Check if Supabase is properly configured
      const { isValidConfig } = await import('../lib/supabase')
      if (!isValidConfig) {
        throw new Error('Authentication service is not configured. Password reset is not available in demo mode.')
      }
      
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('🔐 AuthProvider: Password reset error:', error)
        return { error }
      }
      
      console.log('🔐 AuthProvider: Password reset email sent')
      return { error: null }
    } catch (err) {
      console.error('🔐 AuthProvider: Password reset exception:', err)
      return { error: err as Error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      const demoMode = localStorage.getItem('demo_mode')
      if (demoMode === 'true') {
        localStorage.removeItem('demo_mode')
        localStorage.removeItem('demo_user')
        setUser(null)
        return { error: null }
      } else {
        const { error } = await auth.signOut()
        setUser(null)
        return { error: error ?? null }
      }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign out failed') }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    signIn,
    signUp,
    resetPassword,
    loading,
    signOut // <-- Add this line
  }

  // Debugging useEffect inside AuthProvider
  useEffect(() => {
    const demoMode = localStorage.getItem('demo_mode')
    console.log('AuthProvider: user', user)
    console.log('AuthProvider: loading', loading)
    console.log('AuthProvider: demoMode', demoMode)
  }, [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Add this hook to export useAuth
export function useAuth() {
  return useContext(AuthContext)
}