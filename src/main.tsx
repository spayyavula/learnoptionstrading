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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)