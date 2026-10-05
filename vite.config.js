import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  server: { port: 5173 },
  build: { outDir: 'dist', target: 'esnext', rollupOptions: { input: { game: 'index.html', evolution: 'evolution.html' } } }
});
