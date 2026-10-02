/** Developer-only manual integration fixture. Vite does not bundle it into dist. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App';
import '../src/styles.css';
import { parseResumeFile } from '../src/resumeFile';
import { draftKey, putDraft, registerWorkspace } from '../src/workspaceStore';
import type { DirectoryHandle } from '../src/fileSystem';

const status = document.getElementById('fixture-status')!;
const output = document.getElementById('disk-source')!;
const sourceInput = document.getElementById('external-source') as HTMLTextAreaElement;
const root = await navigator.storage.getDirectory();
const directory = await root.getDirectoryHandle('qingjian-development-test-files', {
  create: true,
});
const fixture = await directory.getFileHandle('resume.md', { create: true });
const write = async (source: string) => {
  const stream = await fixture.createWritable();
  await stream.write(source);
  await stream.close();
};
if ((await fixture.getFile()).size === 0) await write('# 文件测试\n\n## 工作经历\n- 原始内容\n');
const nested = await directory.getDirectoryHandle('nested', { create: true });
const second = await nested.getFileHandle('second.markdown', { create: true });
if ((await second.getFile()).size === 0) {
  const stream = await second.createWritable();
  await stream.write(
    '---\n# 保留注释\nexternal: preserved\nqingjian:\n  version: 1\n  title: 子目录简历\n  settings:\n    fontSize: 15\n---\n# 子目录测试\n'
  );
  await stream.close();
}
const invalid = await directory.getFileHandle('invalid.md', { create: true });
if ((await invalid.getFile()).size === 0) {
  const stream = await invalid.createWritable();
  await stream.write('---\nqingjian:\n  version: 99\n---\n# invalid');
  await stream.close();
}
const pickerHost = window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandle> };
Object.defineProperty(pickerHost, 'showDirectoryPicker', {
  configurable: true,
  value: new URL(location.href).searchParams.has('unsupported') ? undefined : async () => directory,
});
status.textContent = '沙盒就绪：真实 FileSystem 句柄 / IndexedDB / Web Locks；未访问用户目录';
document.getElementById('external-write')!.onclick = () => {
  void write(sourceInput.value).then(() => {
    status.textContent = '外部版本已写入沙盒文件';
  });
};
document.getElementById('disk-read')!.onclick = () => {
  void fixture
    .getFile()
    .then((file) => file.text())
    .then((source) => {
      output.textContent = source;
    });
};
document.getElementById('seed-draft')!.onclick = () => {
  void (async () => {
    const record = await registerWorkspace(directory as unknown as DirectoryHandle);
    const baseSource = await (await fixture.getFile()).text();
    const resume = parseResumeFile(baseSource, '简历');
    resume.content = '# 恢复的网页草稿\n';
    await putDraft(draftKey(record.id, 'resume.md'), {
      workspace: record.id,
      path: 'resume.md',
      baseSource,
      resume,
    });
    location.reload();
  })();
};
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
