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
        // Weather: browser always fetches /api/weather (same-origin).
        // In dev, Vite forwards directly to wttr.in.
        // In production, Express /api/weather handles it server-side.
        '/api/weather': {
          target:       'https://wttr.in',
          changeOrigin: true,
          rewrite:      () => '/Los+Angeles,California?format=j1',
        },
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
      outDir:               'dist',
      sourcemap:            false,
      chunkSizeWarningLimit: 600, // jsPDF is legitimately ~570 kB; suppress the noise
      // ── Manual chunk splitting — keeps the main bundle lean ────────────────
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return; // app code stays in index chunk

            // Heavy but infrequent: PDF generation (jsPDF + html2canvas + DOMPurify)
            if (id.includes('/jspdf/') || id.includes('/html2canvas/') || id.includes('/dompurify/')) {
              return 'vendor-pdf';
            }
            // Charting (Recharts + D3 dependencies)
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
              return 'vendor-charts';
            }
            // Drag and drop
            if (id.includes('/@dnd-kit/')) {
              return 'vendor-dnd';
            }
            // Icons
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            // Date utilities
            if (id.includes('/date-fns/')) {
              return 'vendor-dates';
            }
            // React ecosystem + everything else → single vendor chunk (avoids circular chunks)
            return 'vendor';
          },
        },
      },
    },
  }
})
