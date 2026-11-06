import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bloom, hero } from '../config/content';
import { site } from '../config/site';
import { createPeonyRenderer } from '../bloom/peony';
import { createSequenceRenderer } from '../bloom/sequence';
import type { BloomRenderer } from '../bloom/types';
import { BASE, img, prefersReducedMotion, scrollToHash } from '../lib';

gsap.registerPlugin(ScrollTrigger);

type Mode = 'cinematic' | 'static' | 'fallback';

/**
 * HERO: закреплённая (pinned) сцена, прогресс прокрутки которой управляет
 * раскрытием цветка на Canvas. Текст — отдельные DOM-слои с собственным таймлайном.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>(() => (prefersReducedMotion() ? 'static' : 'cinematic'));

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMode('fallback');
      return;
    }
    const reduced = prefersReducedMotion();
    let renderer: BloomRenderer;
    try {
      renderer =
        bloom.mode === 'sequence'
          ? createSequenceRenderer({ base: BASE, ...bloom.sequence })
          : createPeonyRenderer();
    } catch {
      setMode('fallback');
      return;
    }

    let w = 0, h = 0, dpr = 1;
    let target = reduced ? 1 : 0;
    let current = target;
    let visible = true;
    let raf = 0;
    let last = 0;
    let dirty = true;
    let isReady = false;
    const t0 = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const nw = Math.round(r.width), nh = Math.round(r.height);
      if (nw === w && Math.abs(nh - h) < 2) return;
      w = nw;
      h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.6);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || !isReady) return;
      const diff = target - current;
      current = Math.abs(diff) < 0.0004 ? target : current + diff * 0.14;
      const moving = current !== target;
      // idle-«дыхание»: ~30 fps, во время прокрутки — каждый кадр
      const idle = renderer.animated && !reduced && now - last > 33;
      if (!dirty && !moving && !idle) return;
      last = now;
      dirty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.draw(ctx, w, h, current, reduced ? 0 : (now - t0) / 1000);
    };

    renderer.ready
      .then(() => {
        isReady = true;
        dirty = true;
        section.classList.add('is-ready');
      })
      .catch(() => setMode('fallback'));

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px' });
    io.observe(section);

    let gctx: gsap.Context | undefined;
    if (!reduced) {
      gctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${window.innerHeight * bloom.scrollLength}`,
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              target = self.progress;
            },
          },
        });
        // 0–15%: вступительная фраза и индикатор уходят
        tl.to('.hero__intro', { opacity: 0, y: -40, filter: 'blur(6px)', duration: 0.12 }, 0.02)
          .to('.hero__scroll', { opacity: 0, duration: 0.06 }, 0.02)
          .to('.hero__meta', { opacity: 0, duration: 0.1 }, 0.05)
          // 45–75%: главный заголовок построчно
          .fromTo('.hero__line', { y: 0, yPercent: 110, opacity: 0 }, { y: 0, yPercent: 0, opacity: 1, duration: 0.16, stagger: 0.08, ease: 'power2.out' }, 0.46)
          .fromTo('.hero__title', { filter: 'blur(10px)' }, { filter: 'blur(0px)', duration: 0.24 }, 0.46)
          // 75–100%: подзаголовок и кнопки
          .fromTo('.hero__sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.76)
          .fromTo('.hero__ctas', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1 }, 0.8)
          .fromTo('.hero__ctas', { pointerEvents: 'none' }, { pointerEvents: 'auto', duration: 0.01 }, 0.8)
          .to({}, { duration: 0.1 }, 0.9);
      }, section);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      gctx?.revert();
      renderer.dispose?.();
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <section ref={sectionRef} id="top" className={`hero hero--${mode}`} aria-label="Вступление" tabIndex={-1}>
      {mode === 'fallback' && (
        <img className="hero__poster" src={img(hero.staticImage, 1600)} alt="" aria-hidden="true" />
      )}
      <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />

      <div className="hero__meta">
        <span>{hero.eyebrow}</span>
        <span>{site.city}</span>
      </div>

      <p className="hero__intro">
        {hero.intro.split('\n').map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </p>

      <div className="hero__copy">
        <h1 className="hero__title">
          <span className="hero__mask">
            <span className="hero__line">{hero.titleLines[0]}</span>
          </span>
          <span className="hero__mask hero__mask--shift">
            <span className="hero__line">
              <em>{hero.titleLines[1]}</em>
            </span>
          </span>
        </h1>
        <p className="hero__sub">{hero.subtitle}</p>
        <div className="hero__ctas">
          <a className="btn btn--solid" href={hero.primaryCta.href} onClick={(e) => go(e, hero.primaryCta.href)}>
            <span>{hero.primaryCta.label}</span>
          </a>
          <a className="btn btn--line" href={hero.secondaryCta.href} onClick={(e) => go(e, hero.secondaryCta.href)}>
            <span>{hero.secondaryCta.label}</span>
          </a>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Прокрутите, чтобы раскрыть</span>
        <i />
      </div>
    </section>
  );
}
