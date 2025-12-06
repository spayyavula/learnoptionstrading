import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

console.log('🚀 Application Starting...')
console.log('Environment:', import.meta.env.MODE)
console.log('API URL:', import.meta.env.VITE_API_BASE_URL || '/api')
console.log('✅ Startup Complete')
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
