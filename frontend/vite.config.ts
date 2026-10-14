import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = { ...loadEnv(mode, '.', ''), ...process.env };

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Permite abrir el servidor de desarrollo por un tunel https (pruebas de Mercado Pago).
        allowedHosts: ['.trycloudflare.com'],
        // En Docker sobre Windows los cambios en archivos montados no generan eventos.
        watch: env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
        // En desarrollo /api se reenvia al backend Laravel (mismo origen, sin CORS).
        proxy: {
          '/api': {
            target: env.VITE_PROXY_TARGET || 'http://localhost:8000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) {
                return;
              }

              if (id.includes('react-router')) {
                return 'router-vendor';
              }

              if (id.includes('react') || id.includes('scheduler')) {
                return 'react-vendor';
              }

              if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
                return 'firebase-auth-vendor';
              }

              if (id.includes('firebase')) {
                return 'firebase-core-vendor';
              }

              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }

              return 'vendor';
            }
          }
        }
      }
    };
});
