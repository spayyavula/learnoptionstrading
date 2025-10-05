// Create src/cache-buster.ts
export const BUILD_TIMESTAMP = Date.now()
export const BUILD_VERSION = `v${BUILD_TIMESTAMP}`

console.log('🔧 Force Cache Bust:', BUILD_VERSION)

// This comment will change on every build to force re-compilation
// Build ID: ${BUILD_TIMESTAMP}