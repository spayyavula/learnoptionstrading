import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    console.log('ProtectedRoute: user', user)
    console.log('ProtectedRoute: loading', loading)
    console.log('ProtectedRoute: location', location.pathname)
  }, [user, loading, location])

  const demoMode = localStorage.getItem('demo_mode') === 'true'

  if (loading) return <div>Loading...</div>
  if (!user && !demoMode) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}