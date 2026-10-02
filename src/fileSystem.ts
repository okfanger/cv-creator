import { checkFileSize } from './resumeFile';

export type FileHandle = {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
    abort(): Promise<void>;
  }>;
};
export type DirectoryHandle = {
  kind: 'directory';
  name: string;
  values(): AsyncIterable<FileHandle | DirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  isSameEntry(other: DirectoryHandle): Promise<boolean>;
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
};
export type DirectoryEntry = { path: string; handle: FileHandle };

export function directoryPicker() {
  return (
    window as unknown as {
      showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<DirectoryHandle>;
    }
  ).showDirectoryPicker;
}

export async function readSource(handle: FileHandle) {
  const file = await handle.getFile();
  checkFileSize(file);
  const source = await file.text();
  checkFileSize(source);
  return source;
}

export async function scanDirectory(root: DirectoryHandle) {
  const entries: DirectoryEntry[] = [];
  const warnings: string[] = [];
  const walk = async (directory: DirectoryHandle, prefix: string) => {
    try {
      for await (const handle of directory.values()) {
        const path = prefix + handle.name;
        if (handle.kind === 'directory') await walk(handle, path + '/');
        else if (/\.(md|markdown)$/i.test(handle.name)) entries.push({ path, handle });
      }
    } catch (error) {
      // Root failure means the workspace is unavailable, not an empty folder.
      if (!prefix) throw error;
      warnings.push(`无法读取 ${prefix}：${errorMessage(error)}`);
    }
  };
  await walk(root, '');
  entries.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
  return { entries, warnings };
}

export function safeFileName(title: string) {
  return (
    title
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
      .replace(/[. ]+$/g, '')
      .trim()
      .slice(0, 80) || '简历'
  );
}

export async function writeNewFile(root: DirectoryHandle, title: string, source: string) {
  checkFileSize(source);
  const stem = safeFileName(title);
  const existing = new Set<string>();
  for await (const handle of root.values()) existing.add(handle.name.toLocaleLowerCase());
  for (let suffix = 0; suffix < 10000; suffix++) {
    const name = `${stem}${suffix ? ` (${suffix + 1})` : ''}.md`;
    if (existing.has(name.toLocaleLowerCase())) continue;
    // Recheck immediately before creation; external processes cannot share our lock.
    try {
      await root.getFileHandle(name);
      continue;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error;
    }
    const handle = await root.getFileHandle(name, { create: true });
    // A file created in the narrow race window must not be overwritten.
    if ((await handle.getFile()).size !== 0) continue;
    const stream = await handle.createWritable();
    try {
      await stream.write(source);
      await stream.close();
    } catch (error) {
      await stream.abort().catch(() => {});
      throw error;
    }
    return { path: name, handle };
  }
  throw new Error('同名文件过多，请使用其他简历名称');
}

export function errorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotFoundError') return '文件或文件夹已被删除';
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      return '需要重新授权文件夹';
  }
  return error instanceof Error ? error.message : '文件操作失败';
}
