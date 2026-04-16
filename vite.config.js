import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const OPENAI_KEY = env.OPENAI_API_KEY || '';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api/ai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: () => '/v1/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Prefer env key; fall back to key sent by the client (from localStorage via Settings)
              const authKey = OPENAI_KEY || (req.headers['authorization']?.replace('Bearer ', '') || '');
              if (authKey) {
                proxyReq.setHeader('Authorization', `Bearer ${authKey}`);
              }
              proxyReq.setHeader('Content-Type', 'application/json');
            });
          },
        }
      }
    },
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
