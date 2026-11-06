import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base path для GitHub Pages: https://<user>.github.io/<repo>/
// при переносе на собственный домен замените на '/'
export default defineConfig({
  base: process.env.VITE_BASE ?? '/nova-flowers/',
  plugins: [react()],
  build: { target: 'es2019', cssCodeSplit: true },
});
