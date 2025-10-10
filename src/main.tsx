import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { runDiagnostic, simpleDiagnostic } from './utils/diagnosticTool'
import { validateEnvironment, logEnvironmentDiagnostics } from './utils/envValidator'

console.log('🚀 Application Starting...')
console.log('=' .repeat(50))

logEnvironmentDiagnostics()

const envValidation = validateEnvironment()

if (!envValidation.isValid) {
  console.error('=' .repeat(50))
  console.error('⚠️ ENVIRONMENT VALIDATION FAILED')
  console.error('=' .repeat(50))
  console.error('Missing variables:', envValidation.missing)
  console.error('Invalid variables:', envValidation.invalid)
  console.error('Errors:', envValidation.errors)
  console.error('=' .repeat(50))
  console.error('Please check your .env file and restart the dev server')
  console.error('=' .repeat(50))
}

console.log('🔧 Running startup diagnostics...')
const diagnosticResult = runDiagnostic()
console.log('🔍 Diagnostic Result:', diagnosticResult)
console.log('🔍 Simple Diagnostic:', simpleDiagnostic())

console.log('🔐 Authentication Configuration Check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

if (!envValidation.isValid && import.meta.env.PROD) {
  console.warn('⚠️ Running in production mode with missing environment variables')
  console.warn('⚠️ Some features may not work correctly')
  console.warn('⚠️ Please ensure environment variables are set in Netlify dashboard')
}

console.log('=' .repeat(50))
console.log('✅ Startup Complete')
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)