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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'utils': ['axios', 'date-fns', 'jstat']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
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
    chunkSizeWarningLimit: 1000
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