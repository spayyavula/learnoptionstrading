import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isChunkError: boolean
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      /Loading chunk [\d]+ failed/.test(error.message) ||
      /Failed to fetch dynamically imported module/.test(error.message)

    return {
      hasError: true,
      error,
      isChunkError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChunkErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
    window.location.reload()
  }

  handleClearCacheAndReload = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }
    window.sessionStorage.clear()
    window.localStorage.removeItem('page-has-been-force-refreshed')
    window.location.reload()
  }

  render() {
    if (this.state.hasError && this.state.isChunkError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Update Available
            </h2>

            <p className="text-gray-600 text-center mb-6">
              A new version of the application is available. Please reload the page to continue.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Clear Cache & Reload
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              If the problem persists, try clearing your browser cache manually.
            </p>
          </div>
        </div>
      )
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Something Went Wrong
            </h2>

            <p className="text-gray-600 text-center mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChunkErrorBoundary
