/**
 * Sober, professional theme registry. The super admin selects one theme which
 * is applied platform-wide via CSS variables on <html data-theme="...">.
 * Colors are space-separated RGB channels so Tailwind's `rgb(var(--x)/alpha)`
 * works. See src/app/globals.css for the variable definitions per theme.
 */

export interface ThemeDef {
  key: string;
  name: string;
  description: string;
  swatch: string; // preview accent (hex)
}

export const THEMES: ThemeDef[] = [
  { key: 'slate',   name: 'Slate',   description: 'Neutral, calm blue-grey — safe default.', swatch: '#475569' },
  { key: 'indigo',  name: 'Indigo',  description: 'Classic professional SaaS indigo.',       swatch: '#4f46e5' },
  { key: 'emerald', name: 'Emerald', description: 'Confident, fresh, business green.',        swatch: '#059669' },
  { key: 'teal',    name: 'Teal',    description: 'Modern, muted teal.',                      swatch: '#0d9488' },
  { key: 'graphite',name: 'Graphite',description: 'Understated near-monochrome.',             swatch: '#3f3f46' },
  { key: 'navy',    name: 'Navy',    description: 'Trustworthy corporate navy.',              swatch: '#1e3a8a' },
];

export const DEFAULT_THEME = 'slate';

export function isValidTheme(key: string): boolean {
  return THEMES.some((t) => t.key === key);
}

export function themeOr(key: string | null | undefined): string {
  return key && isValidTheme(key) ? key : DEFAULT_THEME;
}
