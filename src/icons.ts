// Built-in geometry from Lucide (ISC), distributed by the installed lucide-react package.
export type ResumeIcon = { viewBox: string; body: string; outline?: boolean };
export type IconMap = Record<string, ResumeIcon>;
export type IconLibrary = { name: string; source: string };
export const builtinIcons: IconMap = {
  phone: {
    viewBox: '0 0 24 24',
    body: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
    outline: true,
  },
  mail: {
    viewBox: '0 0 24 24',
    body: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" />',
    outline: true,
  },
  'map-pin': {
    viewBox: '0 0 24 24',
    body: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />',
    outline: true,
  },
  'graduation-cap': {
    viewBox: '0 0 24 24',
    body: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
    outline: true,
  },
  briefcase: {
    viewBox: '0 0 24 24',
    body: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" />',
    outline: true,
  },
  award: {
    viewBox: '0 0 24 24',
    body: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" />',
    outline: true,
  },
  trophy: {
    viewBox: '0 0 24 24',
    body: '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" /><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" /><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" /><path d="M4 22h16" /><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />',
    outline: true,
  },
  calendar: {
    viewBox: '0 0 24 24',
    body: '<path d="M8 2v3" /><path d="M16 2v3" /><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" />',
    outline: true,
  },
  link: {
    viewBox: '0 0 24 24',
    body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    outline: true,
  },
  globe: {
    viewBox: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />',
    outline: true,
  },
  user: {
    viewBox: '0 0 24 24',
    body: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
    outline: true,
  },
  code: {
    viewBox: '0 0 24 24',
    body: '<path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" />',
    outline: true,
  },
  'book-open': {
    viewBox: '0 0 24 24',
    body: '<path d="M12 5v16" /><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />',
    outline: true,
  },
  heart: {
    viewBox: '0 0 24 24',
    body: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />',
    outline: true,
  },
  star: {
    viewBox: '0 0 24 24',
    body: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
    outline: true,
  },
  github: {
    viewBox: '0 0 24 24',
    outline: true,
    body: '<path d="M9 19c-4 1-4-2-6-2m12 5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.4 7a4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.3 11.3 0 0 0-6 0C6.7 3.5 5.7 3.8 5.7 3.8A4.3 4.3 0 0 0 5.6 7a4.7 4.7 0 0 0-1.3 3.3c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 9 18.6V22" />',
  },
};
const aliases: Record<string, string> = {
  email: 'mail',
  location: 'map-pin',
  education: 'graduation-cap',
  work: 'briefcase',
  website: 'globe',
  tel: 'phone',
};
export function resolveIcon(name: string, custom: IconMap = {}): ResumeIcon | undefined {
  const short = name.replace(/^icon-/, '');
  if (Object.hasOwn(custom, name)) return custom[name];
  if (Object.hasOwn(custom, short)) return custom[short];
  const builtin = Object.hasOwn(aliases, short) ? aliases[short] : short;
  return Object.hasOwn(builtinIcons, builtin) ? builtinIcons[builtin] : undefined;
}
export function iconMarkup(icon: ResumeIcon): string {
  return (
    '<svg class="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="' +
    icon.viewBox +
    '" aria-hidden="true" focusable="false" ' +
    (icon.outline
      ? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
      : 'fill="currentColor"') +
    '>' +
    icon.body +
    '</svg>'
  );
}
