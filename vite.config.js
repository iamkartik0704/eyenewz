import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/web-api': {
        target: 'https://eyenewz.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
