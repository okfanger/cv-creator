import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { siteFiles } from './scripts/site.ts';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    {
      name: 'qingjian-public-docs',
      transformIndexHtml(html) {
        const siteUrl = process.env.VITE_SITE_URL || 'https://okfanger.github.io/cv-creator/';
        return html.replaceAll('__SITE_URL__', siteUrl.endsWith('/') ? siteUrl : siteUrl + '/');
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const query = new URL(req.url || '/', 'http://localhost').searchParams;
          if (query.has('import') || query.has('raw') || query.has('url')) return next();
          const path = req.url?.split('?')[0];
          if (!path) return next();
          const base = server.config.base;
          if (!path.startsWith(base)) return next();
          const file = path.slice(base.length);
          if (
            !/^(?:about\.html|llms\.txt|sitemap\.xml|robots\.txt|docs\/.*\.(?:md|html)|examples\/.*\.(?:md|svg)|assets\/.*\.(?:css|jpg|svg|gif|mp4))$/.test(
              file
            )
          )
            return next();
          const assets = siteFiles(
            fileURLToPath(new URL('.', import.meta.url)),
            base,
            process.env.VITE_SITE_URL || 'https://okfanger.github.io/cv-creator/'
          );
          const source = assets.get(file);
          if (source === undefined) return next();
          const extension = file.split('.').at(-1)!;
          const types: Record<string, string> = {
            html: 'text/html; charset=utf-8',
            css: 'text/css; charset=utf-8',
            md: 'text/plain; charset=utf-8',
            txt: 'text/plain; charset=utf-8',
            xml: 'application/xml',
            svg: 'image/svg+xml',
            jpg: 'image/jpeg',
            gif: 'image/gif',
            mp4: 'video/mp4',
          };
          res.setHeader('Content-Type', types[extension] || 'application/octet-stream');
          res.end(source);
        });
      },
      generateBundle() {
        const base = process.env.VITE_BASE_PATH || '/';
        const url = process.env.VITE_SITE_URL || 'https://okfanger.github.io/cv-creator/';
        for (const [fileName, source] of siteFiles(
          fileURLToPath(new URL('.', import.meta.url)),
          base,
          url.endsWith('/') ? url : url + '/'
        )) {
          this.emitFile({ type: 'asset', fileName, source });
        }
      },
    },
  ],
});
