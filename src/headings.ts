export const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
export type HeadingLevel = (typeof headingLevels)[number];
export type HeadingFormat = {
  fontSize: number;
  lineHeight: number;
  before: number;
  after: number;
  padding: number;
};
export type HeadingSettings = Record<HeadingLevel, HeadingFormat>;
export function defaultHeadings(): HeadingSettings {
  return {
    h1: { fontSize: 32, lineHeight: 1.45, before: 0, after: 6, padding: 0 },
    h2: { fontSize: 16, lineHeight: 1.5, before: 22, after: 11, padding: 6 },
    h3: { fontSize: 14, lineHeight: 1.7, before: 8, after: 1, padding: 0 },
    h4: { fontSize: 14, lineHeight: 1.7, before: 8, after: 4, padding: 0 },
    h5: { fontSize: 14, lineHeight: 1.7, before: 8, after: 4, padding: 0 },
    h6: { fontSize: 14, lineHeight: 1.7, before: 8, after: 4, padding: 0 },
  };
}
export const headingFields = [
  { key: 'fontSize', label: '字号', min: 8, max: 48, step: 1, unit: 'px' },
  { key: 'lineHeight', label: '行距', min: 1, max: 3, step: 0.05, unit: '倍' },
  { key: 'before', label: '段前间距', min: 0, max: 80, step: 1, unit: 'px' },
  { key: 'after', label: '段后间距', min: 0, max: 80, step: 1, unit: 'px' },
  { key: 'padding', label: '装饰留白', min: 0, max: 20, step: 1, unit: 'px' },
] as const;
export function normalizeHeadings(input: unknown): HeadingSettings {
  const result = defaultHeadings();
  if (!input || typeof input !== 'object') return result;
  for (const level of headingLevels) {
    const source = (input as Partial<HeadingSettings>)[level];
    for (const field of headingFields) {
      const value = source?.[field.key];
      if (typeof value === 'number' && Number.isFinite(value))
        result[level][field.key] = Math.max(field.min, Math.min(field.max, value));
    }
  }
  return result;
}
export function compactHeadings(input?: unknown): HeadingSettings {
  const result = normalizeHeadings(input);
  for (const level of headingLevels) {
    result[level] = {
      ...result[level],
      lineHeight: 1.2,
      before: level === 'h1' ? 0 : 6,
      after: 2,
      padding: 0,
    };
  }
  return result;
}
export function headingVariables(input: unknown): Record<string, string | number> {
  const headings = normalizeHeadings(input);
  return Object.fromEntries(
    headingLevels.flatMap((level) =>
      headingFields.map((field) => [
        `--${level}-${field.key}`,
        field.key === 'lineHeight' ? headings[level][field.key] : `${headings[level][field.key]}px`,
      ])
    )
  );
}
