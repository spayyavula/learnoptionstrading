
import React from 'react'
import { CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const SubscriptionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-12 text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4">All Features Are Free Forever!</h1>
        <p className="text-xl text-gray-700 mb-8">
          Enjoy unlimited access to all educational content, trading tools, and community features—no payment, no subscription, no upgrade required. This platform is 100% free for everyone.
        </p>
        <div className="flex flex-col items-center gap-4">
          <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
          <Link to="/app" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
            Start Learning Free
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage