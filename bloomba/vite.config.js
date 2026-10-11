import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative paths so the built game works from any folder, e.g. GitHub Pages
  // at /zingos-/ as well as the root of a local server.
  base: './',
});
