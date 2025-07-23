import './index.css'
import './cache-buster'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './setupMockApi'
import { runDiagnostic, simpleDiagnostic } from './utils/diagnosticTool'

// Run diagnostic on startup
console.log('🔧 Running startup diagnostics...')
const diagnosticResult = runDiagnostic()
console.log('🔍 Diagnostic Result:', diagnosticResult)
console.log('🔍 Simple Diagnostic:', simpleDiagnostic())

// Check authentication configuration
console.log('🔐 Authentication Configuration Check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)