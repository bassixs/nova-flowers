import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { about, faq, finale, howTo, moments, reviews } from '../config/content';
import { delivery } from '../config/delivery';
import { site } from '../config/site';
import { img, money, prefersReducedMotion, scrollToHash, srcSet } from '../lib';
import { useStore } from '../store';

gsap.registerPlugin(ScrollTrigger);

/* ---------------- Поводы ---------------- */
export function Moments() {
  const { setOccasion } = useStore();
  const pick = (id: (typeof moments)[number]['id']) => {
    setOccasion(id);
    scrollToHash('#collection');
  };
  return (
    <section id="moments" className="moments section" tabIndex={-1} aria-labelledby="moments-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="kicker" data-reveal="fade">
            Поводы
          </p>
          <h2 id="moments-title" className="display display--light" data-reveal="lines">
            Подберём букет <em>к поводу</em>
          </h2>
          <p className="sec-head__lead" data-reveal="fade">
            Нажмите на повод — каталог покажет подходящие композиции.
          </p>
        </header>
        <ul className="moments__grid">
          {moments.map((m, i) => (
            <li key={m.id} className="moment" data-reveal="fade" style={{ ['--d' as string]: i * 0.07 + 's' }}>
              <button type="button" onClick={() => pick(m.id)} aria-label={`${m.title}: показать букеты`}>
                <span className="moment__media">
                  <img src={img(m.image)} srcSet={srcSet(m.image)} sizes="(max-width: 700px) 45vw, 20vw" alt="" loading="lazy" />
                </span>
                <span className="moment__title">{m.title}</span>
                <span className="moment__note">{m.note}</span>
                <span className="moment__go" aria-hidden="true">
                  Смотреть →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Как заказать ---------------- */
export function HowTo() {
  const { setCartOpen } = useStore();
  return (
    <section id="how" className="how section" tabIndex={-1} aria-labelledby="how-title">
      <div className="wrap">
        <header className="sec-head">
          <p className="kicker" data-reveal="fade">
            Как заказать
          </p>
          <h2 id="how-title" className="display" data-reveal="lines">
            Три шага <em>до букета</em>
          </h2>
        </header>
        <ol className="how__steps">
          {howTo.map((s, i) => (
            <li key={s.n} data-reveal="fade" style={{ ['--d' as string]: i * 0.1 + 's' }}>
              <span className="how__n" aria-hidden="true">
                {s.n}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="how__cta" data-reveal="fade">
          <a
            className="btn btn--solid"
            href="#collection"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#collection');
            }}
          >
            <span>Перейти в каталог</span>
          </a>
          <button type="button" className="link" onClick={() => setCartOpen(true)}>
            Открыть корзину
          </button>
          <span className="how__phone">
            или позвоните: <a className="link" href={site.contacts.phoneHref}>{site.contacts.phone}</a>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- О мастерской ---------------- */
export function About() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const q = ref.current!.querySelector('.about__quote')!;
      // слова «проявляются» по мере чтения, фото-вставки раскрываются между ними
      gsap.fromTo(
        '.about__quote .aw',
        { opacity: 0.14 },
        { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: q, start: 'top 82%', end: 'bottom 45%', scrub: 0.4 } },
      );
      gsap.fromTo(
        '.about__quote .pill',
        { width: 0, opacity: 0 },
        { width: '2.3em', opacity: 1, stagger: 0.25, ease: 'power2.out', scrollTrigger: { trigger: q, start: 'top 78%', end: 'bottom 50%', scrub: 0.6 } },
      );
      // коллаж: фото движутся с разной скоростью
      const sc = { trigger: '.about__collage', start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo('.about__main img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: sc });
      // разноскоростной параллакс — только на широких экранах, где фото не стоят друг под другом
      gsap.matchMedia().add('(min-width: 901px)', () => {
        gsap.fromTo('.about__side', { y: 80 }, { y: -80, ease: 'none', scrollTrigger: sc });
        gsap.fromTo('.about__accent', { y: 140, rotate: -6 }, { y: -120, rotate: 4, ease: 'none', scrollTrigger: sc });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={ref} className="about section" tabIndex={-1} aria-labelledby="about-title">
      <div className="wrap">
        <p className="kicker" data-reveal="fade">
          {about.kicker}
        </p>
        <h2 id="about-title" className="about__quote">
          {about.quote.map((part, i) =>
            typeof part === 'string' ? (
              <span key={i}>
                {part.split(' ').map((w, j) => (
                  <span key={j} className="aw">
                    {w}{' '}
                  </span>
                ))}
              </span>
            ) : (
              <span key={i} className="pill" aria-hidden="true">
                <img src={img(part.img)} alt="" loading="lazy" />
              </span>
            ),
          )}
        </h2>

        <div className="about__collage">
          <figure className="about__main" data-reveal="clip">
            <img src={img(about.images.main, 1600)} srcSet={srcSet(about.images.main)} sizes="(max-width: 900px) 92vw, 55vw" alt="Флорист собирает букет" loading="lazy" />
            <figcaption>Ручная сборка — без поролона и шаблонов</figcaption>
          </figure>
          <figure className="about__side">
            <img src={img(about.images.side)} srcSet={srcSet(about.images.side)} sizes="(max-width: 900px) 46vw, 24vw" alt="Флорист оформляет композицию" loading="lazy" />
          </figure>
          <figure className="about__accent">
            <img src={img(about.images.accent)} alt="Раскрытый пион крупным планом" loading="lazy" />
          </figure>

          <div className="about__body">
            <p className="about__text" data-reveal="fade">
              {about.text}
            </p>
            <p className="about__sign" data-reveal="fade">
              — {about.signature}
            </p>
          </div>
        </div>

        <ul className="about__stats">
          {about.stats.map((s, i) => (
            <li key={s.label} data-reveal="fade" style={{ ['--d' as string]: i * 0.1 + 's' }}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Доставка ---------------- */
export function Delivery() {
  return (
    <section id="delivery" className="delivery section" tabIndex={-1} aria-labelledby="delivery-title">
      <div className="wrap delivery__grid">
        <div className="delivery__head">
          <p className="kicker" data-reveal="fade">
            Доставка
          </p>
          <h2 id="delivery-title" className="display" data-reveal="lines">
            {delivery.title.split(' ').slice(0, -1).join(' ')} <em>{delivery.title.split(' ').slice(-1)}</em>
          </h2>
          <p className="delivery__lead" data-reveal="fade">
            {delivery.lead}
          </p>
        </div>
        <div className="zones" data-reveal="fade">
          <h3>Стоимость доставки</h3>
          <dl>
            {delivery.zones.map((z) => (
              <div key={z.name}>
                <dt>
                  {z.name}
                  {z.note && <small>{z.note}</small>}
                </dt>
                <dd>{z.price === 0 ? 'бесплатно' : money(z.price)}</dd>
              </div>
            ))}
          </dl>
          <p className="demo-note">Демонстрационные условия — заменяются на условия конкретного салона.</p>
        </div>
        <ul className="adv">
          {delivery.advantages.map((a, i) => (
            <li key={a.title} data-reveal="fade" style={{ ['--d' as string]: i * 0.08 + 's' }}>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Отзывы ---------------- */
export function Reviews() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const n = reviews.length;
  const go = (d: number) => {
    setDir(d);
    setI((v) => (v + d + n) % n);
  };
  const r = reviews[i];
  return (
    <section id="reviews" className="reviews section" tabIndex={-1} aria-labelledby="reviews-title">
      <div className="wrap reviews__grid">
        <div className="reviews__side">
          <p className="kicker">Отзывы</p>
          <h2 id="reviews-title" className="reviews__title" data-reveal="lines">
            Что говорят <em>о букетах</em>
          </h2>
          <p className="demo-badge">Демонстрационные отзывы — пример наполнения, не реальные клиенты</p>
        </div>
        <div className="reviews__stage" aria-live="polite">
          <blockquote key={i} className={`review review--${dir > 0 ? 'next' : 'prev'}`}>
            <p>«{r.text}»</p>
            <footer>
              <b>{r.name}</b>
              <span>{r.meta}</span>
            </footer>
          </blockquote>
          <div className="reviews__nav">
            <button type="button" className="round" onClick={() => go(-1)} aria-label="Предыдущий отзыв">
              ←
            </button>
            <span className="reviews__count">
              <b>{String(i + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}
            </span>
            <button type="button" className="round" onClick={() => go(1)} aria-label="Следующий отзыв">
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Вопросы ---------------- */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="faq section" tabIndex={-1} aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <header>
          <p className="kicker" data-reveal="fade">
            Вопросы
          </p>
          <h2 id="faq-title" className="display" data-reveal="lines">
            Коротко <em>о главном</em>
          </h2>
        </header>
        <ul className="faq__list">
          {faq.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className={`qa${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`qa-${i}`} id={`qa-b-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    <span>{f.q}</span>
                    <i aria-hidden="true" />
                  </button>
                </h3>
                <div id={`qa-${i}`} role="region" aria-labelledby={`qa-b-${i}`} className="qa__a">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Финал ---------------- */
export function Finale() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.finale__media',
        { clipPath: 'inset(14% 18% 14% 18%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'top 10%', scrub: 0.5 },
        },
      );
      gsap.fromTo('.finale__media img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="finale" aria-labelledby="finale-title">
      <div className="finale__media">
        <img src={img(finale.image, 1600)} srcSet={srcSet(finale.image)} sizes="100vw" alt="Пышные розовые пионы" loading="lazy" />
      </div>
      <div className="finale__copy">
        <h2 id="finale-title" data-reveal="lines">
          {finale.title}
        </h2>
        <a
          className="btn btn--light"
          href={finale.cta.href}
          onClick={(e) => {
            e.preventDefault();
            scrollToHash(finale.cta.href);
          }}
        >
          <span>{finale.cta.label}</span>
        </a>
      </div>
    </section>
  );
}

/* ---------------- Подвал ---------------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__about">
          <p className="footer__tag">{site.brandTagline}</p>
          <p>Авторские букеты и оформление событий. {site.city}.</p>
        </div>
        <nav aria-label="Навигация в подвале">
          <h3>Разделы</h3>
          {site.nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="link"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash(n.href);
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div>
          <h3>Контакты</h3>
          <a className="link" href={site.contacts.phoneHref}>
            {site.contacts.phone}
          </a>
          <a className="link" href={`mailto:${site.contacts.email}`}>
            {site.contacts.email}
          </a>
          <p>{site.contacts.address}</p>
          <p>{site.contacts.hours}</p>
        </div>
        <div>
          <h3>Доставка</h3>
          <p>
            Интервалы по 2 часа, {delivery.slots[0].split('–')[0]}–{delivery.slots[delivery.slots.length - 1].split('–')[1]}
          </p>
          <p>Бесплатно в центре от {money(delivery.freeFrom)}</p>
          <h3 className="footer__soc-title">Мы на связи</h3>
          <div className="footer__soc">
            {site.socials
              .filter((s) => s.href)
              .map((s) => (
                <a key={s.id} className="link" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
          </div>
        </div>
      </div>
      <div className="footer__word" aria-hidden="true">
        {site.brand}
      </div>
      <div className="wrap footer__legal">
        <p>
          Демонстрационный сайт. Контакты, цены, условия и отзывы — пример наполнения и не относятся к реальному магазину.
          Фото: Unsplash.
        </p>
        <p>
          © {new Date().getFullYear()} {site.brand}
        </p>
      </div>
    </footer>
  );
}
