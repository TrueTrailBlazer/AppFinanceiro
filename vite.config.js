import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/react-pluggy-connect/')) {
            return 'vendor-pluggy';
          }
          if (id.includes('node_modules/papaparse/')) {
            return 'vendor-papaparse';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-lucide';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
  },
});
