import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Keep one authoritative format guide in the repository and publish it at /llms.txt.
const formatGuide = () => readFileSync(new URL('./llms.txt', import.meta.url), 'utf8');

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    {
      name: 'qingjian-format-guide',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0];
          if (path !== '/llms.txt' && path !== `${server.config.base}llms.txt`) return next();
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(formatGuide());
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'llms.txt', source: formatGuide() });
      },
    },
  ],
});
