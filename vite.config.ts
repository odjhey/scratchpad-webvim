import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      // so you can call /api/* during dev without Docker
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
