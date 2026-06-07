import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['react-icons/si'],
  },
  envDir: '../', // Load VITE_* vars from root .env
  server: {
    watch: {
      usePolling: false,
      ignored: ['**/workspaces/**', '**/vite.config.js.timestamp-*', '**/vite.config.js'],
    },
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['monaco-editor'],
        },
      },
    },
  },
})
