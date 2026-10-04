# Repository guidance for coding assistants

- Read README.md, CONTRIBUTING.md, and the relevant existing implementation before editing.
- Use Node.js 24 and npm. Run the existing tests and build for code changes; run `npm run check:site` after building published docs.
- Keep English and Chinese documentation consistent. `llms.txt` documents implemented behavior, not planned features.
- Keep user resumes in Markdown files; preserve unrelated YAML, comments, embedded photos/icons, and content. Do not invent personal facts or metrics.
- Use fictional fixtures for screenshots and examples. Do not commit real resumes or browser profiles.
- Check desktop browser pagination and printing for layout changes. Native directory access, OPFS fixtures, and mocks are different verification levels; report which was exercised.
- Preserve file conflict, recovery, and permission handling. The browser cannot share an atomic write transaction with external editors.
- Scope changes to the requested work. Do not modify unrelated user changes, upgrade dependencies, or claim unsupported integrations.
