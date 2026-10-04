# Contribution opportunities / 可参与的任务

These are scoped ideas, not claims of completed features. If you take one on, open an issue with the chosen scope first. / 以下是贡献方向，开始前请在 Issue 中确认范围。

## English resume example

- Files: add `examples/developer-resume.en.md`; link it from both READMEs.
- Use a clearly fictional profile, complete valid YAML, columns, and a two-page variant.
- Acceptance: imports correctly, roundtrips without losing body/settings, and has readable page breaks in desktop Chrome.

## Template documentation

- Files: `docs/templates.md`, existing template definitions in `src/data.ts`.
- Explain each template's intended presentation with the same fictional content and installed-font caveat.
- Acceptance: all seven current IDs are covered; no claims that a template changes applicant facts or guarantees hiring outcomes.

## Browser reproduction report

- Files: a small fictional `.md` reproducer attached to an Issue; code changes only if a fix is identified.
- Record OS/browser version, steps, expected/actual result, screenshot, and whether native folder access was used.
- Acceptance: another contributor can repeat it without private data or access to your directory.

## Documentation translation

- Files: English/Chinese guides in `docs/`.
- Align supported features, permission conditions, conflict behavior, and printing caveats.
- Acceptance: links work in GitHub and the built site; the translation does not silently promise an English UI or AI integration.
