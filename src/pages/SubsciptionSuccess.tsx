// src/pages/SubscriptionSuccess.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function SubscriptionSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for subscribing. Your account has been activated.
        </p>
        <Link
          to="/dashboard"
          className="btn btn-primary w-full"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}