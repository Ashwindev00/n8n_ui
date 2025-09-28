import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Your n8n webhook/agent endpoint
const N8N_URL = 'https://ashwindev.app.n8n.cloud/webhook-test/harbourcare-chat'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/agent': {
        target: N8N_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agent/, ''),
      },
    },
  },
})
