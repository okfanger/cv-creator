import test from 'node:test';
import assert from 'node:assert/strict';
import { createResume } from '../src/data';
import {
  checkFileSize,
  MAX_RESUME_BYTES,
  parseResumeFile,
  serializeResumeFile,
} from '../src/resumeFile';

test('complete Markdown roundtrip keeps body, layout, photo, and icons in one file', () => {
  const resume = createResume('完整简历');
  resume.content = '# 姓名\n\n::: left\n经历\n:::\n';
  resume.settings.headings.h2.before = 0;
  resume.photo = {
    source: 'data:image/jpeg;base64,YWJj',
    name: '照片.jpg',
    enabled: false,
    position: 'right',
    shape: 'circle',
    width: 96,
    zoom: 1,
    x: 50,
    y: 50,
  };
  resume.iconLibrary = {
    name: '本地图标',
    source: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h2v2z"/></svg>',
  };
  const source = serializeResumeFile(resume);
  const restored = parseResumeFile(source);
  assert.equal(restored.title, resume.title);
  assert.equal(restored.content, resume.content);
  assert.deepEqual(restored.settings, resume.settings);
  assert.deepEqual(restored.photo, resume.photo);
  assert.deepEqual(restored.iconLibrary, resume.iconLibrary);
  assert.equal(serializeResumeFile(restored), source);
});

test('ordinary Markdown stays untouched until first edited save adds metadata', () => {
  const source = '# 姓名\r\n\r\n内容';
  const resume = parseResumeFile(source, '文件名', 'stable-id');
  assert.equal(resume.id, 'stable-id');
  assert.equal(resume.title, '文件名');
  assert.equal(resume.frontmatter, undefined);
  assert.equal(resume.content, source);
  assert.equal(parseResumeFile(serializeResumeFile(resume)).content, source);
});

test('unrelated YAML fields and nested unknown settings and comments survive edits', () => {
  const source =
    '---\n# 用户注释\ndescription: 外部工具\nqingjian:\n  version: 1\n  # 名称注释\n  title: 旧名\n  extra: 保留\n  settings:\n    custom: 42\n    headings:\n      h2:\n        custom: 标题字段\n---\n# 姓名\n';
  const resume = parseResumeFile(source);
  resume.title = '新名';
  resume.settings.fontSize = 14;
  const saved = serializeResumeFile(resume);
  for (const text of [
    '# 用户注释',
    '# 名称注释',
    'description: 外部工具',
    'extra: 保留',
    'custom: 42',
    'custom: 标题字段',
  ])
    assert.ok(saved.includes(text), text);
  assert.equal(parseResumeFile(saved).title, '新名');
  assert.equal(parseResumeFile(saved).settings.fontSize, 14);
});

test('BOM and CRLF YAML are read without rendering the header', () => {
  const resume = parseResumeFile('\uFEFF---\r\nother: yes\r\n---\r\n# 姓名\r\n');
  assert.equal(resume.content, '# 姓名\r\n');
  assert.ok(serializeResumeFile(resume).includes('other: yes'));
});

test('frontmatter is recognized only at the beginning, not in code or later rules', () => {
  const source = '# 姓名\n---\n```yaml\nqingjian: broken\n```';
  assert.equal(parseResumeFile(source).content, source);
});

test('bad YAML, duplicate keys, future versions, and invalid structures block writing', () => {
  for (const header of [
    'qingjian: [broken',
    'x: 1\nx: 2',
    '- sequence',
    'qingjian: text',
    'qingjian:\n  version: 2',
    'qingjian:\n  version: 1\n  settings: false',
    'qingjian:\n  version: 1\n  settings:\n    template: unknown',
    'qingjian:\n  version: 1\n  settings:\n    lineHeight: .nan',
    'qingjian:\n  version: 1\n  settings:\n    headings:\n      h2: nope',
    'qingjian:\n  version: 1\n  photo:\n    source: https://example.com/photo.jpg',
    'qingjian:\n  version: 1\n  iconLibrary:\n    source: javascript:bad',
  ])
    assert.throws(() => parseResumeFile(`---\n${header}\n---\nbody`), header);
  assert.throws(() => parseResumeFile('---\nqingjian: broken'), /缺少结束/);
  const invalid = createResume();
  invalid.frontmatter = 'qingjian:\n  version: 99\n';
  assert.throws(() => serializeResumeFile(invalid), /version/);
});

test('empty header and partial valid settings gain defaults', () => {
  assert.equal(parseResumeFile('---\n---\nbody').content, 'body');
  const resume = parseResumeFile(
    '---\nqingjian:\n  version: 1\n  settings:\n    fontSize: 15\n---\nbody'
  );
  assert.equal(resume.settings.fontSize, 15);
  assert.equal(resume.settings.template, 'minimal');
  assert.ok(serializeResumeFile(parseResumeFile('---\n---\nbody')).includes('version: 1'));
});

test('removing photo and icon config does not remove unrelated YAML', () => {
  const resume = createResume();
  resume.frontmatter =
    'other: value\nqingjian:\n  version: 1\n  photo: obsolete\n  iconLibrary: obsolete\n';
  const source = serializeResumeFile(resume);
  assert.ok(source.includes('other: value'));
  assert.ok(!source.includes('obsolete'));
});

test('UTF-8 byte limits apply to imports and serialized complete resumes', () => {
  assert.doesNotThrow(() => checkFileSize('a'.repeat(MAX_RESUME_BYTES)));
  assert.throws(() => checkFileSize('汉'.repeat(Math.ceil(MAX_RESUME_BYTES / 3))), /16 MiB/);
  assert.throws(
    () => checkFileSize(new File([new Uint8Array(MAX_RESUME_BYTES + 1)], 'big.md')),
    /16 MiB/
  );
  const resume = createResume();
  resume.content = 'a'.repeat(MAX_RESUME_BYTES);
  assert.throws(() => serializeResumeFile(resume), /16 MiB/);
});

test('icon sanitizer runs during import and export without executing file code', () => {
  const resume = createResume();
  resume.iconLibrary = { name: '图标', source: '<svg><script>bad()</script><path/></svg>' };
  const clean = (source: string) => source.replace('<script>bad()</script>', '');
  const source = serializeResumeFile(resume, clean);
  assert.ok(!source.includes('bad()'));
  assert.equal(
    parseResumeFile(source, '名称', undefined, clean).iconLibrary?.source,
    '<svg><path/></svg>'
  );
});
