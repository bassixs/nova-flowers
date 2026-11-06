/**
 * Цветовая палитра. Значения пробрасываются в CSS-переменные (--c-*),
 * поэтому смена бренда = правка этого файла.
 */
export const palette = {
  milk: '#F7F2EB',
  cream: '#EFE5D8',
  sand: '#E2D3C1',
  powder: '#EBCBC4',
  rose: '#C7807C',
  roseDeep: '#9E4F55',
  green: '#1F3A2D',
  greenSoft: '#3E5A48',
  ink: '#1C1A17',
  inkSoft: '#5B544B',
} as const;

/** Цвета процедурного пиона в hero (если используется procedural-режим). */
export const bloomColors = {
  petalBase: [160, 48, 78], // глубокий розовый у основания лепестка
  petalMid: [226, 140, 156],
  petalTip: [250, 226, 224], // светлая пудровая кромка
  sepal: [58, 86, 62],
  stem: [62, 92, 64],
  stamen: [222, 176, 92],
} as const;

export function applyTheme(root: HTMLElement = document.documentElement) {
  const map: Record<string, string> = {
    '--c-milk': palette.milk,
    '--c-cream': palette.cream,
    '--c-sand': palette.sand,
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
