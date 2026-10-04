import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import MarkdownIt from 'markdown-it';
import { parseResumeFile } from '../src/resumeFile';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
assert.ok(existsSync(resolve(dist, 'about.html')), 'Build first: missing dist/about.html');
const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]
  );
let checked = 0;
const index = readFileSync(resolve(dist, 'index.html'), 'utf8');
const bootScript = index.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert.ok(bootScript, 'Missing application entry script');
const buildBase = new URL(bootScript, 'https://example.invalid').pathname.split('assets/')[0];
const site = new URL('.', index.match(/rel="canonical" href="([^"]+)"/)![1]);
for (const file of walk(dist).filter((file) => file.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical, `Missing canonical: ${file}`);
  assert.ok(!html.includes('__SITE_URL__'), `Unresolved site URL: ${file}`);
  for (const match of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    const link = match[1];
    if (/^(https?:|mailto:|data:|#)/.test(link)) continue;
    const path = decodeURIComponent(link.split(/[?#]/)[0]);
    if (path.startsWith('/'))
      assert.ok(path.startsWith(buildBase), `Link omits deployed base path: ${link}`);
    const target = path.startsWith('/')
      ? resolve(dist, path.slice(buildBase.length))
      : resolve(dirname(file), path);
    assert.ok(target.startsWith(dist + '/') || target === dist, `Link escapes site: ${link}`);
    assert.ok(existsSync(target), `Broken site link ${link} in ${file}`);
    checked++;
  }
}
const markdown = new MarkdownIt();
const docs = [
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'llms.txt',
  ...walk(resolve(root, 'docs')).filter((path) => path.endsWith('.md')),
];
for (const name of docs) {
  const file = resolve(root, name);
  const visit = (tokens: ReturnType<typeof markdown.parse>) => {
    for (const token of tokens) {
      for (const attribute of ['href', 'src']) {
        const rawLink = token.attrGet(attribute);
        const link = typeof rawLink === 'string' ? rawLink : undefined;
        if (!link || /^(https?:|mailto:|data:|#)/.test(link)) continue;
        const target = resolve(dirname(file), decodeURIComponent(link.split(/[?#]/)[0]));
        assert.ok(existsSync(target), `Broken Markdown link ${link} in ${file}`);
        checked++;
      }
      if (token.children) visit(token.children);
    }
  };
  visit(markdown.parse(readFileSync(file, 'utf8'), {}));
}
for (const file of walk(resolve(root, 'examples')).filter((file) => file.endsWith('.md'))) {
  assert.ok(parseResumeFile(readFileSync(file, 'utf8')).content, `Empty example: ${file}`);
}
const urls = [
  ...readFileSync(resolve(dist, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g),
];
assert.ok(urls.length >= 5, 'Sitemap must include actual docs pages');
for (const [, value] of urls) {
  const path = new URL(value).pathname;
  assert.ok(path.startsWith(site.pathname), `Sitemap omits canonical base: ${value}`);
  assert.ok(
    existsSync(resolve(dist, path.slice(site.pathname.length))),
    `Missing sitemap page: ${value}`
  );
}
console.log(
  `Verified ${checked} local links, ${urls.length} sitemap pages, and all Markdown examples.`
);
