import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User as AuthUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  fetchCurrentUser,
  isAuthenticated,
  onAuthStateChange,
  notifyAuthChange,
} from '../lib/auth'

// User type that matches our app's expectations
export type User = AuthUser | null

export type AuthContextType = {
  user: User
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  loading: boolean
  signOut: () => Promise<{ error: Error | null }>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider: Initializing JWT auth...')

    // Check for existing session
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          // Fetch fresh user data from API
          const freshUser = await fetchCurrentUser()
          if (freshUser) {
            setUser(freshUser)
          } else {
            // Token invalid, clear storage
            authLogout()
            setUser(null)
          }
        } else {
          // Try to get cached user
          const cachedUser = getCurrentUser()
          if (cachedUser) {
            setUser(cachedUser)
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      // Clear any demo mode remnants
      localStorage.removeItem('demo_mode')
      localStorage.removeItem('demo_user')

      const { user: authUser, error } = await authLogin(email, password)

      if (error) {
        return { error: new Error(error) }
      }

      if (authUser) {
        setUser(authUser)
        notifyAuthChange()
      }

      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        error: error instanceof Error
          ? error
          : new Error('Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      const { user: authUser, error } = await authRegister(
        email,
        password,
        metadata?.full_name
      )

      if (error) {
        return { error: new Error(error) }
      }

      if (authUser) {
        setUser(authUser)
        notifyAuthChange()
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        error: error instanceof Error
          ? error
          : new Error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (_email: string): Promise<{ error: Error | null }> => {
    // Password reset would require a backend endpoint
    // For now, return an informative error
    return {
      error: new Error('Password reset is not yet implemented. Please contact support.')
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      authLogout()
      setUser(null)
      notifyAuthChange()
      return { error: null }
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
    signOut,
    isConfigured: true, // JWT auth is always configured
  }

  useEffect(() => {
    console.log('AuthProvider state:', { user: user ? 'Logged in' : 'Not logged in', loading })
  }, [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
