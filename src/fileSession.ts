import type { Resume } from './data';
import { errorMessage, readSource, type FileHandle } from './fileSystem';

export type FileDraft = { workspace: string; path: string; resume: Resume; baseSource: string };
export type SessionStatus = 'clean' | 'dirty' | 'saving' | 'conflict' | 'error';
type Dependencies = {
  parse(source: string): Resume;
  serialize(resume: Resume): string;
  writable(): boolean;
  persist(draft: FileDraft): Promise<unknown>;
  clearDraft(): Promise<unknown>;
  recover(web: string, disk: string): Promise<unknown>;
  changed(): void;
  schedule?: (fn: () => void, ms: number) => number | ReturnType<typeof setTimeout>;
  cancel?: (timer: number | ReturnType<typeof setTimeout>) => void;
};

/** All disk operations run in one queue; edits remain synchronous and revisioned. */
export class FileSession {
  status: SessionStatus = 'clean';
  error = '';
  diskSource: string | undefined;
  dirty = false;
  private revision = 0;
  private queue: Promise<void> = Promise.resolve();
  private checking?: Promise<void>;
  private timer?: number | ReturnType<typeof setTimeout>;
  private disposed = false;
  private closing = false;
  constructor(
    readonly workspace: string,
    readonly path: string,
    readonly handle: FileHandle,
    public resume: Resume,
    public baseSource: string,
    private deps: Dependencies
  ) {}

  private changed() {
    this.deps.changed();
  }
  private draft(): FileDraft {
    return {
      workspace: this.workspace,
      path: this.path,
      resume: this.resume,
      baseSource: this.baseSource,
    };
  }
  private cancelTimer() {
    if (this.timer !== undefined) (this.deps.cancel || clearTimeout)(this.timer);
    this.timer = undefined;
  }
  private enqueue(action: () => Promise<void>) {
    const next = this.queue.then(async () => {
      if (this.disposed) return;
      try {
        await action();
      } catch (error) {
        this.status = 'error';
        this.error = errorMessage(error);
        this.cancelTimer();
        // Preserve the last good state even if a previously clean file disappears.
        this.dirty = true;
        try {
          await this.deps.persist(this.draft());
        } catch {
          this.error += '；浏览器草稿保存失败，请立即下载备份';
        }
        this.changed();
      }
    });
    this.queue = next;
    return next;
  }
  private autoSave() {
    this.cancelTimer();
    this.timer = (this.deps.schedule || setTimeout)(() => {
      this.timer = undefined;
      void this.save();
    }, 500);
  }
  edit(patch: Partial<Resume>) {
    if (!this.deps.writable() || this.disposed || this.closing) return;
    this.resume = { ...this.resume, ...patch, updatedAt: Date.now() };
    this.revision++;
    this.dirty = true;
    if (this.status !== 'conflict' && this.status !== 'error') this.status = 'dirty';
    // Queue draft writes immediately so newer drafts cannot be overtaken by old ones.
    void this.enqueue(async () => {
      await this.deps.persist(this.draft());
    });
    if (this.status === 'dirty') this.autoSave();
    this.changed();
  }
  restore(draft: FileDraft) {
    this.resume = { ...draft.resume, id: this.resume.id };
    this.dirty = true;
    this.revision++;
    if (draft.baseSource !== this.baseSource) {
      this.diskSource = this.baseSource;
      this.baseSource = draft.baseSource;
      this.status = 'conflict';
    } else {
      this.status = 'dirty';
      if (this.deps.writable()) this.autoSave();
    }
    this.changed();
  }
  /** Recover an orphaned draft without automatically recreating its deleted file. */
  missing() {
    this.cancelTimer();
    this.status = 'error';
    this.error = '文件已被删除；草稿已保留，可另存副本';
    this.changed();
  }
  private acceptDisk(source: string) {
    if (source === this.baseSource) {
      if (this.status === 'conflict') {
        this.diskSource = source;
        this.changed();
      }
      return;
    }
    this.cancelTimer();
    this.diskSource = source;
    if (this.dirty) {
      this.status = 'conflict';
      this.changed();
      return;
    }
    const resume = this.deps.parse(source); // Parse before replacing the last good state.
    this.resume = resume;
    this.baseSource = source;
    this.diskSource = undefined;
    this.status = 'clean';
    this.error = '';
    this.changed();
  }
  check() {
    // Slow disk reads must not accumulate an unbounded queue of polling requests.
    if (this.checking) return this.checking;
    const checking = this.enqueue(async () => {
      if (this.status === 'error') return;
      this.acceptDisk(await readSource(this.handle));
    });
    this.checking = checking;
    void checking.then(() => {
      if (this.checking === checking) this.checking = undefined;
    });
    return checking;
  }
  save() {
    this.cancelTimer();
    return this.enqueue(async () => {
      if (
        !this.dirty ||
        !this.deps.writable() ||
        this.status === 'conflict' ||
        this.status === 'error'
      )
        return;
      await this.write();
    });
  }
  private async write() {
    // Check again even if the polling loop has just run.
    const source = await readSource(this.handle);
    if (source !== this.baseSource) {
      this.acceptDisk(source);
      return;
    }
    const revision = this.revision;
    const serialized = this.deps.serialize(this.resume);
    await this.deps.persist(this.draft());
    if (!this.deps.writable()) return;
    this.status = 'saving';
    this.changed();
    const stream = await this.handle.createWritable();
    try {
      await stream.write(serialized);
      const latest = await readSource(this.handle);
      if (latest !== this.baseSource) {
        await stream.abort();
        this.acceptDisk(latest);
        return;
      }
      if (!this.deps.writable()) {
        await stream.abort();
        this.status = 'dirty';
        return;
      }
      await stream.close();
    } catch (error) {
      await stream.abort().catch(() => {});
      throw error;
    }
    this.baseSource = serialized;
    this.diskSource = undefined;
    this.error = '';
    if (revision === this.revision) {
      await this.deps.clearDraft();
      // Edits may have occurred during IndexedDB cleanup.
      if (revision === this.revision) this.dirty = false;
    }
    this.status = this.dirty ? 'dirty' : 'clean';
    if (this.dirty) {
      await this.deps.persist(this.draft());
      this.autoSave();
    }
    this.changed();
  }
  retry() {
    return this.enqueue(async () => {
      if (!this.deps.writable()) return;
      this.error = '';
      this.status = this.dirty ? 'dirty' : 'clean';
      this.acceptDisk(await readSource(this.handle));
      if (this.dirty && (this.status as SessionStatus) !== 'conflict') await this.write();
      this.changed();
    });
  }
  resolve(choice: 'disk' | 'web') {
    return this.enqueue(async () => {
      if (this.status !== 'conflict' || !this.deps.writable()) return;
      const disk = await readSource(this.handle);
      if (disk !== this.diskSource) {
        this.diskSource = disk;
        this.changed();
        return;
      }
      // Invalid disk metadata must be repaired externally before an in-place overwrite.
      const external = this.deps.parse(disk);
      const revision = this.revision;
      await this.deps.recover(this.deps.serialize(this.resume), disk);
      if (revision !== this.revision || !this.deps.writable()) return;
      if (choice === 'disk') {
        await this.deps.clearDraft();
        if (revision !== this.revision) return;
        this.resume = external;
        this.baseSource = disk;
        this.diskSource = undefined;
        this.dirty = false;
        this.status = 'clean';
      } else {
        this.baseSource = disk;
        this.diskSource = undefined;
        this.status = 'dirty';
        await this.write();
      }
      this.changed();
    });
  }
  async preserve() {
    let pending: Promise<void>;
    do {
      pending = this.queue;
      await pending;
    } while (pending !== this.queue);
    if (this.dirty) await this.deps.persist(this.draft());
  }
  async flush() {
    await this.save();
    await this.preserve();
  }
  stop() {
    this.disposed = true;
    this.cancelTimer();
  }
  async dispose() {
    this.closing = true;
    this.cancelTimer();
    try {
      await this.preserve();
      this.stop();
    } finally {
      this.closing = false;
      this.cancelTimer();
    }
  }
}
