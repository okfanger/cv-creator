import { useEffect, useState } from 'react';
import { fonts, type Settings } from './data';

const densityPresets = [
  { label: '紧凑', lineHeight: 1.4, bodySpacing: 0.5 },
  { label: '舒适', lineHeight: 1.7, bodySpacing: 1 },
  { label: '宽松', lineHeight: 2, bodySpacing: 1.5 },
] as const;

function RangeGroup({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const number = Number(text);
    const next =
      text && Number.isFinite(number)
        ? Math.round(Math.max(min, Math.min(max, number)) * 100) / 100
        : value;
    onChange(next);
    setText(String(next));
  };
  return (
    <>
      <label htmlFor={id}>
        {label}
        <span>{value.toFixed(2)} 倍</span>
      </label>
      <div className="range-with-number">
        <input
          id={id}
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          aria-label={`${label}数值`}
          type="number"
          min={min}
          max={max}
          step={0.05}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const number = Number(e.target.value);
            if (e.target.value && number >= min && number <= max) onChange(number);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </div>
    </>
  );
}

export default function TypographyControls({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const font = fonts.find((x) => x.id === settings.font) || fonts[0];
  const activePreset = densityPresets.find(
    (preset) =>
      settings.lineHeight === preset.lineHeight && settings.bodySpacing === preset.bodySpacing
  );
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
        <RangeGroup
          id="lineHeight"
          label="正文行距"
          value={settings.lineHeight}
          min={1}
          max={2.5}
          onChange={(lineHeight) => onChange({ lineHeight })}
        />
        <div className="segmented-options">
          {densityPresets.map((preset) => (
            <button
              key={preset.label}
              aria-pressed={activePreset === preset}
              className={activePreset === preset ? 'selected' : ''}
              onClick={() =>
                onChange({ lineHeight: preset.lineHeight, bodySpacing: preset.bodySpacing })
              }
            >
              {preset.label}
              <small>{preset.lineHeight.toFixed(1)}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="setting-group">
        <RangeGroup
          id="bodySpacing"
          label="正文间距"
          value={settings.bodySpacing}
          min={0}
          max={2}
          onChange={(bodySpacing) => onChange({ bodySpacing })}
        />
        <p className="setting-hint">
          按默认间距的倍数缩放正文段落与列表空白；上方预设会同时调整行距和本项。
        </p>
      </div>
    </>
  );
}
