# Contributing / 贡献指南

Thank you for helping Qingjian. Useful first contributions include a template, an example resume, documentation, translation, or a reproducible browser fix. / 欢迎模板、示例、文档、翻译和浏览器问题修复。

## Local setup

Use Node.js 24 and npm. CI uses package-lock.json; use `npm ci` and keep it current when changing dependencies. Do not update the historical pnpm lockfile unless the package-manager policy changes in a separate proposal.

```sh
npm ci
npm run dev
npm test
npm run build
npm run check:site
```

## Before a large change

Open an issue describing the user problem, expected behavior, and proposed scope. Changes to the Markdown dialect or storage/synchronization need a compatibility and recovery plan. Small typo fixes can go straight to a PR.

大改动先讨论用户问题和范围；文件格式、存储与同步修改需说明兼容与恢复方案。小文案修复可以直接提 PR。

## Pull request checklist

- Describe the user-visible change and how you verified it.
- For UI/template changes, include screenshots using fictional resume data; check pagination and print preview in desktop Chrome / Edge.
- For file-sync changes, distinguish mocked tests, the OPFS development fixture, and native folder-picker verification.
- Preserve unrelated YAML, embedded media, and the existing format version. Do not promise unsupported syntax or browser behavior.
- Update English and Chinese user-facing docs when behavior changes. `llms.txt` is the authoritative agent format guide.
- Do not commit real resumes, credentials, recovery databases, or local browser profiles.

请说明用户可见变化与验证方式；界面改动使用虚构示例截图，检查分页和打印。明确模拟测试、OPFS 沙盒与原生目录测试的区别。

## Where to work

| Change                       | Starting point                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| Template                     | `src/data.ts`, `src/styles.css`, `src/aiTemplate.css`                |
| Format / examples            | `llms.txt`, `examples/`, `src/resumeFile.ts`, `src/markdown.ts`      |
| Pagination                   | `src/pagination.ts`, `src/Preview.tsx`                               |
| File synchronization         | `src/fileSession.ts`, `src/fileSystem.ts`, `src/useFileWorkspace.ts` |
| Public docs and introduction | `docs/`, `scripts/site.ts`, `assets/`                                |

See [contribution opportunities](docs/contribution-opportunities.md). Contributions are reviewed by the maintainer as capacity allows; there is no guaranteed response time.
