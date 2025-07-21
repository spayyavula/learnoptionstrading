import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth } from '../lib/supabase.ts'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...')
        const { data: { user } } = await auth.getUser()
        setAuthError(null)
        console.log('🔐 Initial user:', user ? 'Found' : 'None')
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
        setAuthError(error instanceof Error ? error.message : 'Authentication service unavailable')
      }
    }

    getInitialSession()

    // Listen for auth changes
    const authListener = auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session')
      setAuthError(null)
      setSession(session)
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
    setAuthError(null)
    try {
      console.log('🔐 AuthProvider signIn attempt for:', email)
      const result = await auth.signIn(email, password)
      console.log('🔐 SignIn result:', result.error ? 'Error' : 'Success')
      if (result.error) {
        console.error('🔐 SignIn error:', result.error)
        setAuthError(result.error.message)
      } else if (result.data?.user) {
        console.log('🔐 SignIn successful, setting user')
        setUser(result.data.user)
        setSession(result.data.session || null)
      }
      return result
    } catch (error) {
      console.error('🔐 SignIn exception:', error)
      setAuthError('Authentication service unavailable')
      throw error
    } finally {
      setLoading(false)
  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      console.log('🔐 AuthProvider: Attempting password reset for:', email)
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('🔐 AuthProvider: Password reset error:', error)
        return { error }
      }
      
      console.log('🔐 AuthProvider: Password reset email sent')
      return { success: true }
    } catch (err) {
      console.error('🔐 AuthProvider: Password reset exception:', err)
      return { error: err as Error }
    } finally {
      setLoading(false)
    }
  }

    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    setAuthError(null)
    try {
      console.log('🔐 AuthProvider signUp attempt for:', email)
      const result = await auth.signUp(email, password)
      console.log('🔐 SignUp result:', result.error ? 'Error' : 'Success')
      if (result.error) {
        console.error('🔐 SignUp error:', result.error)
        setAuthError(result.error.message)
      } else if (result.data?.user) {
        console.log('🔐 SignUp successful, setting user')
        setUser(result.data.user)
        setSession(result.data.session || null)
      }
      return result
    } catch (error) {
      console.error('🔐 SignUp exception:', error)
      setAuthError('Authentication service unavailable')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setAuthError(null)
    try {
      console.log('🔐 AuthProvider signOut')
      await auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('🔐 SignOut error:', error)
      setAuthError('Sign out failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    resetPassword,
    resetPassword,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}