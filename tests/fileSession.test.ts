import test from 'node:test';
import assert from 'node:assert/strict';
import { FileSession, type FileDraft } from '../src/fileSession';
import { parseResumeFile, serializeResumeFile } from '../src/resumeFile';
import {
  scanDirectory,
  writeNewFile,
  safeFileName,
  type DirectoryHandle,
  type FileHandle,
} from '../src/fileSystem';

class FakeFile implements FileHandle {
  kind = 'file' as const;
  name = '简历.md';
  source = '# original';
  writes = 0;
  closed = 0;
  aborted = 0;
  deleted = false;
  denied = false;
  failClose = false;
  afterWrite?: () => Promise<void>;
  async getFile() {
    if (this.deleted) throw new DOMException('Deleted', 'NotFoundError');
    if (this.denied) throw new DOMException('Denied', 'NotAllowedError');
    return new File([this.source], this.name);
  }
  async createWritable() {
    if (this.denied) throw new DOMException('Denied', 'NotAllowedError');
    let buffered = '';
    return {
      write: async (source: string) => {
        this.writes++;
        buffered = source;
        await this.afterWrite?.();
      },
      close: async () => {
        if (this.failClose) throw new Error('disk full');
        this.source = buffered;
        this.closed++;
      },
      abort: async () => {
        this.aborted++;
      },
    };
  }
}

function setup(overrides: Partial<ConstructorParameters<typeof FileSession>[5]> = {}) {
  const file = new FakeFile();
  let writer = true;
  let draft: FileDraft | undefined;
  const recoveries: { web: string; disk: string }[] = [];
  const timers = new Map<number, { fn: () => void; at: number }>();
  let now = 0,
    serial = 0;
  const session = new FileSession(
    'workspace',
    '子目录/简历.md',
    file,
    parseResumeFile(file.source, '简历', 'id'),
    file.source,
    {
      parse: (source) => parseResumeFile(source, '简历', 'id'),
      serialize: serializeResumeFile,
      writable: () => writer,
      persist: async (value) => {
        draft = structuredClone(value);
      },
      clearDraft: async () => {
        draft = undefined;
      },
      recover: async (web, disk) => {
        recoveries.push({ web, disk });
      },
      changed: () => {},
      schedule: (fn, ms) => {
        const id = ++serial;
        timers.set(id, { fn, at: now + ms });
        return id;
      },
      cancel: (id) => {
        timers.delete(id as number);
      },
      ...overrides,
    }
  );
  return {
    file,
    session,
    recoveries,
    getDraft: () => draft,
    setWriter: (value: boolean) => {
      writer = value;
    },
    advance: async (ms: number) => {
      now += ms;
      for (const [id, timer] of [...timers])
        if (timer.at <= now) {
          timers.delete(id);
          timer.fn();
        }
      await session.preserve();
    },
  };
}

test('opening and polling clean ordinary Markdown never writes metadata', async () => {
  const x = setup();
  await x.session.check();
  await x.session.save();
  assert.equal(x.file.writes, 0);
  assert.equal(x.file.source, '# original');
});

test('overlapping polling calls coalesce into a single disk read', async () => {
  const x = setup();
  let reads = 0;
  const getFile = x.file.getFile.bind(x.file);
  x.file.getFile = async () => {
    reads++;
    return getFile();
  };
  await Promise.all([x.session.check(), x.session.check(), x.session.check()]);
  assert.equal(reads, 1);
});

test('500ms debounce saves only latest rapid edits and status waits for stream close', async () => {
  const x = setup();
  x.session.edit({ content: '# first' });
  await x.advance(400);
  assert.equal(x.file.writes, 0);
  x.session.edit({ content: '# latest' });
  await x.advance(499);
  assert.equal(x.file.writes, 0);
  x.file.afterWrite = async () => {
    assert.equal(x.session.status, 'saving');
    assert.equal(x.file.closed, 0);
  };
  await x.advance(1);
  assert.equal(x.file.closed, 1);
  assert.equal(x.session.status, 'clean');
  assert.equal(parseResumeFile(x.file.source).content, '# latest');
  assert.equal(x.getDraft(), undefined);
});

test('edits arriving during an in-flight write are not marked saved or lost', async () => {
  const x = setup();
  x.session.edit({ content: '# first' });
  x.file.afterWrite = async () => {
    x.file.afterWrite = undefined;
    x.session.edit({ content: '# second' });
  };
  await x.session.save();
  await x.session.preserve();
  assert.equal(parseResumeFile(x.file.source).content, '# first');
  assert.equal(x.session.dirty, true);
  assert.equal(x.getDraft()?.resume.content, '# second');
  await x.advance(500);
  assert.equal(parseResumeFile(x.file.source).content, '# second');
  assert.equal(x.session.status, 'clean');
});

test('clean external content and settings update the session without an echo write', async () => {
  const x = setup();
  const external = parseResumeFile('# external');
  external.settings.fontSize = 16;
  x.file.source = serializeResumeFile(external);
  await x.session.check();
  assert.equal(x.session.resume.content, '# external');
  assert.equal(x.session.resume.settings.fontSize, 16);
  await x.session.save();
  assert.equal(x.file.writes, 0);
});

test('save rechecks content even when a timestamp could be unchanged', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.save();
  assert.equal(x.session.status, 'conflict');
  assert.equal(x.file.writes, 0);
  assert.equal(x.session.resume.content, '# web');
  assert.equal(x.getDraft()?.resume.content, '# web');
});

test('external edits while stream is buffered abort rather than replacing disk', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.afterWrite = async () => {
    x.file.source = '# disk changed during write';
  };
  await x.session.save();
  assert.equal(x.file.aborted, 1);
  assert.equal(x.file.closed, 0);
  assert.equal(x.session.status, 'conflict');
});

test('using disk version keeps both recovery copies before clearing web draft', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.check();
  await x.session.resolve('disk');
  assert.equal(x.recoveries.length, 1);
  assert.equal(x.recoveries[0].disk, '# disk');
  assert.equal(parseResumeFile(x.recoveries[0].web).content, '# web');
  assert.equal(x.session.resume.content, '# disk');
  assert.equal(x.session.dirty, false);
  assert.equal(x.file.writes, 0);
});

test('using web version keeps both copies and writes the explicitly chosen version', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.check();
  await x.session.resolve('web');
  assert.equal(x.recoveries.length, 1);
  assert.equal(parseResumeFile(x.file.source).content, '# web');
  assert.equal(x.session.status, 'clean');
});

test('disk changing again while conflict choice is pending requires another choice', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.check();
  x.file.source = '# newer';
  await x.session.resolve('web');
  assert.equal(x.session.status, 'conflict');
  assert.equal(x.session.diskSource, '# newer');
  assert.equal(x.file.writes, 0);
});

test('deleted file, denied permission, and failed close preserve draft and pause autosave', async () => {
  for (const failure of ['deleted', 'denied', 'failClose'] as const) {
    const x = setup();
    x.session.edit({ content: '# recovery' });
    x.file[failure] = true;
    await x.session.save();
    assert.equal(x.session.status, 'error');
    assert.equal(x.session.dirty, true);
    assert.equal(x.getDraft()?.resume.content, '# recovery');
    assert.equal(x.file.closed, 0);
    x.session.edit({ content: '# additional edit' });
    await x.advance(1000);
    assert.equal(x.file.closed, 0);
    assert.equal(x.getDraft()?.resume.content, '# additional edit');
    x.file[failure] = false;
    await x.session.retry();
    assert.equal(x.session.status, 'clean');
  }
});

test('read-only tabs cannot edit, flush, or resolve a conflict', async () => {
  const x = setup();
  x.setWriter(false);
  x.session.edit({ content: '# forbidden' });
  await x.session.save();
  assert.equal(x.session.resume.content, '# original');
  assert.equal(x.file.writes, 0);
});

test('restored unsaved draft resumes saving only when disk baseline still matches', async () => {
  const x = setup();
  const draft: FileDraft = {
    workspace: 'workspace',
    path: x.session.path,
    baseSource: '# original',
    resume: parseResumeFile('# restored'),
  };
  x.session.restore(draft);
  await x.advance(500);
  assert.equal(parseResumeFile(x.file.source).content, '# restored');
  const y = setup();
  y.session.baseSource = '# disk changed';
  y.file.source = '# disk changed';
  y.session.restore(draft);
  await y.advance(500);
  assert.equal(y.session.status, 'conflict');
  assert.equal(y.file.writes, 0);
});

test('invalid external YAML retains last good editor state and disables writes', async () => {
  const x = setup();
  x.file.source = '---\nqingjian:\n  version: 77\n---\ninvalid';
  await x.session.check();
  assert.equal(x.session.status, 'error');
  assert.equal(x.session.resume.content, '# original');
  x.session.edit({ content: '# web' });
  await x.session.save();
  assert.equal(x.file.writes, 0);
});

test('disposing a session retains drafts and cancels scheduled disk writes', async () => {
  const x = setup();
  x.session.edit({ content: '# retained' });
  await x.session.dispose();
  await x.advance(500);
  assert.equal(x.file.writes, 0);
  assert.equal(x.getDraft()?.resume.content, '# retained');
});

test('a clean file being deleted also preserves the last good version for recovery', async () => {
  const x = setup();
  x.file.deleted = true;
  await x.session.check();
  assert.equal(x.session.status, 'error');
  assert.equal(x.getDraft()?.resume.content, '# original');
  assert.equal(x.session.dirty, true);
  assert.equal(x.file.writes, 0);
});

test('failed draft persistence prevents disk writes and explicitly reports backup failure', async () => {
  const x = setup({
    persist: async () => {
      throw new Error('quota exceeded');
    },
  });
  x.session.edit({ content: '# unsaved' });
  await x.session.save();
  assert.equal(x.session.status, 'error');
  assert.equal(x.file.writes, 0);
  assert.match(x.session.error, /草稿保存失败/);
  await assert.rejects(x.session.preserve(), /quota exceeded/);
});

test('failed conflict recovery storage never permits an overwrite', async () => {
  const x = setup({
    recover: async () => {
      throw new Error('backup storage unavailable');
    },
  });
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.check();
  await x.session.resolve('web');
  assert.equal(x.file.source, '# disk');
  assert.equal(x.file.writes, 0);
  assert.equal(x.session.status, 'error');
  assert.equal(x.getDraft()?.resume.content, '# web');
});

test('a readwrite lock lost while buffering aborts the stream and retains the draft', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.afterWrite = async () => {
    x.setWriter(false);
  };
  await x.session.save();
  assert.equal(x.file.closed, 0);
  assert.equal(x.file.aborted, 1);
  assert.equal(x.file.source, '# original');
  assert.equal(x.session.dirty, true);
});

test('a disk conflict returning to the baseline updates the version offered to the user', async () => {
  const x = setup();
  x.session.edit({ content: '# web' });
  x.file.source = '# disk';
  await x.session.check();
  x.file.source = '# original';
  await x.session.check();
  await x.session.resolve('disk');
  assert.equal(x.session.resume.content, '# original');
  assert.equal(x.session.status, 'clean');
});

function directory(
  name: string,
  children: (FileHandle | DirectoryHandle)[],
  broken = false
): DirectoryHandle {
  return {
    kind: 'directory',
    name,
    values: async function* () {
      if (broken) throw new Error('unreadable');
      yield* children;
    },
    isSameEntry: async (other) => other.name === name,
    queryPermission: async () => 'granted',
    requestPermission: async () => 'granted',
    getFileHandle: async (fileName, options) => {
      const found = children.find((f) => f.name === fileName);
      if (found?.kind === 'file') return found;
      if (!options?.create) throw new DOMException('Missing', 'NotFoundError');
      const file = new FakeFile();
      file.name = fileName;
      file.source = '';
      children.push(file);
      return file;
    },
  };
}

test('recursive enumeration keeps relative paths and skips unreadable subdirectories', async () => {
  const file = new FakeFile();
  const other = new FakeFile();
  other.name = 'other.markdown';
  const root = directory('root', [file, directory('分类', [other]), directory('坏目录', [], true)]);
  const result = await scanDirectory(root);
  assert.deepEqual(
    result.entries.map((e) => e.path).sort(),
    ['分类/other.markdown', '简历.md'].sort()
  );
  assert.equal(result.warnings.length, 1);
  await assert.rejects(scanDirectory(directory('root', [], true)), /unreadable/);
});

test('new files use safe unique names without replacing any existing file', async () => {
  const existing = new FakeFile();
  existing.name = 'test.md';
  const root = directory('root', [existing]);
  const entry = await writeNewFile(root, 'test', '# new');
  assert.equal(entry.path, 'test (2).md');
  assert.equal(existing.source, '# original');
  assert.equal(await (await entry.handle.getFile()).text(), '# new');
  assert.equal(safeFileName('../bad/name:..'), '..-bad-name-');
});
