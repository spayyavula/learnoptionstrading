import { lazy, ComponentType } from 'react'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
}

const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): React.LazyExoticComponent<T> => {
  const { maxRetries = 3, retryDelay = 1000 } = options

  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    )

    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        const component = await componentImport()
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'false')
        return component
      } catch (error) {
        lastError = error as Error

        const isChunkLoadError = error instanceof Error && (
          error.name === 'ChunkLoadError' ||
          /Loading chunk [\d]+ failed/.test(error.message) ||
          /Failed to fetch dynamically imported module/.test(error.message)
        )

        if (isChunkLoadError) {
          console.warn(`Chunk load failed (attempt ${i + 1}/${maxRetries}), retrying...`)

          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
            continue
          } else if (!pageHasAlreadyBeenForceRefreshed) {
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
            console.warn('All retries failed, reloading page to get fresh chunks...')
            window.location.reload()
            return new Promise(() => {})
          }
        } else {
          throw error
        }
      }
    }

    console.error('Failed to load component after all retries:', lastError)
    throw lastError
  })
}

export default lazyWithRetry
