import { site } from './config/site';

export const BASE = import.meta.env.BASE_URL;

/** Путь к оптимизированному изображению из public/images */
export const img = (name: string, w: 800 | 1600 = 800) => `${BASE}images/${name}-${w}.webp`;
export const srcSet = (name: string) => `${img(name, 800)} 800w, ${img(name, 1600)} 1600w`;

const fmt = new Intl.NumberFormat(site.locale);
export const money = (v: number) => `${fmt.format(Math.round(v))} ${site.currency}`;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Плавная прокрутка к якорю с учётом шапки (уважает reduced motion). */
export function scrollToHash(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (hash === '#top' ? 0 : 64);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  history.replaceState(null, '', hash);
  (el as HTMLElement).focus?.({ preventScroll: true });
}

export const plural = (n: number, forms: [string, string, string]) => {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
};
