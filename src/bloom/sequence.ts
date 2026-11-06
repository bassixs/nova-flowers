import type { BloomRenderer } from './types';
import { clamp } from './types';

/**
 * Покадровая последовательность раскрытия (scroll-controlled image sequence).
 * Подключается заменой bloom.mode = 'sequence' в src/config/content.ts
 * и размещением кадров в public/bloom/ (требования: docs/BLOOM_ASSETS.md).
 *
 * Стратегия загрузки: сначала «критические» кадры равномерно по всей шкале
 * (чтобы сцена сразу работала грубо), затем все остальные. При отрисовке
 * берётся ближайший загруженный кадр — пустого экрана не бывает.
 */
export function createSequenceRenderer(opts: {
  base: string;
  path: string;
  frames: number;
  pad: number;
  critical: number;
}): BloomRenderer {
  const imgs: (HTMLImageElement | null)[] = new Array(opts.frames).fill(null);
  const url = (i: number) => opts.base + opts.path.replace('{i}', String(i).padStart(opts.pad, '0'));
  let disposed = false;

  const load = (i: number) =>
    new Promise<void>((res) => {
      if (imgs[i]) return res();
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        imgs[i] = im;
        res();
      };
      im.onerror = () => res();
      im.src = url(i);
    });

  const order: number[] = [];
  const step = Math.max(1, Math.floor(opts.frames / opts.critical));
  for (let i = 0; i < opts.frames; i += step) order.push(i);
  const rest = [...Array(opts.frames).keys()].filter((i) => !order.includes(i));

  const ready = (async () => {
    await load(0);
    await Promise.all(order.map(load));
    (async () => {
      for (let i = 0; i < rest.length && !disposed; i += 6) {
        await Promise.all(rest.slice(i, i + 6).map(load));
      }
    })();
    if (!imgs[0]) throw new Error('bloom sequence: first frame missing');
  })();

  function nearest(i: number) {
    for (let d = 0; d < opts.frames; d++) {
      if (imgs[i - d]) return imgs[i - d];
      if (imgs[i + d]) return imgs[i + d];
    }
    return null;
  }

  return {
    ready,
    animated: false,
    draw(ctx, w, h, p) {
      const i = Math.round(clamp(p) * (opts.frames - 1));
      const im = nearest(i);
      if (!im) return;
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const dw = im.naturalWidth * s;
      const dh = im.naturalHeight * s;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    },
    dispose() {
      disposed = true;
    },
  };
}
