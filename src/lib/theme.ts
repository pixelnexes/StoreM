/**
 * Theme registry. The super admin selects one theme which is applied
 * platform-wide via CSS variables on <html data-theme="...">.
 * Colors are space-separated RGB channels so Tailwind's `rgb(var(--x)/alpha)`
 * works. See src/app/globals.css for the variable definitions per theme.
 *
 * The palette is deliberately earthy — clay, moss, oxide, brass — because the
 * product is built for shopkeepers, not for a pitch deck.
 */

export interface ThemeDef {
  key: string;
  name: string;
  description: string;
  swatch: string; // preview accent (hex)
}

export const THEMES: ThemeDef[] = [
  { key: 'clay',     name: 'Clay',     description: 'Terracotta on warm paper. The house tone.',  swatch: '#a74a2b' },
  { key: 'moss',     name: 'Moss',     description: 'Deep olive — steady, understated, botanical.', swatch: '#4d5e35' },
  { key: 'oxide',    name: 'Oxide',    description: 'Burnt brick red for a bolder counter.',      swatch: '#85342a' },
  { key: 'brass',    name: 'Brass',    description: 'Ochre with the warmth of shop fittings.',    swatch: '#856218' },
  { key: 'graphite', name: 'Graphite', description: 'Near-black monochrome, strictly typographic.', swatch: '#2d2924' },
  { key: 'stone',    name: 'Stone',    description: 'Warm grey — quiet and completely neutral.',  swatch: '#5d5952' },
];

export const DEFAULT_THEME = 'clay';

export function isValidTheme(key: string): boolean {
  return THEMES.some((t) => t.key === key);
}

export function themeOr(key: string | null | undefined): string {
  return key && isValidTheme(key) ? key : DEFAULT_THEME;
}
