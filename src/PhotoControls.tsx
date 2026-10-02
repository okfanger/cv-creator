import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Upload, UserRound } from 'lucide-react';
import { photoDefaults, type ResumePhoto } from './data';
import { readPhoto } from './photo';

export default function PhotoControls({
  photo,
  onChange,
  onToast,
}: {
  photo: ResumePhoto | undefined;
  onChange: (photo: ResumePhoto) => void;
  onToast: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const update = (patch: Partial<ResumePhoto>) => {
    if (photo) onChange({ ...photo, ...patch });
  };
  const upload = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const source = await readPhoto(file);
      onChange({
        ...photoDefaults,
        ...(photo || {}),
        source,
        name: file.name,
        enabled: true,
        zoom: 1,
        x: 50,
        y: 50,
      });
      onToast('证件照已添加，可继续调整取景');
    } catch (error) {
      setError(error instanceof Error ? error.message : '照片处理失败，请重试');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="photo-settings" aria-label="证件照设置">
      <div className="photo-settings-heading">
        <div>
          <UserRound size={17} />
          <strong>证件照</strong>
        </div>
        {photo && (
          <button
            className={`switch ${photo.enabled ? 'on' : ''}`}
            role="switch"
            aria-checked={photo.enabled}
            aria-label="显示证件照"
            onClick={() => update({ enabled: !photo.enabled })}
          >
            <span />
          </button>
        )}
      </div>
      <button
        className={`photo-upload ${dragging ? 'dragging' : ''}`}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files[0]);
        }}
        aria-label={photo ? '更换证件照' : '上传证件照'}
      >
        {photo ? (
          <img src={photo.source} alt="已上传的证件照" />
        ) : (
          <span className="photo-upload-icon">
            <ImagePlus size={25} />
          </span>
        )}
        <span>
          <strong>{busy ? '正在处理照片…' : photo ? '更换证件照' : '上传或拖入证件照'}</strong>
          <small>{photo ? photo.name : 'JPG / PNG / WebP · 最大 10 MB'}</small>
        </span>
        <Upload size={16} />
      </button>
      <input
        ref={input}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && (
        <p className="photo-error" role="alert">
          {error}
        </p>
      )}
      {photo && (
        <>
          {!photo.enabled && (
            <p className="setting-hint">照片已隐藏。开启右上角开关即可重新显示。</p>
          )}
          <div className="photo-control">
            <span className="control-label">照片位置</span>
            <div className="segmented-options">
              {[
                { id: 'left' as const, name: '左上角' },
                { id: 'right' as const, name: '右上角' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={photo.position === item.id ? 'selected' : ''}
                  aria-pressed={photo.position === item.id}
                  onClick={() => update({ position: item.id })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="photo-control">
            <span className="control-label">照片形状</span>
            <div className="segmented-options">
              {[
                { id: 'portrait' as const, name: '竖版 3:4' },
                { id: 'square' as const, name: '方形' },
                { id: 'circle' as const, name: '圆形' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={photo.shape === item.id ? 'selected' : ''}
                  aria-pressed={photo.shape === item.id}
                  onClick={() => update({ shape: item.id })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="photo-crop-preview">
            <div
              className={`resume-photo-frame photo-shape-${photo.shape}`}
              style={{ width: 84, height: photo.shape === 'portrait' ? 112 : 84 }}
            >
              <img
                src={photo.source}
                alt="证件照取景预览"
                style={{
                  objectPosition: `${photo.x}% ${photo.y}%`,
                  transformOrigin: `${photo.x}% ${photo.y}%`,
                  transform: `scale(${photo.zoom})`,
                }}
              />
            </div>
            <div>
              <strong>取景预览</strong>
              <p>缩放照片，调整人物的位置。</p>
              <button onClick={() => update({ zoom: 1, x: 50, y: 50 })}>
                <RefreshCw size={12} />
                还原取景
              </button>
            </div>
          </div>
          {(
            [
              { key: 'width', name: '照片宽度', min: 64, max: 144, step: 4, suffix: 'px' },
              { key: 'zoom', name: '照片缩放', min: 1, max: 3, step: 0.05, suffix: '倍' },
              { key: 'x', name: '水平取景', min: 0, max: 100, step: 1, suffix: '%' },
              { key: 'y', name: '垂直取景', min: 0, max: 100, step: 1, suffix: '%' },
            ] as const
          ).map((control) => (
            <div className="setting-group photo-control" key={control.key}>
              <label htmlFor={`photo-${control.key}`}>
                {control.name}
                <span>
                  {control.key === 'zoom' ? photo[control.key].toFixed(2) : photo[control.key]}{' '}
                  {control.suffix}
                </span>
              </label>
              <input
                id={`photo-${control.key}`}
                aria-label={control.name}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={photo[control.key]}
                onChange={(e) => update({ [control.key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </>
      )}
      <p className="setting-hint photo-privacy">
        照片仅在此浏览器处理与保存，打印 PDF 会包含照片。
      </p>
    </section>
  );
}
