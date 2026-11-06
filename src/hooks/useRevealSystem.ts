import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { money, prefersReducedMotion } from '../lib';

gsap.registerPlugin(ScrollTrigger);

/**
 * Анимации прокрутки для всего, что ниже первого экрана.
 * У каждой секции — свой жест, связанный с её содержанием:
 *  каталог — фото «проявляются» снизу вверх рядами;
 *  поводы — строки вычерчиваются слева направо;
 *  заказ — бумага поднимается, строки заполняются, итог досчитывается, открытка «падает» сверху;
 *  мастерская — фото раскрывается и отъезжает при прокрутке;
 *  доставка — интервалы загораются по очереди.
 * При prefers-reduced-motion ничего не анимируется.
 */
export function useRevealSystem() {
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.classList.add('no-motion');
      return;
    }
    root.classList.add('motion');
    const ease = 'power3.out';
    const once = (trigger: Element | string, start = 'top 85%') => ({ trigger, start, once: true });

    const ctx = gsap.context(() => {
      // тонкая полоса прогресса прокрутки под шапкой
      gsap.fromTo(
        '.progress',
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } },
      );

      // заголовки и подзаголовки секций
      gsap.utils.toArray<HTMLElement>('main .display, .about__title').forEach((el) => {
        gsap.fromTo(el, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease, scrollTrigger: once(el, 'top 90%') });
      });
      gsap.utils.toArray<HTMLElement>('.sec-head__lead, .about__text, .finale__side, .demo-badge, .kicker').forEach((el) => {
        gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.12, ease, scrollTrigger: once(el, 'top 92%') });
      });

      // каталог: фото проявляются снизу вверх, ряд за рядом
      gsap.set('.grid .card__media', { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set('.grid .card__body', { y: 24, opacity: 0 });
      ScrollTrigger.batch('.grid .card', {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => {
          const media = batch.map((c) => c.querySelector('.card__media'));
          gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', stagger: 0.12 });
          gsap.fromTo(
            batch.map((c) => c.querySelector('.card__media img')),
            { scale: 1.25 },
            { scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.12 },
          );
          gsap.to(
            batch.map((c) => c.querySelector('.card__body')),
            { y: 0, opacity: 1, duration: 0.9, ease, stagger: 0.12, delay: 0.2 },
          );
        },
      });

      // поводы: строки вычерчиваются слева направо
      gsap.fromTo(
        '.occ li',
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.out', stagger: 0.09, scrollTrigger: once('.occ', 'top 80%') },
      );

      // шаги заказа
      gsap.fromTo('.steps li', { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease, stagger: 0.12, scrollTrigger: once('.steps') });

      // открытка-заказ
      const order = document.querySelector('.order');
      if (order) {
        const tl = gsap.timeline({ scrollTrigger: once(order, 'top 75%') });
        tl.fromTo('.order__paper', { y: 80, opacity: 0, rotation: 2 }, { y: 0, opacity: 1, rotation: 0, duration: 1, ease })
          .fromTo(
            '.order__head, .order__item, .order__fields > div, .order__total, .order__photo',
            { x: -12, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease, stagger: 0.08 },
            '-=0.5',
          )
          .fromTo(
            '.order__card',
            { y: -120, opacity: 0, rotation: -16 },
            { y: 0, opacity: 1, rotation: window.innerWidth < 900 ? -2 : -3, duration: 1.1, ease: 'power4.out' },
            '-=0.2',
          );
        // итог досчитывается
        const tag = order.querySelector<HTMLElement>('.order__total .tag');
        if (tag) {
          const total = parseInt((tag.textContent || '').replace(/\D/g, ''), 10) || 0;
          const v = { n: 0 };
          tl.to(v, { n: total, duration: 1.2, ease: 'power2.out', onUpdate: () => {
            tag.textContent = money(v.n);
          } }, 0.7);
        }
      }

      // мастерская: фото раскрывается из окна и плавно отъезжает
      gsap.fromTo(
        '.about__img',
        { clipPath: 'inset(12% 12% 12% 12%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.about__img', start: 'top 95%', end: 'center 55%', scrub: 0.5 } },
      );
      gsap.fromTo(
        '.about__img img',
        { scale: 1.3 },
        { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__img', start: 'top bottom', end: 'bottom top', scrub: 0.5 } },
      );
      gsap.fromTo('.about__points li', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease, stagger: 0.1, scrollTrigger: once('.about__points') });

      // доставка
      gsap.fromTo('.perks li', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease, stagger: 0.1, scrollTrigger: once('.perks') });
      gsap.fromTo('.delivery__info', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease, scrollTrigger: once('.delivery__info') });
      gsap.fromTo('.zones tr', { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease, stagger: 0.08, scrollTrigger: once('.zones') });
      gsap.fromTo(
        '.slots li',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.06, scrollTrigger: once('.slots', 'top 88%') },
      );

      // отзывы и вопросы
      gsap.fromTo('.rev li', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease, stagger: 0.12, scrollTrigger: once('.rev') });
      gsap.fromTo('.faq__list .qa', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease, stagger: 0.07, scrollTrigger: once('.faq__list') });

      // финал: заголовок медленно «доезжает» при прокрутке
      gsap.fromTo(
        '.finale .display',
        { xPercent: -6 },
        { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'center center', scrub: 0.6 } },
      );
    });

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);
}
