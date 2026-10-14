import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_URL || 'http://localhost:3001';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': { target, changeOrigin: true },
        '/accounts': { target, changeOrigin: true },
        '/transfers': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
        '/docs': { target, changeOrigin: true },
      },
    },
  };
});
