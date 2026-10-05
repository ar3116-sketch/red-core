import { defineConfig } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
// Dev only: POST /__shot?name=x with a PNG data URL saves docs/shots/x.png (used for the screenshot gallery).
const shots = {
  name: 'red-core-shots',
  configureServer(server) {
    server.middlewares.use('/__shot', (req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const name = new URL(req.url, 'http://x').searchParams.get('name')?.replace(/[^a-z0-9-]/gi, '') || 'shot';
        mkdirSync('docs/shots', { recursive: true });
        writeFileSync(`docs/shots/${name}.png`, Buffer.from(body.split(',')[1], 'base64'));
        res.end('ok');
      });
    });
  },
};
export default defineConfig({
  root: '.',
  plugins: [shots],
  server: { port: 5173 },
  build: { outDir: 'dist', target: 'esnext', rollupOptions: { input: { game: 'index.html', evolution: 'evolution.html' } } }
});
