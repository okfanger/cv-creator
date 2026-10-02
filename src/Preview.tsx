import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import { renderMarkdown } from './markdown';
import { fonts, type Settings, type ResumePhoto } from './data';
import { paginate, type Page } from './pagination';
import { withPhotoHeader } from './photo';
import { headingVariables } from './headings';
import { libraryIcons } from './iconfont';
import type { IconLibrary } from './icons';

export default function Preview({
  content,
  settings,
  photo,
  iconLibrary,
  zoom,
  onPageCount,
}: {
  content: string;
  settings: Settings;
  photo?: ResumePhoto;
  iconLibrary?: IconLibrary;
  zoom: number;
  onPageCount: (count: number) => void;
}) {
  const measure = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Page[]>([{ html: '', scale: 1 }]);
  const icons = useMemo(() => libraryIcons(iconLibrary), [iconLibrary]);
  const html = useMemo(
    () => withPhotoHeader(DOMPurify.sanitize(renderMarkdown(content, icons)), photo),
    [content, photo, icons]
  );
  const style = {
    ...headingVariables(settings.headings),
    '--resume-color': settings.color,
    '--resume-font-size': `${settings.fontSize}px`,
    '--resume-line-height': settings.lineHeight,
    '--resume-margin': `${settings.margin}px`,
    fontFamily: (fonts.find((font) => font.id === settings.font) || fonts[0]).family,
  } as CSSProperties;
  useLayoutEffect(() => {
    const node = measure.current;
    if (!node) return;
    const result = paginate(node, 1123 - settings.margin * 2, settings.onePage);
    setPages(result);
    onPageCount(result.length);
  }, [html, settings, onPageCount]);

  return (
    <>
      <div
        className={`resume-measure resume-content template-${settings.template}`}
        style={style}
        ref={measure}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="paper-stack" aria-label="简历预览">
        {pages.map((page, i) => (
          <div className="paper-wrapper" key={i} style={{ width: 794 * zoom, height: 1123 * zoom }}>
            <article
              className={`paper template-${settings.template}`}
              style={{ ...style, transform: `scale(${zoom})` }}
              aria-label={`简历第 ${i + 1} 页`}
            >
              <div className="paper-accent" />
              <div
                className="resume-content"
                style={{
                  transform: page.scale < 1 ? `scale(${page.scale})` : undefined,
                  width: page.scale < 1 ? `${100 / page.scale}%` : undefined,
                  transformOrigin: 'top left',
                }}
                dangerouslySetInnerHTML={{ __html: page.html }}
              />
              <div className="page-number">{String(i + 1).padStart(2, '0')}</div>
            </article>
          </div>
        ))}
      </div>
    </>
  );
}
