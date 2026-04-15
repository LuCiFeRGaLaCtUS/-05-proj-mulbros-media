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
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${OPENAI_KEY}`);
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
