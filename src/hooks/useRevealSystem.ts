import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../lib';

gsap.registerPlugin(ScrollTrigger);

/**
 * Единая система появлений по data-атрибутам:
 *  data-reveal="lines" — заголовок раскрывается построчно из-под маски + blur→sharp
 *  data-reveal="fade"  — мягкое появление снизу
 *  data-reveal="clip"  — изображение открывается clipping-маской
 *  data-parallax="0.1" — лёгкий параллакс изображения
 */
export function useRevealSystem() {
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.classList.add('no-motion');
      return;
    }
    root.classList.add('motion');

    // разбивка заголовков на строки (по словам → группировка по offsetTop)
    const splitLines = (el: HTMLElement) => {
      if (el.dataset.split) return;
      el.dataset.split = '1';
      const nodes = [...el.childNodes];
      const words: HTMLElement[] = [];
      el.innerHTML = '';
      nodes.forEach((n) => {
        const isEm = n.nodeName === 'EM';
        const text = n.textContent ?? '';
        text.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) {
            el.appendChild(document.createTextNode(' '));
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          w.innerHTML = isEm ? `<em>${t}</em>` : t.replace(/ /g, '&nbsp;');
          el.appendChild(w);
          words.push(w);
        });
      });
      // группировка в строки
      const lines: HTMLElement[][] = [];
      let top = -1;
      words.forEach((w) => {
        if (!lines.length || Math.abs(w.offsetTop - top) > 4) {
          lines.push([]);
          top = w.offsetTop;
        }
        lines[lines.length - 1].push(w);
      });
      el.innerHTML = '';
      lines.forEach((ws, i) => {
        const mask = document.createElement('span');
        mask.className = 'lmask';
        const inner = document.createElement('span');
        inner.className = 'rl';
        ws.forEach((w, j) => {
          inner.appendChild(w);
          if (j < ws.length - 1) inner.appendChild(document.createTextNode(' '));
        });
        mask.appendChild(inner);
        el.appendChild(mask);
        if (i < lines.length - 1) el.appendChild(document.createTextNode(' '));
      });
    };

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        try {
          splitLines(el);
        } catch {
          return;
        }
        gsap.fromTo(
          el.querySelectorAll('.rl'),
          { y: 0, yPercent: 105, filter: 'blur(6px)' },
          {
            y: 0,
            yPercent: 0,
            filter: 'blur(0px)',
            clearProps: 'filter',
            duration: 1.15,
            stagger: 0.09,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal="clip"]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
        );
        const im = el.querySelector('img');
        if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const k = parseFloat(el.dataset.parallax || '0.1');
        const wrap = el.parentElement!;
        gsap.fromTo(el, { yPercent: -k * 50 }, { yPercent: k * 50, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    // пересчёт после загрузки шрифтов/изображений
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      ctx.revert();
      window.removeEventListener('load', refresh);
    };
  }, []);
}
