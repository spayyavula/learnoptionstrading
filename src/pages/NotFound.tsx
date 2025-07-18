import React from 'react'

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
    <p className="text-lg text-gray-700 mb-2">Page Not Found</p>
    <p className="text-gray-500">The page you are looking for does not exist.</p>
  </div>
)

export default NotFound