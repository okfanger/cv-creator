import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import MarkdownIt from 'markdown-it';

const repository = 'https://github.com/okfanger/cv-creator';
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
const css = `:root{--ink:#203e34;--muted:#64736b;--paper:#faf9f4;--line:#dce3da;--accent:#2c584b}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif}a{color:var(--accent);text-underline-offset:4px}a:hover{color:#15392c}header,main,footer{max-width:1120px;margin:auto;padding:24px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:700;letter-spacing:.02em}.brand img{width:36px;height:36px}nav{display:flex;gap:22px;flex-wrap:wrap;font-size:14px}.hero{padding:72px 0 44px;max-width:860px}.eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}h1{font-size:clamp(34px,5vw,64px);line-height:1.15;letter-spacing:-.04em;margin:20px 0}h2{font-size:28px;line-height:1.3;margin-top:48px}h3{font-size:20px}p{margin:16px 0}.lede{font-size:21px;color:var(--muted);max-width:760px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.button{display:inline-block;padding:11px 21px;border:1px solid var(--line);border-radius:8px;text-decoration:none;font-weight:600}.primary{background:var(--accent);color:white;border-color:var(--accent)}.primary:hover{color:white;background:#214337}.shot{width:100%;height:auto;border-radius:12px;border:1px solid var(--line);box-shadow:0 18px 50px #243d3010}.caption{color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:28px}.card{border-top:2px solid var(--accent);padding-top:10px}.card p{color:var(--muted)}.workflow{background:#edf1e9;border-radius:12px;padding:24px;font-family:ui-monospace,monospace;line-height:2}.document{max-width:860px}.document h1{font-size:38px;letter-spacing:-.02em}.document h2{border-top:1px solid var(--line);padding-top:24px;font-size:25px}.document img{max-width:100%}table{border-collapse:collapse;width:100%;font-size:14px;display:block;overflow:auto}td,th{padding:10px;text-align:left;border-bottom:1px solid var(--line)}pre{overflow:auto;padding:20px;background:#edf1e9;border-radius:8px;font-size:14px}code{font-family:ui-monospace,monospace}blockquote{border-left:3px solid var(--accent);margin-left:0;padding-left:20px;color:var(--muted)}footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;margin-top:56px}.footer-links{display:flex;gap:20px;flex-wrap:wrap}@media(max-width:700px){header{align-items:flex-start}nav{gap:10px}.hero{padding-top:36px}.grid{grid-template-columns:1fr;gap:12px}.lede{font-size:18px}header,main,footer{padding:20px}.document h1{font-size:30px}}`;

export function siteFiles(
  root: string,
  base: string,
  siteUrl: string
): Map<string, string | Buffer> {
  const files = new Map<string, string | Buffer>();
  const href = (path: string) => `${base}${path}`;
  const canonical = (path: string) => new URL(path, siteUrl).href;
  const shell = (
    title: string,
    description: string,
    path: string,
    content: string,
    language = 'en'
  ) => `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Qingjian</title>
<meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical(path))}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical(path))}"><meta property="og:image" content="${escape(canonical('assets/social-card.jpg'))}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="${href('assets/logo.svg')}"><link rel="stylesheet" href="${href('assets/site.css')}"></head>
<body><header><a class="brand" href="${href('about.html')}"><img src="${href('assets/logo.svg')}" alt="">Qingjian · 轻简</a><nav aria-label="Main navigation"><a href="${href('index.html')}">Open editor</a><a href="${href('docs/ai-workflow.html')}">AI workflow</a><a href="${repository}">GitHub</a></nav></header>${content}
<footer><div class="footer-links"><a href="${href('docs/faq.html')}">FAQ / 常见问题</a><a href="${href('llms.txt')}">Agent format</a><a href="${repository}/blob/main/LICENSE">ISC License</a></div><p>Local-first Markdown resume editor. 当前编辑器界面为简体中文。Example profiles are fictional.</p></footer></body></html>`;

  files.set('assets/site.css', css);
  files.set(
    'about.html',
    shell(
      'Markdown resume editor with live A4 preview',
      'Qingjian is a local-first Markdown resume editor with A4 preview, browser PDF export, and local file synchronization for external AI workflows.',
      'about.html',
      `<main>
<section class="hero"><div class="eyebrow">Markdown resume editor · Local-first</div><h1>Your resume.<br>Your file.</h1><p class="lede">Write in Markdown. Preview on A4. Export to PDF.<br>用 AI 改 Markdown，用轻简看排版。</p><p>Keep content and layout together in one portable file. Use your editor or an external AI assistant, then review the page in Qingjian.</p><div class="actions"><a class="button primary" href="${href('index.html')}">Open the editor / 在线体验</a><a class="button" href="${href('docs/ai-workflow.html')}">Follow the workflow</a></div><p class="caption">No account or backend required. Editor interface: 简体中文.</p></section>
<img class="shot" src="${href('assets/editor.jpg')}" alt="Qingjian editor with Markdown source beside a live A4 resume preview" width="1280" height="720"><p class="caption">A real editor screenshot, using a fictional resume.</p>
<section><h2>One Markdown file. A clear working loop.</h2><div class="grid"><div class="card"><h3>Keep your source</h3><p>Content, YAML layout settings, and optional embedded media stay together. Back up the file or manage versions yourself.</p></div><div class="card"><h3>See the page</h3><p>Live A4 preview, automatic pagination, seven templates, and browser PDF printing.</p></div><div class="card"><h3>Work with your tools</h3><p>Desktop Chrome / Edge can connect an authorized folder and read external changes while the page is active.</p></div></div></section>
<section><h2>Write with AI. Preview with Qingjian.</h2><p>Give an external assistant your facts and the <a href="${href('llms.txt')}">format guide</a>. It edits the file; Qingjian previews it. Review every factual change yourself.</p><div class="workflow">Your facts → external Markdown edit → live A4 preview → review → PDF</div><div class="actions"><a class="button" href="${href('docs/ai-workflow.zh-CN.html')}">中文操作指南</a><a class="button" href="${href('examples/developer-resume.md')}" download>Download the sample</a></div></section>
<section><h2>Seven templates. The same content.</h2><img class="shot" src="${href('assets/templates.jpg')}" alt="Seven templates rendering the same fictional resume" loading="lazy"><p class="caption">Minimal · AI Engineering · Classic · Modern · Editorial · Technical · Formal.</p></section>
<section><h2>Start with an example</h2><ol><li>Open the editor and edit or import Markdown.</li><li>Choose a template and check pagination.</li><li>Print to A4 PDF and keep your Markdown backup.</li></ol><div class="actions"><a href="${href('docs/pdf-export.html')}">PDF guide / 打印指南</a><a href="${href('docs/faq.html')}">Browser support and storage</a><a href="${href('docs/contribution-opportunities.html')}">Contribute</a></div><p>Native folder sync requires desktop Chrome / Edge, HTTPS or localhost, and File System Access API plus Web Locks. Import/download remains available when unsupported. Offline reload and ATS compatibility are not guaranteed.</p></section>
</main>`
    )
  );

  const markdown = new MarkdownIt({ html: false, linkify: true });
  const docNames = readdirSync(resolve(root, 'docs')).filter((name) => name.endsWith('.md'));
  for (const name of docNames) {
    const source = readFileSync(resolve(root, 'docs', name), 'utf8');
    const title = source.match(/^# (.+)$/m)?.[1] || name;
    const tokens = markdown.parse(source, {});
    const visit = (items: typeof tokens) => {
      for (const token of items) {
        if (token.type === 'heading_open') {
          const index = items.indexOf(token);
          const text = items[index + 1]?.content || '';
          token.attrSet(
            'id',
            text
              .toLowerCase()
              .replace(/[^\p{L}\p{N}_\- ]/gu, '')
              .replace(/ /g, '-')
          );
        }
        if (token.type === 'link_open') {
          const rawLink = token.attrGet('href');
          const link = typeof rawLink === 'string' ? rawLink : undefined;
          if (link && !/^(https?:|mailto:|#)/.test(link)) {
            const [file, hash] = link.split('#');
            if (docNames.includes(file))
              token.attrSet('href', file.replace(/\.md$/, '.html') + (hash ? `#${hash}` : ''));
          }
        }
        if (token.children) visit(token.children);
      }
    };
    visit(tokens);
    const path = `docs/${name.replace(/\.md$/, '.html')}`;
    const description = title + ' — Qingjian local-first Markdown resume editor documentation.';
    files.set(`docs/${name}`, source);
    files.set(
      path,
      shell(
        title,
        description,
        path,
        `<main class="document">${markdown.renderer.render(tokens, markdown.options, {})}<p><a href="${escape(name)}">Read the Markdown source</a></p></main>`,
        name.includes('zh-CN') ? 'zh-CN' : 'en'
      )
    );
  }
  files.set('llms.txt', readFileSync(resolve(root, 'llms.txt'), 'utf8'));
  for (const name of readdirSync(resolve(root, 'examples')).filter((name) =>
    /\.(md|svg)$/.test(name)
  )) {
    files.set(`examples/${name}`, readFileSync(resolve(root, 'examples', name)));
  }
  for (const name of readdirSync(resolve(root, 'assets')).filter((name) =>
    /\.(jpg|svg|gif|mp4)$/.test(name)
  )) {
    files.set(`assets/${name}`, readFileSync(resolve(root, 'assets', name)));
  }
  const urls = ['index.html', ...files.keys()].filter((path) => path.endsWith('.html'));
  files.set(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escape(canonical(path))}</loc></url>`).join('')}</urlset>`
  );
  // robots.txt applies at a host root, not a GitHub Pages project subdirectory.
  if (base === '/')
    files.set('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${canonical('sitemap.xml')}\n`);
  return files;
}
