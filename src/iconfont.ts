import DOMPurify from 'dompurify';
import type { IconMap, IconLibrary } from './icons';

// Iconfont's Symbol download embeds a literal SVG sprite in JavaScript.
// Extract that data only: uploaded JavaScript is never executed.
export function extractSvg(source: string): string {
  if (source.length > 2_000_000) throw new Error('图标集不能超过 2 MB。');
  const start = source.indexOf('<svg');
  const end = source.indexOf('</svg>', start);
  if (start < 0 || end < start)
    throw new Error('未找到 SVG 图标。请导入 Iconfont 的 iconfont.js 或 SVG 文件。');
  return source.slice(start, end + 6).replace(/\\(["'\\])/g, '$1');
}
const tags = [
  'svg',
  'symbol',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'title',
];
const attrs = [
  'id',
  'viewBox',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'points',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'clip-rule',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'transform',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  'clip-path',
  'mask',
];
export function parseIconfont(source: string): { source: string; icons: IconMap } {
  const clean = DOMPurify.sanitize(extractSvg(source), {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: attrs,
    ALLOW_DATA_ATTR: false,
  });
  const document = new DOMParser().parseFromString(clean, 'image/svg+xml');
  if (document.querySelector('parsererror')) throw new Error('SVG 格式无效，请重新下载图标集。');
  const root = document.documentElement;
  if (root.localName !== 'svg') throw new Error('SVG 格式无效。');
  // Paint servers may refer to local gradients only, never remote resources.
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attr of [...element.attributes]) {
      if (/url\s*\(/i.test(attr.value) && !/^url\(#[\w-]+\)$/.test(attr.value))
        element.removeAttribute(attr.name);
    }
  }
  const symbols = [...root.querySelectorAll('symbol')];
  const candidates = symbols.length ? symbols : [root];
  if (candidates.length > 300) throw new Error('图标集最多支持 300 个图标，请拆分后导入。');
  const icons: IconMap = Object.create(null);
  for (const [index, element] of candidates.entries()) {
    const id = element.getAttribute('id') || (symbols.length ? '' : 'custom');
    if (!/^[a-zA-Z][\w-]*$/.test(id)) continue;
    const viewBox =
      element.getAttribute('viewBox') || root.getAttribute('viewBox') || '0 0 1024 1024';
    if (
      !/^\s*-?\d+(?:\.\d+)?[ ,]+-?\d+(?:\.\d+)?[ ,]+\d+(?:\.\d+)?[ ,]+\d+(?:\.\d+)?\s*$/.test(
        viewBox
      )
    )
      continue;
    if (
      viewBox
        .trim()
        .split(/[ ,]+/)
        .slice(2)
        .some((value) => Number(value) <= 0)
    )
      continue;
    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const presentation = [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'fill-rule',
      'clip-rule',
      'opacity',
      'fill-opacity',
      'stroke-opacity',
      'clip-path',
      'mask',
      'transform',
    ];
    for (const name of presentation) {
      const value = root.getAttribute(name);
      if (value !== null) clone.setAttribute(name, value);
    }
    if (symbols.length) {
      for (const defs of [...root.children].filter((node) => node.localName === 'defs'))
        clone.appendChild(defs.cloneNode(true));
    }
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (symbols.length)
      for (const name of presentation) {
        const value = element.getAttribute(name);
        if (value !== null) group.setAttribute(name, value);
      }
    for (const node of element.childNodes) group.appendChild(node.cloneNode(true));
    clone.appendChild(group);
    // Namespace gradient/clip ids so different imported icons cannot collide.
    for (const node of clone.querySelectorAll('[id]')) {
      const old = node.id;
      const next = `cv-${index}-${id}-${old}`;
      node.id = next;
      for (const item of [clone, ...clone.querySelectorAll('*')]) {
        for (const attr of [...item.attributes])
          if (attr.value === `url(#${old})`) item.setAttribute(attr.name, `url(#${next})`);
      }
    }
    const serializer = new XMLSerializer();
    const body = serializer.serializeToString(clone);
    if (!clone.querySelector('path,rect,circle,ellipse,line,polyline,polygon')) continue;
    icons[id.replace(/^icon-/, '')] = { viewBox, body };
  }
  if (!Object.keys(icons).length)
    throw new Error('图标集没有可用的图形，请使用 Symbol 格式或单个 SVG。');
  return { source: new XMLSerializer().serializeToString(root), icons };
}
export function libraryIcons(library?: IconLibrary): IconMap {
  if (!library || typeof library.source !== 'string') return {};
  try {
    return parseIconfont(library.source).icons;
  } catch {
    return {};
  }
}
