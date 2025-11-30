import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  AzureUser,
  signIn as azureSignIn,
  signUp as azureSignUp,
  signOut as azureSignOut,
  resetPassword as azureResetPassword,
  onAuthStateChange,
  isValidConfig,
  initializeMsal,
} from '../lib/azure-auth'

// User type that matches our app's expectations
export type User = AzureUser | null

export type AuthContextType = {
  user: User
  signIn: (email?: string, password?: string) => Promise<{ error: Error | null }>
  signUp: (email?: string, password?: string, metadata?: { full_name?: string }) => Promise<{ error: Error | null }>
  resetPassword: (email?: string) => Promise<{ error: Error | null }>
  loading: boolean
  signOut: () => Promise<{ error: Error | null }>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing Azure AD B2C auth...')

    // Initialize MSAL and listen for auth changes
    const unsubscribe = onAuthStateChange((azureUser) => {
      console.log('🔐 AuthProvider: Auth state changed:', azureUser ? 'User logged in' : 'No user')
      setUser(azureUser)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (_email?: string, _password?: string): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider: Attempting sign in via Azure B2C...')

      // Clear any demo mode remnants
      localStorage.removeItem('demo_mode')
      localStorage.removeItem('demo_user')

      if (!isValidConfig) {
        throw new Error('Azure AD B2C is not configured. Please check your environment settings.')
      }

      // Azure B2C handles the actual login form via popup/redirect
      const { user: azureUser, error } = await azureSignIn()

      if (error) {
        console.error('🔐 AuthProvider: Sign in error:', error)
        return { error }
      }

      if (azureUser) {
        console.log('🔐 AuthProvider: Sign in successful')
        setUser(azureUser)
      }

      return { error: null }
    } catch (error) {
      console.error('🔐 AuthProvider: Sign in exception:', error)
      return {
        error: error instanceof Error
          ? error
          : new Error('Authentication service is temporarily unavailable. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (_email?: string, _password?: string, _metadata?: { full_name?: string }): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider: Attempting sign up via Azure B2C...')

      if (!isValidConfig) {
        throw new Error('Azure AD B2C is not configured. Please check your environment settings.')
      }

      // Azure B2C handles sign-up through the same policy (signupsignin)
      const { user: azureUser, error } = await azureSignUp()

      if (error) {
        console.error('🔐 AuthProvider: Sign up error:', error)
        return { error }
      }

      if (azureUser) {
        console.log('🔐 AuthProvider: Sign up successful')
        setUser(azureUser)
      }

      return { error: null }
    } catch (error) {
      console.error('🔐 AuthProvider: Sign up exception:', error)
      return {
        error: error instanceof Error
          ? error
          : new Error('Authentication service is temporarily unavailable. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (_email?: string): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      console.log('🔐 AuthProvider: Attempting password reset via Azure B2C...')

      if (!isValidConfig) {
        throw new Error('Azure AD B2C is not configured. Password reset is not available.')
      }

      const { error } = await azureResetPassword()

      if (error) {
        console.error('🔐 AuthProvider: Password reset error:', error)
        return { error }
      }

      console.log('🔐 AuthProvider: Password reset initiated')
      return { error: null }
    } catch (error) {
      console.error('🔐 AuthProvider: Password reset exception:', error)
      return { error: error instanceof Error ? error : new Error('Password reset failed') }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    setLoading(true)
    try {
      const { error } = await azureSignOut()
      setUser(null)
      return { error: error ?? null }
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
    isConfigured: isValidConfig,
  }

  // Debugging useEffect inside AuthProvider
  useEffect(() => {
    console.log('🔐 AuthProvider state:', { user: user ? 'Logged in' : 'Not logged in', loading, isConfigured: isValidConfig })
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
