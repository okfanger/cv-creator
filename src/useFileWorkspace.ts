import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Resume } from './data';
import { parseIconfont } from './iconfont';
import { parseResumeFile, serializeResumeFile } from './resumeFile';
import { FileSession } from './fileSession';
import {
  directoryPicker,
  errorMessage,
  readSource,
  scanDirectory,
  writeNewFile,
  type DirectoryEntry,
  type FileHandle,
} from './fileSystem';
import {
  draftKey,
  forgetWorkspace,
  getDraft,
  getWorkspaceDrafts,
  keepRecovery,
  putDraft,
  rememberedWorkspace,
  registerWorkspace,
  removeDraft,
  recoveryCopies,
  type WorkspaceRecord,
} from './workspaceStore';

type Entry = DirectoryEntry & { missing?: boolean };
type Runtime = {
  record: WorkspaceRecord;
  sessions: Map<string, FileSession>;
  entries: Entry[];
  writer: boolean;
  permission: PermissionState;
  release?: () => void;
  scanRunning: boolean;
  closed: boolean;
};
const cleanIcons = (source: string) => parseIconfont(source).source;
export const encodeResume = (resume: Resume) => serializeResumeFile(resume, cleanIcons);
export const decodeResume = (source: string, title: string, id?: string) =>
  parseResumeFile(source, title, id, cleanIcons);

export function useFileWorkspace() {
  const runtime = useRef<Runtime | null>(null);
  const active = useRef<FileSession | null>(null);
  const opening = useRef(0);
  const transitioning = useRef(false);
  const creating = useRef(false);
  const [, render] = useReducer((n) => n + 1, 0);
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState<{ entry: Entry; message: string } | null>(null);
  const supported =
    typeof window !== 'undefined' &&
    !!directoryPicker() &&
    !!navigator.locks &&
    window.isSecureContext;
  const changed = useCallback(() => render(), []);

  const makeSession = (rt: Runtime, entry: Entry, resume: Resume, source: string) => {
    const key = draftKey(rt.record.id, entry.path);
    const session = new FileSession(rt.record.id, entry.path, entry.handle, resume, source, {
      parse: (text) =>
        decodeResume(text, entry.handle.name.replace(/\.(md|markdown)$/i, ''), resume.id),
      serialize: encodeResume,
      writable: () =>
        rt.writer &&
        rt.permission === 'granted' &&
        !rt.closed &&
        !transitioning.current &&
        !creating.current,
      // Read-only tabs must never replace the writer's newer recovery draft.
      persist: (draft) => (rt.writer ? putDraft(key, draft) : Promise.resolve()),
      clearDraft: () => (rt.writer ? removeDraft(key) : Promise.resolve()),
      recover: (web, disk) => keepRecovery(rt.record.id, entry.path, web, disk),
      changed,
    });
    rt.sessions.set(entry.path, session);
    return session;
  };

  const acquire = async (rt: Runtime) => {
    if (rt.writer || rt.closed) return;
    await new Promise<void>((ready, reject) => {
      void navigator.locks
        .request(`qingjian-workspace:${rt.record.id}`, { ifAvailable: true }, async (lock) => {
          if (!lock || rt.closed) {
            ready();
            return;
          }
          const released = new Promise<void>((resolve) => {
            rt.release = resolve;
          });
          rt.writer = true;
          changed();
          ready();
          await released;
          rt.writer = false;
          changed();
        })
        .catch(reject);
    });
  };

  const scan = async (rt: Runtime) => {
    if (rt.scanRunning || rt.closed || rt.permission !== 'granted') return;
    rt.scanRunning = true;
    try {
      const result = await scanDirectory(rt.record.handle);
      const drafts = await getWorkspaceDrafts(rt.record.id);
      if (rt.closed) return;
      const entries: Entry[] = result.entries;
      for (const draft of drafts) {
        if (entries.some((e) => e.path === draft.path)) continue;
        const handle: FileHandle = {
          kind: 'file',
          name: draft.path.split('/').at(-1)!,
          getFile: async () => {
            throw new DOMException('Missing', 'NotFoundError');
          },
          createWritable: async () => {
            throw new DOMException('Missing', 'NotFoundError');
          },
        };
        entries.push({ path: draft.path, handle, missing: true });
      }
      rt.entries = entries;
      setWarnings(result.warnings);
      setMessage('');
      changed();
    } catch (error) {
      if (!rt.closed) {
        setMessage(errorMessage(error));
        changed();
      }
    } finally {
      rt.scanRunning = false;
    }
  };

  const shutdown = async (rt: Runtime | null) => {
    if (!rt) return;
    // Keep the write lock until all pending operations and draft writes settle.
    rt.closed = true;
    try {
      await Promise.all([...rt.sessions.values()].map((s) => s.preserve()));
    } catch (error) {
      rt.closed = false;
      throw error;
    }
    for (const session of rt.sessions.values()) session.stop();
    rt.writer = false;
    rt.release?.();
  };

  const activate = async (record: WorkspaceRecord) => {
    await shutdown(runtime.current);
    active.current = null;
    opening.current++;
    setBlocked(null);
    const rt: Runtime = {
      record,
      sessions: new Map(),
      entries: [],
      writer: false,
      permission: await record.handle.queryPermission({ mode: 'readwrite' }),
      scanRunning: false,
      closed: false,
    };
    runtime.current = rt;
    if (rt.permission === 'granted') {
      await acquire(rt);
      await scan(rt);
    }
    changed();
  };

  useEffect(() => {
    let cancelled = false;
    if (supported)
      void rememberedWorkspace()
        .then(async (record) => {
          if (
            !cancelled &&
            (!runtime.current || runtime.current.closed) &&
            !transitioning.current &&
            record
          )
            await transition(() => activate(record));
        })
        .catch((error) => {
          if (!cancelled) setMessage(`无法恢复文件夹：${errorMessage(error)}`);
        });
    const check = async () => {
      const rt = runtime.current;
      if (!rt || rt.closed || document.visibilityState !== 'visible' || transitioning.current)
        return;
      try {
        rt.permission = await rt.record.handle.queryPermission({ mode: 'readwrite' });
        if (rt.closed) return;
        if (rt.permission === 'granted') await active.current?.check();
        changed();
      } catch (error) {
        if (!rt.closed) setMessage(errorMessage(error));
      }
    };
    const refresh = () => {
      const rt = runtime.current;
      if (rt && document.visibilityState === 'visible' && !transitioning.current) void scan(rt);
    };
    const onVisible = () => {
      void check();
      refresh();
    };
    const timer = setInterval(() => void check(), 1000);
    const listTimer = setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', onVisible);
    const onLeave = (event: BeforeUnloadEvent) => {
      const rt = runtime.current;
      if (creating.current || [...(rt?.sessions.values() || [])].some((s) => s.dirty)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onLeave);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearInterval(listTimer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('beforeunload', onLeave);
      void shutdown(runtime.current).catch(() => {});
    };
    // Runtime is mutable; timers must not restart on each editor keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const transition = async (fn: () => Promise<void>) => {
    if (transitioning.current || creating.current) return;
    transitioning.current = true;
    setBusy(true);
    changed();
    try {
      await fn();
      setMessage('');
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setMessage(errorMessage(error));
    } finally {
      transitioning.current = false;
      setBusy(false);
      changed();
    }
  };

  const connect = () => {
    if (!supported || transitioning.current || creating.current) return;
    // Start the picker before any async work consumes the user gesture.
    return transition(async () => {
      const handle = await directoryPicker()!({ mode: 'readwrite' });
      await activate(await registerWorkspace(handle));
    });
  };
  const reconnect = () => {
    const rt = runtime.current;
    if (!rt || transitioning.current || creating.current) return;
    return transition(async () => {
      rt.permission = await rt.record.handle.requestPermission({ mode: 'readwrite' });
      if (rt.permission !== 'granted') throw new Error('需要读写授权才能恢复同步');
      await registerWorkspace(rt.record.handle);
      await acquire(rt);
      await scan(rt);
      transitioning.current = false;
      for (const session of rt.sessions.values()) await session.retry();
    });
  };
  const disconnect = () =>
    transition(async () => {
      await shutdown(runtime.current);
      await forgetWorkspace();
      runtime.current = null;
      active.current = null;
      opening.current++;
      setBlocked(null);
      setWarnings([]);
    });
  const selectBrowser = () => {
    active.current = null;
    opening.current++;
    setBlocked(null);
    changed();
  };

  const open = async (entry: Entry) => {
    const rt = runtime.current;
    if (!rt || rt.closed || rt.permission !== 'granted' || transitioning.current) return;
    const token = ++opening.current;
    const current = active.current;
    await current?.flush();
    if (rt.closed || token !== opening.current) return;
    try {
      let session = rt.sessions.get(entry.path);
      if (!session) {
        const draft = await getDraft(draftKey(rt.record.id, entry.path));
        const id = `file:${rt.record.id}:${entry.path}`;
        if (entry.missing && draft) {
          session = makeSession(rt, entry, { ...draft.resume, id }, draft.baseSource);
          session.restore(draft);
          session.missing();
        } else {
          const source = await readSource(entry.handle);
          const resume = decodeResume(
            source,
            entry.handle.name.replace(/\.(md|markdown)$/i, ''),
            id
          );
          session = makeSession(rt, entry, resume, source);
          if (draft) session.restore(draft);
        }
      } else await session.check();
      if (!rt.closed && token === opening.current) {
        active.current = session;
        setBlocked(null);
        changed();
      }
    } catch (error) {
      if (!rt.closed && token === opening.current)
        setBlocked({ entry, message: errorMessage(error) });
    }
  };

  const add = async (resume: Resume, resolveOriginal = false) => {
    const rt = runtime.current;
    if (
      !rt ||
      !rt.writer ||
      rt.permission !== 'granted' ||
      rt.closed ||
      transitioning.current ||
      creating.current
    )
      throw new Error('请先连接文件夹并取得写入权限');
    creating.current = true;
    setBusy(true);
    changed();
    const original = active.current;
    try {
      const source = encodeResume(resume);
      if (resolveOriginal && original) {
        await original.preserve();
        await keepRecovery(
          rt.record.id,
          original.path,
          source,
          original.diskSource ?? original.baseSource
        );
      }
      const entry = await writeNewFile(rt.record.handle, resume.title, source);
      const session = makeSession(
        rt,
        entry,
        decodeResume(source, resume.title, `file:${rt.record.id}:${entry.path}`),
        source
      );
      if (resolveOriginal && original) {
        // The original stays recoverable if the disk version is invalid or disappears.
        creating.current = false;
        await original.resolve('disk');
      }
      active.current = session;
      opening.current++;
      await scan(rt);
      changed();
    } finally {
      creating.current = false;
      setBusy(false);
      changed();
      if (original?.dirty) void original.save();
    }
  };

  return {
    supported,
    record: runtime.current?.record,
    entries: runtime.current?.entries || [],
    permission: runtime.current?.permission,
    writer: !!runtime.current?.writer,
    canWrite: !!runtime.current?.writer && runtime.current.permission === 'granted' && !busy,
    active: active.current,
    busy,
    message,
    warnings,
    blocked,
    clearBlocked: () => setBlocked(null),
    connect,
    reconnect,
    disconnect,
    open,
    add,
    selectBrowser,
    save: () => active.current?.save(),
    dirtyCount: [...(runtime.current?.sessions.values() || [])].filter((s) => s.dirty).length,
    recoveries: () =>
      runtime.current ? recoveryCopies(runtime.current.record.id) : Promise.resolve([]),
  };
}
