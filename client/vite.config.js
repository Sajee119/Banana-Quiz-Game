import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // React, Framer Motion and the icon set make up most of the main bundle.
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 5173,
      proxy: {
        '/auth': { target: serverUrl, changeOrigin: true },
        '/api': { target: serverUrl, changeOrigin: true },
      },
    },
  };
});