import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { facts, hero } from '../config/content';
import { site } from '../config/site';
import { img, prefersReducedMotion, scrollToHash, srcSet } from '../lib';

gsap.registerPlugin(ScrollTrigger);

/**
 * Первый экран — название салона как «окно»: фото видно только внутри букв.
 * SVG-маска: молочная вуаль с вырезанными буквами поверх полноэкранного фото.
 * При прокрутке буквы увеличиваются (пролёт сквозь букву), вуаль растворяется,
 * на раскрытом фото проявляется заголовок. Название берётся из site.brand.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  // естественная ширина надписи при размере fs; подгонка по ширине — через scale,
  // а не textLength (его не поддерживают WebKit-браузеры iOS, включая встроенные в мессенджеры)
  const [natW, setNatW] = useState(0);
  const [box, setBox] = useState({ w: 1440, h: 860 });
  const letters = [...site.brand];

  // геометрия надписи под размер экрана
  const { w, h } = box;
  const portrait = h > w * 1.1;
  const tl = w * (portrait ? 0.92 : 0.9);
  // на узких экранах буквы вытягиваются по вертикали (condensed), чтобы название оставалось крупным
  const fs = Math.min((tl / letters.length) * 1.55 * (portrait ? 1.6 : 1), h * (portrait ? 0.26 : 0.42));
  const capH = fs * 0.66;
  // блок «название + описание» центрируется по высоте; сверху запас под акцент É и шапку
  const top = portrait ? 160 : Math.max(150, (h - capH - 320) / 2 + 40);
  const baseline = top + capH;
  const sx = natW ? tl / natW : 0;
  const font = `500 ${fs}px "Cormorant Garamond"`;

  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const c = document.createElement('canvas').getContext('2d');
      if (!c) return;
      c.font = font;
      const m = c.measureText(site.brand).width;
      if (alive && m > 0) setNatW(m);
    };
    measure();
    document.fonts?.load(font).then(measure).catch(() => undefined);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
    };
  }, [font]);

  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      // игнорируем мелкие изменения высоты (адресная строка мобильных браузеров)
      setBox((b) => (Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 120 ? b : { w: r.width, h: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || !sx) return;
    const el = ref.current!;
    const text = textRef.current!;
    const zoom = zoomRef.current!;

    // точка «пролёта» — внутри штриха второй буквы (в координатах всего SVG)
    const origin = () => {
      try {
        const c = text.getExtentOfChar(Math.min(1, letters.length - 1));
        if (!c.width) throw new Error('no extent');
        return `${w / 2 + (c.x + c.width * 0.22) * sx} ${baseline + c.y + c.height * 0.62}`;
      } catch {
        return `${w / 2 - tl * 0.33} ${baseline - capH * 0.4}`;
      }
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${window.innerHeight * 1.4}`,
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      tl.to('.hero__info', { opacity: 0, y: -40, duration: 0.25 }, 0)
        .fromTo(zoom, { scale: 1 }, { scale: 26, svgOrigin: origin(), duration: 0.75, ease: 'power2.in' }, 0.08)
        .to('.hero__veil', { opacity: 0, duration: 0.3 }, 0.5)
        .fromTo('.hero__photo img', { scale: 1.18 }, { scale: 1, duration: 0.9 }, 0)
        .fromTo('.hero__shade', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.6)
        .fromTo('.hero__tline', { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 0.2, stagger: 0.07, ease: 'power2.out' }, 0.68)
        .to({}, { duration: 0.08 });
    }, el);

    // лёгкий параллакс фото внутри букв за курсором
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--mx', `${x * -14}px`);
      el.style.setProperty('--my', `${y * -10}px`);
    };
    el.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointermove', onMove);
      ctx.revert();
    };
    // пересоздаём сцену при смене геометрии надписи
  }, [w, h, sx]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <section ref={ref} id="top" className="hero" aria-labelledby="hero-title" tabIndex={-1}>
      <div className="hero__photo" aria-hidden="true">
        <img src={img(hero.image, 1600)} srcSet={srcSet(hero.image)} sizes="100vw" alt="" {...{ fetchpriority: 'high' }} />
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <svg className="hero__svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id="hero-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <rect width={w} height={h} fill="#fff" />
            <g ref={zoomRef}>
              <g transform={`translate(${w / 2} ${baseline}) scale(${sx || 1} 1)`} opacity={sx ? 1 : 0}>
                <text ref={textRef} className="hero__word" x="0" y="0" textAnchor="middle" fontSize={fs} fill="#000">
                  {letters.map((l, i) => (
                    <tspan key={i} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                      {l}
                    </tspan>
                  ))}
                </text>
              </g>
            </g>
          </mask>
        </defs>
        <rect className="hero__veil" width={w} height={h} mask="url(#hero-mask)" />
      </svg>

      <h1 id="hero-title" className="sr-only">
        {site.brand} — {hero.lead.toLowerCase()}
      </h1>

      <div className="hero__info" style={{ ['--base' as string]: `${baseline}px` }}>
        <div className="hero__meta">
          <span>{hero.eyebrow}</span>
          <span>{site.city}</span>
        </div>
        <div className="hero__below">
          <div className="hero__text">
            <p className="hero__lead">{hero.lead}</p>
            <p className="hero__sub">{hero.sub}</p>
            <div className="hero__ctas">
              <a className="btn btn--solid" href={hero.primaryCta.href} onClick={(e) => go(e, hero.primaryCta.href)}>
                <span>{hero.primaryCta.label}</span>
              </a>
              <a className="btn btn--line" href={hero.secondaryCta.href} onClick={(e) => go(e, hero.secondaryCta.href)}>
                <span>{hero.secondaryCta.label}</span>
              </a>
            </div>
          </div>
          <ul className="facts">
            {facts.map((f) => (
              <li key={f.label}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="hero__title" aria-hidden="true">
        {hero.title.map((t, i) => (
          <span key={i} className="hero__tmask">
            <span className="hero__tline">{i === 1 ? <em>{t}</em> : t}</span>
          </span>
        ))}
      </p>
    </section>
  );
}
