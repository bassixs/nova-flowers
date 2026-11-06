/** Общий интерфейс рендерера раскрытия цветка. */
export interface BloomRenderer {
  /** Готов к отрисовке хотя бы первого кадра. */
  ready: Promise<void>;
  /**
   * Отрисовать состояние.
   * @param p прогресс сцены 0..1 (0 — бутон, 1 — полностью раскрытый цветок)
   * @param time секунды — для лёгкого «дыхания» лепестков
   */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, time: number): void;
  /** Нужна ли непрерывная перерисовка (idle-анимация). */
  animated: boolean;
  dispose?(): void;
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const remap = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
