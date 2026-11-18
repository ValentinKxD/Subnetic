import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  // Попередньо збираємо важкі залежності, щоб Vite не переоптимізовував їх посеред сесії
  // (інакше на першому відкритті сторінки можливі дві копії React → «Invalid hook call»).
  optimizeDeps: {
    include: ['recharts', 'react-day-picker', 'react-day-picker/locale', 'zod'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
