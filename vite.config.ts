import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Ensure Netlify can handle the build output
    sourcemap: true,
    // Improve build performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for now
        drop_debugger: true
      }
    }
  },
  // Optimize dev experience
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  // Ensure environment variables are properly handled
  envPrefix: 'VITE_',
  // Improve CSS handling
  css: {
    devSourcemap: true
  }
})