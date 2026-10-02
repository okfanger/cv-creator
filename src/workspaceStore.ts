import type { DirectoryHandle } from './fileSystem';
import type { FileDraft } from './fileSession';

export type WorkspaceRecord = { id: string; handle: DirectoryHandle };
// Handle records are shared across tabs so a directory always uses the same Web Lock.
const DB_NAME = 'qingjian-file-workspaces-v1';
let database: Promise<IDBDatabase> | undefined;
function db() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        for (const name of ['workspaces', 'state', 'drafts', 'recovery'])
          request.result.createObjectStore(name);
      };
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
      request.onsuccess = () => resolve(request.result);
    });
  return database;
}
async function transact<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
) {
  const database = await db();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(store, mode);
    const request = run(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error || request.error);
    transaction.onabort = () => reject(transaction.error || new Error('浏览器草稿存储失败'));
  });
}
const get = <T>(store: string, key: string) =>
  transact<T | undefined>(store, 'readonly', (s) => s.get(key));
const put = (store: string, key: string, value: unknown) =>
  transact(store, 'readwrite', (s) => s.put(value, key));
const remove = (store: string, key: string) => transact(store, 'readwrite', (s) => s.delete(key));
const appKey = () => `cv-creator:${import.meta.env.BASE_URL}`;

export async function registerWorkspace(handle: DirectoryHandle): Promise<WorkspaceRecord> {
  // Serialize registration across tabs as well as actual file writes.
  return navigator.locks.request('qingjian-workspace-register', async () => {
    const records = await transact<WorkspaceRecord[]>('workspaces', 'readonly', (s) => s.getAll());
    for (const record of records) {
      if (await handle.isSameEntry(record.handle).catch(() => false)) {
        await put('state', appKey(), record.id);
        return record;
      }
    }
    const record = { id: crypto.randomUUID(), handle };
    await put('workspaces', record.id, record);
    await put('state', appKey(), record.id);
    return record;
  });
}
export async function rememberedWorkspace() {
  const id = await get<string>('state', appKey());
  return id ? get<WorkspaceRecord>('workspaces', id) : undefined;
}
export const forgetWorkspace = () => remove('state', appKey());
export const draftKey = (workspace: string, path: string) => `${workspace}:${path}`;
export const getDraft = (key: string) => get<FileDraft>('drafts', key);
export const putDraft = (key: string, value: FileDraft) => put('drafts', key, value);
export const removeDraft = (key: string) => remove('drafts', key);
export const getWorkspaceDrafts = async (workspace: string) => {
  const drafts = await transact<FileDraft[]>('drafts', 'readonly', (s) => s.getAll());
  return drafts.filter((d) => d.workspace === workspace);
};
export const keepRecovery = (workspace: string, path: string, web: string, disk: string) =>
  put('recovery', `${draftKey(workspace, path)}:${crypto.randomUUID()}`, {
    workspace,
    path,
    web,
    disk,
    savedAt: Date.now(),
  });

export async function recoveryCopies(workspace: string) {
  const copies = await transact<
    { workspace: string; path: string; web: string; disk: string; savedAt: number }[]
  >('recovery', 'readonly', (s) => s.getAll());
  return copies.filter((c) => c.workspace === workspace).sort((a, b) => b.savedAt - a.savedAt);
}
