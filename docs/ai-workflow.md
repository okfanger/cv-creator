# Edit a Markdown resume with AI and preview it locally

[简体中文](ai-workflow.zh-CN.md) · [Editor](../index.html) · [Format specification](../llms.txt)

Qingjian can preview a resume file changed by an external editor or AI coding assistant. It does not run an AI model itself. This guide uses a fictional example and native desktop Chrome folder access.

## 1. Prepare one file

Download [developer-resume.md](../examples/developer-resume.md) and put it in a dedicated folder. Keep a backup before asking an assistant to change your own resume. The example's people, organizations, and accomplishments are fictional.

## 2. Connect the folder

Open Qingjian on HTTPS or localhost in desktop Chrome / Edge. Choose **My resumes (我的简历) → Connect folder (连接文件夹)**, select your dedicated folder, and grant read/write access. Open the listed Markdown file. Connecting a folder or opening a file does not rewrite it.

## 3. Give an external assistant a bounded task

```text
Read Qingjian's current format guide before editing my Markdown resume.
Use only facts I provide; mark missing facts rather than inventing them.
Preserve existing content, embedded media, unrelated YAML, and layout settings.
Apply my requested change to the named file and summarize the diff.
Leave the final content and page layout for me to review in Qingjian.
```

Use [the published format guide](../llms.txt). Provide the assistant the exact file path and the specific requested edit. This is a file-based workflow, not an MCP integration. Review your chosen assistant's data handling rules before providing private information.

## 4. Review the preview

Keep the editor tab active. The page checks the active file about once a second while in the foreground, and updates when no web edit is pending. Confirm both the changed words and pagination. YAML settings can be edited externally as well.

Avoid writing simultaneously from the browser and another program. If both versions change, automatic saving pauses: choose the disk version, web version, or save the web version as a separate copy. Read the [FAQ](faq.md) and [complete recovery manual](editor-guide.zh-CN.md) before resolving a conflict you care about.

## 5. Export and retain the source

Use browser printing to save PDF, then keep the Markdown source as a backup. [PDF instructions](pdf-export.md). This version does not automatically print from your assistant or certify ATS compatibility.
