import { useEffect, useState } from 'react';
import { fonts, type Settings } from './data';

export default function TypographyControls({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const [lineValue, setLineValue] = useState(String(settings.lineHeight));
  useEffect(() => setLineValue(String(settings.lineHeight)), [settings.lineHeight]);
  const font = fonts.find((x) => x.id === settings.font) || fonts[0];
  const commitLineValue = () => {
    const number = Number(lineValue);
    const value =
      lineValue && Number.isFinite(number)
        ? Math.round(Math.max(1, Math.min(2.5, number)) * 100) / 100
        : settings.lineHeight;
    onChange({ lineHeight: value });
    setLineValue(String(value));
  };
  return (
    <>
      <div className="setting-group">
        <label htmlFor="font">简历字体</label>
        <select
          id="font"
          value={settings.font}
          onChange={(e) => onChange({ font: e.target.value as Settings['font'] })}
        >
          {fonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </select>
        <div className="font-example" style={{ fontFamily: font.family }}>
          用清晰的表达，展现你的专业。<span>Resume · 0123456789</span>
        </div>
        <p className="setting-hint">使用系统字体，未安装时自动使用相近字体。</p>
      </div>
      <div className="setting-group">
        <label htmlFor="lineHeight">
          正文行距<span>{settings.lineHeight.toFixed(2)} 倍</span>
        </label>
        <div className="range-with-number">
          <input
            id="lineHeight"
            aria-label="正文行距"
            type="range"
            min={1}
            max={2.5}
            step={0.05}
            value={settings.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
          />
          <input
            aria-label="行距数值"
            type="number"
            min={1}
            max={2.5}
            step={0.05}
            value={lineValue}
            onChange={(e) => {
              setLineValue(e.target.value);
              const value = Number(e.target.value);
              if (e.target.value && value >= 1 && value <= 2.5) onChange({ lineHeight: value });
            }}
            onBlur={commitLineValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </div>
        <div className="segmented-options">
          {[
            { label: '紧凑', value: 1.4 },
            { label: '舒适', value: 1.7 },
            { label: '宽松', value: 2 },
          ].map((preset) => (
            <button
              key={preset.value}
              aria-pressed={settings.lineHeight === preset.value}
              className={settings.lineHeight === preset.value ? 'selected' : ''}
              onClick={() => onChange({ lineHeight: preset.value })}
            >
              {preset.label}
              <small>{preset.value.toFixed(1)}</small>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
