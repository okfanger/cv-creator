import { useEffect, useState } from 'react';
import type { Settings } from './data';
import {
  compactHeadings,
  defaultHeadings,
  headingFields,
  headingLevels,
  normalizeHeadings,
  type HeadingLevel,
} from './headings';

function HeadingNumber({
  value,
  min,
  max,
  step,
  label,
  id,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  id: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const number = Number(draft);
    const next = draft && Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : value;
    onChange(next);
    setDraft(String(next));
  };
  return (
    <input
      id={id}
      aria-label={label}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const next = Number(e.target.value);
        if (e.target.value && Number.isFinite(next) && next >= min && next <= max) onChange(next);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

export default function HeadingControls({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const [level, setLevel] = useState<HeadingLevel>('h2');
  const headings = normalizeHeadings(settings.headings);
  const format = headings[level];
  return (
    <div className="setting-group heading-settings">
      <label>标题格式</label>
      <p className="setting-hint">每个级别独立设置；间距与装饰留白均可设为 0。</p>
      <div className="heading-tabs" role="group" aria-label="标题级别">
        {headingLevels.map((h) => (
          <button
            key={h}
            aria-pressed={level === h}
            className={level === h ? 'selected' : ''}
            onClick={() => setLevel(h)}
          >
            {h.toUpperCase()}
          </button>
        ))}
      </div>
      <div
        className="heading-live-example"
        style={{ fontSize: format.fontSize, lineHeight: format.lineHeight }}
      >
        {level === 'h1' ? '林知夏' : '工作经历'}
        <small>
          {level.toUpperCase()} · {'#'.repeat(Number(level[1]))}
        </small>
      </div>
      {headingFields.map((field) => (
        <div className="heading-field" key={`${level}-${field.key}`}>
          <label htmlFor={`heading-${field.key}`}>
            {field.label}
            <span>{field.unit}</span>
          </label>
          <HeadingNumber
            id={`heading-${field.key}`}
            label={`${level.toUpperCase()} ${field.label}`}
            min={field.min}
            max={field.max}
            step={field.step}
            value={format[field.key]}
            onChange={(value) =>
              onChange({ headings: { ...headings, [level]: { ...format, [field.key]: value } } })
            }
          />
        </div>
      ))}
      <div className="heading-actions">
        <button onClick={() => onChange({ headings: compactHeadings(settings.headings) })}>
          全部标题紧凑
        </button>
        <button
          onClick={() => onChange({ headings: { ...headings, [level]: defaultHeadings()[level] } })}
        >
          重置 {level.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
