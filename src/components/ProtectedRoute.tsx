import React, { useEffect, useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
// import Dashboard from './Dashboard' // Import the Dashboard component

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fetchSession = async () => {
      const sessionResponse = await supabase.auth.getSession()
      setIsAuthenticated(!!sessionResponse.data.session?.user)
      setLoading(false)
    }
    fetchSession()
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Show demo access option instead of forcing login
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
            <p className="text-gray-600 mb-6">
              To access the full trading platform, you can either sign in to your account or explore in demo mode.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/login"
              state={{ from: location }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors block"
            >
              Sign In / Sign Up
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                // Set demo mode flag
                localStorage.setItem('demo_mode', 'true')
                // Create a mock user session for demo
                localStorage.setItem('demo_user', JSON.stringify({
                  id: 'demo-user',
                  email: 'demo@example.com',
                  user_metadata: { full_name: 'Demo User' }
                }))
                // Reload to trigger auth state change
                window.location.reload()
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors border border-gray-300"
            >
              🚀 Try Demo Mode
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Demo mode lets you explore all features with sample data. No registration required!
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// In your routing file
// Example usage:
// <Route
//   path="dashboard"
//   element={
//     <ProtectedRoute>
//       {/* <Dashboard /> */}
//     </ProtectedRoute>
//   }
// />