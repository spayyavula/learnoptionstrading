import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  root: process.cwd(),
  envDir: process.cwd(),
  plugins: [react()],
  base: '/',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    'import.meta.env.VITE_POLYGON_API_KEY': JSON.stringify(env.VITE_POLYGON_API_KEY),
    'import.meta.env.VITE_ENABLE_REAL_TIME_DATA': JSON.stringify(env.VITE_ENABLE_REAL_TIME_DATA),
    'import.meta.env.VITE_ENABLE_MOCK_DATA': JSON.stringify(env.VITE_ENABLE_MOCK_DATA),
    'import.meta.env.VITE_ENABLE_DATA_PERSISTENCE': JSON.stringify(env.VITE_ENABLE_DATA_PERSISTENCE),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('recharts')) {
              return 'chart-vendor'
            }
            if (id.includes('axios') || id.includes('date-fns') || id.includes('jstat')) {
              return 'utils'
            }
            if (id.includes('@stripe') || id.includes('@supabase')) {
              return 'external-services'
            }
            return 'vendor'
          }
          if (id.includes('src/pages/')) {
            const pageName = id.match(/\/pages\/([^/]+)\.tsx?/)?.[1]
            if (pageName && ['Analytics', 'OptionsPortfolio', 'SentimentAnalysis'].includes(pageName)) {
              return `page-${pageName.toLowerCase()}`
            }
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        experimentalMinChunkSize: 10000
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020'
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  envPrefix: 'VITE_',
  css: {
    devSourcemap: true
  }
  }
})