/**
 * Цветовая палитра. Значения пробрасываются в CSS-переменные (--c-*),
 * поэтому смена бренда = правка этого файла.
 */
export const palette = {
  // тёплая нейтральная шкала — бумага и крафт
  milk: '#F7F4EE', // фон страницы
  cream: '#EFE9DF', // приподнятая поверхность
  sand: '#E4DACB', // крафт: бирки, открытка
  paper: '#FDFBF7', // карточки
  powder: '#EBCBC4',
  rose: '#C7807C',
  roseDeep: '#8E4A50',
  // единственный акцент интерфейса
  green: '#2F4A3A',
  greenSoft: '#3E5A48',
  ink: '#1F1B16',
  inkSoft: '#5E554A',
  muted: '#7B7266',
} as const;

export function applyTheme(root: HTMLElement = document.documentElement) {
  const map: Record<string, string> = {
    '--c-milk': palette.milk,
    '--c-cream': palette.cream,
    '--c-sand': palette.sand,
    '--c-paper': palette.paper,
    '--c-muted': palette.muted,
    '--c-powder': palette.powder,
    '--c-rose': palette.rose,
    '--c-rose-deep': palette.roseDeep,
    '--c-green': palette.green,
    '--c-green-soft': palette.greenSoft,
    '--c-ink': palette.ink,
    '--c-ink-soft': palette.inkSoft,
  };
  for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v);
}
