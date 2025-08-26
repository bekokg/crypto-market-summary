import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Dev proxy to bypass CORS during local development
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://user26614.requestly.tech',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/test/api'),
      },
    },
  },
})
