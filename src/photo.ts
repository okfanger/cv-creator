import { photoDefaults, type ResumePhoto } from './data';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;

export function normalizePhoto(value: unknown): ResumePhoto | undefined {
  if (!value || typeof value !== 'object') return;
  const photo = value as Partial<ResumePhoto>;
  if (
    typeof photo.source !== 'string' ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo.source)
  )
    return;
  return {
    source: photo.source,
    name: typeof photo.name === 'string' ? photo.name : '证件照',
    enabled: photo.enabled !== false,
    position: photo.position === 'left' ? 'left' : 'right',
    shape: photo.shape === 'square' || photo.shape === 'circle' ? photo.shape : 'portrait',
    width: clamp(photo.width, 64, 144, photoDefaults.width),
    zoom: clamp(photo.zoom, 1, 3, photoDefaults.zoom),
    x: clamp(photo.x, 0, 100, 50),
    y: clamp(photo.y, 0, 100, 50),
  };
}

export async function readPhoto(file: File): Promise<string> {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 格式的照片');
  if (file.size > 10 * 1024 * 1024) throw new Error('照片不能超过 10 MB');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('照片无法读取');
    const ratio = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理照片');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (error) {
    if (error instanceof Error && error.message === '当前浏览器无法处理照片') throw error;
    throw new Error('照片读取失败，请选择有效的图片文件');
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Group the opening identity/contact blocks with the photo so the actual photo
// height participates in pagination. Later pages never repeat the photo.
export function withPhotoHeader(html: string, photo: ResumePhoto | undefined): string {
  const valid = normalizePhoto(photo);
  if (!valid?.enabled) return html;
  const container = document.createElement('div');
  container.innerHTML = html;
  const header = document.createElement('section');
  header.className = `resume-photo-header photo-${valid.position}`;
  const copy = document.createElement('div');
  copy.className = 'resume-header-copy';
  while (
    container.firstElementChild &&
    !/^H[2-6]$/.test(container.firstElementChild.tagName) &&
    !container.firstElementChild.hasAttribute('data-page-break')
  ) {
    copy.appendChild(container.firstElementChild);
  }
  const frame = document.createElement('div');
  frame.className = `resume-photo-frame photo-shape-${valid.shape}`;
  frame.style.width = `${valid.width}px`;
  frame.style.height = `${valid.shape === 'portrait' ? (valid.width * 4) / 3 : valid.width}px`;
  const image = document.createElement('img');
  image.src = valid.source;
  image.alt = '证件照';
  image.style.objectPosition = `${valid.x}% ${valid.y}%`;
  image.style.transformOrigin = `${valid.x}% ${valid.y}%`;
  image.style.transform = `scale(${valid.zoom})`;
  frame.appendChild(image);
  header.append(copy, frame);
  container.prepend(header);
  return container.innerHTML;
}
