import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth } from '../lib/supabase'

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

  useEffect(() => {
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
    try {
      console.log('🔐 AuthProvider signIn attempt for:', email)
      const result = await auth.signIn(email, password)
      console.log('🔐 SignIn result:', result.error ? 'Error' : 'Success')
        console.error('🔐 SignIn error:', result.error)
        setAuthError(result.error.message)
      }
      return result
    } catch (error) {
      console.error('🔐 SignIn exception:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    setAuthError(null)
    setUser(null)
    setSession(null)
    try {
      console.log('🔐 AuthProvider signUp attempt for:', email)
      const result = await auth.signUp(email, password)
      console.log('🔐 SignUp result:', result.error ? 'Error' : 'Success')
      if (result.error) {
        console.error('🔐 SignUp error:', result.error)
        setAuthError(result.error.message)
      }
      return result
    } catch (error) {
      console.error('🔐 SignUp exception:', error)
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
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    authError,
    signIn,
    signUp,
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