<p align="center"><img src="assets/logo.svg" width="72" height="72" alt="Qingjian logo" /></p>

<h1 align="center">Qingjian · 轻简</h1>
<p align="center"><strong>Your resume, in Markdown. Live A4 preview. Local-first.</strong></p>
<p align="center">Write with your editor or an AI assistant. Preview and export with Qingjian.</p>

<p align="center">
  <a href="https://okfanger.github.io/cv-creator/">Try the editor</a> ·
  <a href="https://okfanger.github.io/cv-creator/about.html">Overview</a> ·
  <a href="docs/ai-workflow.md">AI workflow</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>
<p align="center">
  <a href="https://github.com/okfanger/cv-creator/actions/workflows/ci.yml"><img src="https://github.com/okfanger/cv-creator/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-ISC-2c584b" alt="ISC license" /></a>
</p>

![The Qingjian editor with Markdown source and a live A4 resume preview](assets/editor.jpg)

Qingjian is a local-first **Markdown resume editor / CV builder**. Keep your content and layout settings in one portable file, preview an A4 document as you write, and export PDF through browser printing. No account or backend is required to use the editor.

## Why Qingjian?

- **A file you control.** Markdown content, YAML layout settings, and optional embedded photos and icons travel together. Back it up or version it with Git.
- **See the page while you write.** Live A4 preview, automatic pagination, manual page breaks, and browser PDF printing.
- **Works alongside your editor.** Desktop Chrome / Edge can connect an authorized local folder. External file changes update the preview while the page is active; concurrent edits trigger a conflict choice.
- **Seven templates, one source.** Switch presentation without rewriting your resume. Customize fonts, colors, spacing, headings, columns, and icons.
- **Local-first by default.** Resume content stays in browser storage or authorized local files; the editor does not upload it to a server.
- **A documented format for AI assistants.** Give an external assistant the [format guide](llms.txt) and your facts, then review the file and page layout yourself.

## Start in three steps

1. Open the [online editor](https://okfanger.github.io/cv-creator/). Edit the example or import a [sample Markdown resume](examples/developer-resume.md).
2. Pick a template and check the A4 preview and pagination.
3. Choose **Export resume → PDF**, then **Save as PDF** in your browser. Disable print headers/footers and enable background graphics.

Download the complete Markdown file as a backup. Browser-only drafts are removed if you clear that site's browser data. The current interface is in Simplified Chinese; English Markdown content can be imported and rendered.

## Write with AI, preview with Qingjian

On desktop Chrome / Edge, open **My resumes (我的简历) → Connect folder (连接文件夹)** and authorize a dedicated resume folder. Ask your external coding assistant to edit a file using the [implemented format](llms.txt). Qingjian checks that file for changes while the page is active; finish by reviewing the content and printing the PDF.

[Follow the workflow](docs/ai-workflow.md) · [Download the fictional demo](examples/developer-resume.md)

Qingjian provides file editing and preview, rather than an embedded AI model. The assistant you choose has its own data handling rules. If both the browser and the assistant edit at once, resolve the conflict before continuing.

## Templates

![Seven Qingjian templates rendering the same fictional resume](assets/templates.jpg)

Minimal · AI Engineering · Classic · Modern · Editorial · Technical · Formal. All use the same Markdown format. Fonts depend on the fonts installed on your computer.

## Guides and examples

| Task                                                    | Guide                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Edit a local resume with an external AI assistant       | [AI workflow](docs/ai-workflow.md) / [中文](docs/ai-workflow.zh-CN.md)   |
| Print an A4 PDF and understand pagination               | [PDF guide](docs/pdf-export.md)                                          |
| Understand browser support, storage, and conflicts      | [FAQ](docs/faq.md)                                                       |
| Generate or edit a valid Markdown file                  | [Agent format specification](llms.txt)                                   |
| Explore columns and custom icons                        | [Columns](examples/three-column.md) · [Icons](examples/heading-icons.md) |
| Read all editor, sync, recovery, and deployment details | [Complete Chinese manual](docs/editor-guide.zh-CN.md)                    |

The [public documentation pages](https://okfanger.github.io/cv-creator/docs/ai-workflow.html) are readable without running the editor. Markdown sources and examples are also published for retrieval tools.

## Browser support and boundaries

- Editing, Markdown import/download, and PDF printing remain available without folder access.
- Native folder synchronization requires desktop Chrome / Edge, HTTPS or localhost, and both File System Access API and Web Locks. Background tabs may check less frequently; closed tabs do not sync.
- This version has no Service Worker. Loading the application offline is not guaranteed.
- PDF output depends on browser printing and installed fonts. ATS compatibility is not certified.

## Develop locally

Use **Node.js 24** and **npm** (the package manager used by CI):

```sh
git clone https://github.com/okfanger/cv-creator.git
cd cv-creator
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run check:site
```

Built with React, TypeScript, Vite, CodeMirror, and markdown-it. The existing pnpm lockfile is retained; npm is the maintained installation path for this release.

### Deploy

The repository includes a [GitHub Pages workflow](.github/workflows/deploy.yml). Set **Settings → Pages → Source → GitHub Actions**. Its default base path is `/cv-creator/`; configure `VITE_BASE_PATH` and `VITE_SITE_URL` as Actions variables for a different path or domain. See the [deployment details](docs/editor-guide.zh-CN.md#部署到-github-pages).

## Contribute

Templates, documentation, translations, and reproducible browser fixes are welcome. Start with [CONTRIBUTING](CONTRIBUTING.md) and the [contribution opportunities](docs/contribution-opportunities.md); large changes should begin with an issue describing the user problem. Pull requests run tests and build checks.

If Qingjian helps your workflow, a star makes it easier to find again. Sharing a reproducible example or helping another user is welcome too.

## License

[ISC](LICENSE). See [third-party credits](docs/credits.md) for dependencies and format references.
