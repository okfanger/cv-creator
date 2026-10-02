import { isMap, parseDocument, Document } from 'yaml';
import { createResume, defaults, templateIds, type Resume, type Settings } from './data';
import { headingFields, headingLevels, normalizeHeadings } from './headings';
import { normalizePhoto } from './photo';
import type { IconLibrary } from './icons';

export const MAX_RESUME_BYTES = 16 * 1024 * 1024;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const fail = (message: string): never => {
  throw new Error(message);
};

export function checkFileSize(source: string | File) {
  const size = typeof source === 'string' ? new TextEncoder().encode(source).length : source.size;
  if (size > MAX_RESUME_BYTES) fail('简历文件不能超过 16 MiB');
}

function yamlDocument(header: string) {
  const doc = parseDocument(header, { version: '1.2', uniqueKeys: true, stringKeys: true });
  if (doc.errors.length) fail(`YAML 配置无效：${doc.errors[0].message}`);
  if (doc.contents !== null && !isMap(doc.contents)) fail('YAML 配置必须是键值映射');
  return doc;
}

function settingsFrom(value: unknown): Settings {
  if (value === undefined) return { ...defaults, headings: normalizeHeadings(undefined) };
  if (!record(value)) fail('qingjian.settings 必须是键值映射');
  const s = value as Record<string, unknown>;
  for (const [key, values] of [
    ['template', templateIds],
    ['font', ['sans', 'serif', 'heiti', 'kaiti', 'mono']],
  ] as const) {
    if (s[key] !== undefined && !values.includes(s[key] as never)) fail(`无效的 ${key} 配置`);
  }
  if (s.color !== undefined && (typeof s.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(s.color)))
    fail('主题颜色必须是六位十六进制颜色');
  if (s.onePage !== undefined && typeof s.onePage !== 'boolean') fail('onePage 必须是布尔值');
  for (const [key, min, max] of [
    ['fontSize', 10, 18],
    ['lineHeight', 1, 2.5],
    ['margin', 24, 72],
  ] as const) {
    if (
      s[key] !== undefined &&
      (typeof s[key] !== 'number' || !Number.isFinite(s[key]) || s[key] < min || s[key] > max)
    )
      fail(`${key} 必须在 ${min}–${max} 范围内`);
  }
  if (s.headings !== undefined) {
    if (!record(s.headings)) fail('headings 必须是键值映射');
    for (const level of headingLevels) {
      const h = (s.headings as Record<string, unknown>)[level];
      if (h === undefined) continue;
      if (!record(h)) fail(`${level} 必须是键值映射`);
      for (const field of headingFields) {
        const v = (h as Record<string, unknown>)[field.key];
        if (
          v !== undefined &&
          (typeof v !== 'number' || !Number.isFinite(v) || v < field.min || v > field.max)
        )
          fail(`${level}.${field.key} 超出有效范围`);
      }
    }
  }
  // Only known keys enter application state; unknown keys remain in the YAML document.
  const known = Object.fromEntries(
    Object.keys(defaults)
      .filter((k) => k !== 'headings' && s[k] !== undefined)
      .map((k) => [k, s[k]])
  );
  return { ...defaults, ...known, headings: normalizeHeadings(s.headings) };
}

export function parseResumeFile(
  source: string,
  title = '未命名简历',
  id?: string,
  cleanIcons?: (source: string) => string
): Resume {
  checkFileSize(source);
  const item = createResume(title);
  if (id) item.id = id;
  item.content = source.replace(/^\uFEFF/, '');
  const start = /^(?:\uFEFF)?---[ \t]*\r?\n/.exec(source);
  if (!start) return item;
  const remaining = source.slice(start[0].length);
  const end = /^---[ \t]*(?:\r?\n|$)/m.exec(remaining);
  if (!end) fail('YAML 头部缺少结束分隔符 ---，请先修复文件');
  item.frontmatter = remaining.slice(0, end!.index);
  item.content = remaining.slice(end!.index + end![0].length);
  const doc = yamlDocument(item.frontmatter);
  const root: unknown = doc.toJS({ maxAliasCount: 50 });
  const meta = record(root) ? root.qingjian : undefined;
  if (meta === undefined) return item;
  if (!record(meta)) fail('qingjian 必须是键值映射');
  const q = meta as Record<string, unknown>;
  if (q.version !== 1) fail('不支持的 qingjian.version；当前支持版本 1');
  if (q.title !== undefined && typeof q.title !== 'string') fail('qingjian.title 必须是文字');
  item.title = typeof q.title === 'string' ? q.title : title;
  item.settings = settingsFrom(q.settings);
  if (q.photo !== undefined) {
    if (!record(q.photo) || !normalizePhoto(q.photo))
      fail('照片配置无效，请使用内嵌 JPG、PNG 或 WebP 数据');
    const photo = q.photo as Record<string, unknown>;
    for (const key of ['width', 'zoom', 'x', 'y'])
      if (
        photo[key] !== undefined &&
        (typeof photo[key] !== 'number' || !Number.isFinite(photo[key]))
      )
        fail(`照片 ${key} 必须是有限数值`);
    if (photo.enabled !== undefined && typeof photo.enabled !== 'boolean')
      fail('照片 enabled 必须是布尔值');
    if (photo.position !== undefined && !['left', 'right'].includes(String(photo.position)))
      fail('照片 position 无效');
    if (
      photo.shape !== undefined &&
      !['portrait', 'square', 'circle'].includes(String(photo.shape))
    )
      fail('照片 shape 无效');
    item.photo = normalizePhoto(q.photo);
  }
  if (q.iconLibrary !== undefined) {
    if (!record(q.iconLibrary)) fail('iconLibrary 必须是键值映射');
    const lib = q.iconLibrary as Record<string, unknown>;
    if (
      typeof lib.name !== 'string' ||
      typeof lib.source !== 'string' ||
      lib.source.length > 2_000_000 ||
      !lib.source.trim().startsWith('<svg')
    )
      fail('图标配置无效，请使用不超过 2 MB 的 SVG 图标集');
    item.iconLibrary = {
      name: lib.name as string,
      source: cleanIcons ? cleanIcons(lib.source as string) : (lib.source as string),
    };
  }
  return item;
}

// Update leaves rather than replacing maps so other tools' keys and comments survive.
function merge(doc: Document, path: string[], value: Record<string, unknown>) {
  if (!isMap(doc.getIn(path, true))) doc.setIn(path, doc.createNode({}));
  for (const [key, child] of Object.entries(value)) {
    if (record(child)) merge(doc, [...path, key], child);
    else doc.setIn([...path, key], child);
  }
}

export function serializeResumeFile(item: Resume, cleanIcons?: (source: string) => string): string {
  const doc = item.frontmatter === undefined ? new Document({}) : yamlDocument(item.frontmatter);
  const existing = doc.get('qingjian');
  if (existing !== undefined && !isMap(existing)) fail('qingjian 必须是键值映射');
  if (existing !== undefined && doc.getIn(['qingjian', 'version']) !== 1)
    fail('不支持的 qingjian.version');
  // Validate known values before writing any file.
  settingsFrom(item.settings);
  merge(doc, ['qingjian'], { version: 1, title: item.title, settings: item.settings });
  for (const key of ['photo', 'iconLibrary'] as const) {
    const value = item[key];
    if (!value) doc.deleteIn(['qingjian', key]);
    else {
      const saved =
        key === 'iconLibrary' && cleanIcons
          ? { ...value, source: cleanIcons((value as IconLibrary).source) }
          : value;
      merge(doc, ['qingjian', key], saved as unknown as Record<string, unknown>);
    }
  }
  const source = `---\n${doc.toString({ lineWidth: 0 })}---\n${item.content}`;
  checkFileSize(source);
  return source;
}
