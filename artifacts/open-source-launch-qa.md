# Open-source launch verification

Date: 2026-10-04

## Automated checks

- Node.js 24.19.0: existing suite `56 passed`, `0 failed`.
- Type checking includes the public-site publisher and screenshot gallery.
- Production builds checked at `/`, `/resume/` with a custom canonical domain, and `/cv-creator/`.
- `npm run check:site`: 172 local links, 9 sitemap pages, and all Markdown examples checked for each build.
- Existing format-specification sections in llms.txt retained; original editor instructions retained in docs/editor-guide.zh-CN.md.
- Existing Vite warnings about bundle size and lucide-react directives remain; builds succeed.

## Browser checks

- Real application: imported the fictional developer-resume.md; AI Engineering template and one-page preview rendered.
- Seven-template gallery uses the real Preview component and the same fictional file for each template. Screenshot inspected.
- Static introduction and English/Chinese guide navigation checked; mobile width 375 px had no horizontal overflow (document width 360 px with scrollbar).
- Production `/cv-creator/` preview: introduction images loaded; CTA opened editor; import worked; help links retained deployed base path.
- Public introduction and docs HTML contain readable content without JavaScript.
- No resume-storage or synchronization implementation changes were made.

## Pending native verification

The native Chrome automation tool reported that the Mac was locked and could not be automatically unlocked. User was asked to unlock the host. Native directory-picker, host-file synchronization, screen recording, and final browser-generated PDF verification were not performed in this run. No unverified recording or claims of native verification were published. Existing OPFS and mocked test evidence is not treated as native directory verification.

## Public assets

- assets/editor.jpg: actual editor screenshot with fictional resume.
- assets/templates.jpg: actual seven-template preview gallery.
- assets/social-card.jpg: screenshot of the static product introduction.
- assets/logo.svg: original vector logo.

Real personal resumes, existing local-only screenshots, and browser profiles are excluded from this change.
