import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bouquets } from '../config/catalog';
import { finale, hero, lookbook } from '../config/content';
import { site } from '../config/site';
import { img, measureText, prefersReducedMotion, scrollToHash, srcSet } from '../lib';
import { useStore } from '../store';
import { PriceTag } from './Collection';

gsap.registerPlugin(ScrollTrigger);

/* ================= Витрина: букеты по одному, крупным планом ================= */
export function Lookbook() {
  const items = lookbook.ids.map((id) => bouquets.find((b) => b.id === id)).filter((b): b is NonNullable<typeof b> => !!b);
  const [i, setI] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { add, openBouquet } = useStore();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.85 * (items.length - 1)}`,
      pin: true,
      invalidateOnRefresh: true,
      refreshPriority: 5,
      onUpdate: (self) => {
        el.style.setProperty('--lp', String(self.progress));
        setI(Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.9999)));
      },
    });
    return () => st.kill();
  }, [items.length]);

  const b = items[i];
  return (
    <section ref={ref} className="lookbook" aria-label={lookbook.title}>
      <div className="wrap lookbook__grid">
        <div className="lookbook__frame">
          {items.map((x, k) => (
            <img
              key={x.id}
              src={img(x.image, 1600)}
              srcSet={srcSet(x.image)}
              sizes="(max-width: 900px) 92vw, 46vw"
              alt={k === i ? `Букет «${x.name}»` : ''}
              aria-hidden={k !== i}
              className={k === i ? 'is-active' : k < i ? 'is-past' : ''}
              loading={k < 2 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        <div className="lookbook__info">
          <div className="lookbook__top">
            <span>{lookbook.title}</span>
            <span className="lookbook__count">
              <b>{String(i + 1).padStart(2, '0')}</b> / {String(items.length).padStart(2, '0')}
            </span>
          </div>
          <div className="lookbook__bar" aria-hidden="true">
            <i />
          </div>

          <h2 className="lookbook__name" key={`n-${b.id}`} aria-live="polite">
            {[...b.name].map((ch, k) => (
              <span key={k} style={{ animationDelay: `${k * 28}ms` }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h2>

          <div className="lookbook__body" key={`b-${b.id}`}>
            <p className="lookbook__short">{b.short}</p>
            <p className="lookbook__desc">{b.description}</p>
            <p className="lookbook__comp">{b.composition.join(' · ')}</p>
            <div className="lookbook__buy">
              <PriceTag value={b.price} />
              <button type="button" className="btn btn--solid" onClick={() => add(b.id)}>
                В корзину
              </button>
              <button type="button" className="btn btn--line" onClick={() => openBouquet(b.id)}>
                Подробнее
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= Бегущая строка, которая разгоняется от прокрутки ================= */
export function Marquee({ words, photo, reverse = false }: { words: string[]; photo?: string; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const track = trackRef.current!;
    const base = reverse ? -1 : 1;
    const tween = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, ease: 'none', duration: 46, repeat: -1 });
    // запас повторов назад, чтобы строка могла бесконечно ехать и в обратную сторону
    tween.totalTime(tween.duration() * 500);
    let boost = 0;
    let dir = 1;
    let cur = base;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        boost = Math.min(Math.abs(self.getVelocity()) / 180, 12);
        dir = self.direction;
      },
    });
    const skew = gsap.quickSetter(track, 'skewX', 'deg');
    const tick = () => {
      const target = (1 + boost) * base * dir;
      cur += (target - cur) * 0.08;
      boost *= 0.93;
      tween.timeScale(cur);
      skew(Math.max(-8, Math.min(8, -(cur - base * dir) * 0.9)));
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      tween.kill();
      gsap.set(track, { clearProps: 'all' });
    };
  }, [reverse]);

  const half = (k: number) => (
    <div className="marquee__half" aria-hidden={k > 0}>
      {[...words, ...words].map((w, j) => (
        <span key={j} className="marquee__item">
          <span className="marquee__word" style={photo ? { backgroundImage: `url(${img(photo, 1600)})`, backgroundPosition: `${(j * 37) % 100}% 40%` } : undefined}>
            {w}
          </span>
          <span className="marquee__dot" aria-hidden="true">
            ·
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={ref} className={`marquee${photo ? ' marquee--photo' : ' marquee--line'}`} role="presentation">
      <div ref={trackRef} className="marquee__track">
        {half(0)}
        {half(1)}
      </div>
    </div>
  );
}

/* ================= Финал: фото сжимается обратно в название ================= */
export function FinaleScene() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  const [box, setBox] = useState({ w: 1440, h: 860 });
  const [natW, setNatW] = useState(0);

  const { w, h } = box;
  const portrait = h > w * 1.1;
  const n = [...site.brand].length;
  const tl = w * (portrait ? 0.9 : 0.84);
  const fs = Math.min((tl / n) * 1.55 * (portrait ? 1.6 : 1), h * (portrait ? 0.24 : 0.36));
  const capH = fs * 0.66;
  const baseline = h * (portrait ? 0.42 : 0.46) + capH / 2;
  const sx = natW ? tl / natW : 0;
  const font = `500 ${fs}px "Cormorant Garamond"`;

  useLayoutEffect(() => {
    const el = ref.current!;
    const first = el.getBoundingClientRect();
    setBox({ w: first.width, h: first.height });
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBox((b) => (Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 120 ? b : { w: r.width, h: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    let alive = true;
    const m = () => {
      const v = measureText(font, site.brand);
      if (alive && v > 0) setNatW(v);
    };
    m();
    document.fonts?.load(font).then(m).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [font]);

  useEffect(() => {
    if (prefersReducedMotion() || !sx) return;
    const el = ref.current!;
    const text = textRef.current!;
    let origin = `${w / 2 - tl * 0.33} ${baseline - capH * 0.4}`;
    try {
      const c = text.getExtentOfChar(1);
      if (c.width) origin = `${w / 2 + (c.x + c.width * 0.22) * sx} ${baseline + c.y + c.height * 0.62}`;
    } catch {
      /* оставляем приблизительную точку */
    }
    const ctx = gsap.context(() => {
      const t = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${window.innerHeight * 1.3}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      });
      t.fromTo(zoomRef.current, { scale: 26, svgOrigin: origin }, { scale: 1, svgOrigin: origin, duration: 0.7, ease: 'power2.out' }, 0)
        .fromTo('.finale-scene__veil', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
        .fromTo('.finale-scene__photo img', { scale: 1 }, { scale: 1.18, duration: 1 }, 0)
        .fromTo('.finale-scene__copy', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2 }, 0.72)
        .to({}, { duration: 0.1 });
    }, el);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [w, h, sx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section ref={ref} className="finale-scene" aria-labelledby="finale-title">
      <div className="finale-scene__photo" aria-hidden="true">
        <img src={img(hero.image, 1600)} srcSet={srcSet(hero.image)} sizes="100vw" alt="" loading="lazy" />
      </div>
      <svg className="finale-scene__svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id="finale-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <rect width={w} height={h} fill="#fff" />
            <g ref={zoomRef}>
              <g transform={`translate(${w / 2} ${baseline}) scale(${sx || 1} 1)`} opacity={sx ? 1 : 0}>
                <text ref={textRef} className="hero__word" x="0" y="0" textAnchor="middle" fontSize={fs} fill="#000">
                  {site.brand}
                </text>
              </g>
            </g>
          </mask>
        </defs>
        <rect className="finale-scene__veil" width={w} height={h} mask="url(#finale-mask)" />
      </svg>
      <div className="finale-scene__copy" style={{ top: baseline + h * 0.06 }}>
        <h2 id="finale-title">{finale.title}</h2>
        <div className="finale-scene__cta">
          <a
            className="btn btn--solid"
            href={finale.cta.href}
            onClick={(e) => {
              e.preventDefault();
              scrollToHash(finale.cta.href);
            }}
          >
            {finale.cta.label}
          </a>
          <a className="btn btn--line" href={site.contacts.phoneHref}>
            {site.contacts.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
