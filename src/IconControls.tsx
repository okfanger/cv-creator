import { useMemo, useRef, useState } from 'react';
import { builtinIcons, iconMarkup, type IconLibrary } from './icons';
import { libraryIcons, parseIconfont } from './iconfont';

export default function IconControls({
  library,
  onChange,
  onInsert,
}: {
  library?: IconLibrary;
  onChange: (library?: IconLibrary) => void;
  onInsert: (syntax: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const custom = useMemo(() => libraryIcons(library), [library]);
  const upload = async (file?: File) => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      if (file.size > 2_000_000) throw new Error('图标集不能超过 2 MB。');
      const parsed = parseIconfont(await file.text());
      onChange({ name: file.name, source: parsed.source });
    } catch (e) {
      setError(e instanceof Error ? e.message : '图标集导入失败');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="setting-group" aria-label="简历图标设置">
      <label>简历图标</label>
      <p className="setting-hint">
        使用 <code>icon:mail</code> 等语法。点击图标插入到源码光标处。
      </p>
      <button className="icon-import-button" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? '正在导入…' : '导入 Iconfont 图标集'}
      </button>
      <input
        ref={input}
        type="file"
        className="hidden"
        accept=".js,.svg"
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <p className="setting-hint">
        在 Iconfont 项目中选择「下载至本地」，导入 iconfont.js（Symbol 格式）；也支持 SVG 文件，最大
        2 MB。图标随当前简历保存在本机。
      </p>
      {error && (
        <p className="icon-error" role="alert">
          {error}
        </p>
      )}
      {library && (
        <div className="heading-actions">
          <span className="setting-hint">
            {library.name} · {Object.keys(custom).length} 个
          </span>
          <button onClick={() => onChange(undefined)}>移除图标集</button>
        </div>
      )}
      <div className="icon-catalog" aria-label="可用图标">
        {Object.entries({ ...builtinIcons, ...custom }).map(([name, icon]) => (
          <button
            key={name}
            title={`插入 icon:${name}`}
            aria-label={`插入 icon:${name}`}
            onClick={() => onInsert(`icon:${name}`)}
          >
            <span dangerouslySetInnerHTML={{ __html: iconMarkup(icon) }} />
            {name}
          </button>
        ))}
      </div>
      <p className="setting-hint">
        未知名称保留原文。自定义图标同名时优先使用；单个无名称 SVG 使用 icon:custom。
      </p>
    </section>
  );
}
