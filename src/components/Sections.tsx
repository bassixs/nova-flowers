import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { finale, moments, philosophy, process, reviews } from '../config/content';
import { delivery } from '../config/delivery';
import { site } from '../config/site';
import { img, money, prefersReducedMotion, scrollToHash, srcSet } from '../lib';
import { useStore } from '../store';

gsap.registerPlugin(ScrollTrigger);

/* ---------------- Философия ---------------- */
export function Philosophy() {
  return (
    <section id="philosophy" className="philo section" tabIndex={-1} aria-labelledby="philo-title">
      <div className="philo__inner wrap">
        <p className="kicker philo__kicker" data-reveal="fade">
          {philosophy.kicker}
        </p>
        <h2 id="philo-title" className="philo__quote" data-reveal="lines">
          {philosophy.quote}
        </h2>
        <figure className="philo__main" data-reveal="clip">
          <img src={img(philosophy.images.main, 1600)} srcSet={srcSet(philosophy.images.main)} sizes="(max-width: 800px) 92vw, 46vw" alt="Раскрытый коралловый пион" loading="lazy" data-parallax="0.12" />
        </figure>
        <figure className="philo__detail" data-reveal="clip">
          <img src={img(philosophy.images.detail)} alt="Макросъёмка лепестков" loading="lazy" />
        </figure>
        <div className="philo__text" data-reveal="fade">
          {philosophy.text.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p className="philo__sign">— {philosophy.signature}</p>
        </div>
        <figure className="philo__accent" data-reveal="clip">
          <img src={img(philosophy.images.accent)} alt="Тычинки раскрытого пиона" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}

/* ---------------- Поводы: горизонтальная галерея ---------------- */
export function Moments() {
  const { setOccasion } = useStore();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = trackRef.current!;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, []);

  const pick = (id: (typeof moments)[number]['id']) => {
    setOccasion(id);
    scrollToHash('#collection');
  };

  return (
    <section id="moments" ref={ref} className="moments" tabIndex={-1} aria-labelledby="moments-title">
      <ul className="moments__track" ref={trackRef}>
        <li className="moments__intro">
          <p className="kicker">Поводы</p>
          <h2 id="moments-title" className="display display--light">
            Букеты для <em>особенных</em> моментов
          </h2>
          <p>Выберите повод — покажем подходящие композиции.</p>
          <span className="moments__hint" aria-hidden="true">
            <i />
            листайте
          </span>
        </li>
        {moments.map((m, i) => (
          <li key={m.id} className={`moment moment--${i % 3}`}>
            <button type="button" onClick={() => pick(m.id)} aria-label={`${m.title}: показать букеты`}>
              <span className="moment__media">
                <img src={img(m.image)} srcSet={srcSet(m.image)} sizes="(max-width: 900px) 78vw, 30vw" alt="" loading="lazy" />
              </span>
              <span className="moment__n">0{i + 1}</span>
              <span className="moment__title">{m.title}</span>
              <span className="moment__note">{m.note}</span>
              <span className="moment__go" aria-hidden="true">
                Смотреть букеты →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Процесс ---------------- */
export function Process() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.step').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          onToggle: (s) => s.isActive && setActive(i),
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section id="process" ref={ref} className="process section" tabIndex={-1} aria-labelledby="process-title">
      <div className="wrap process__grid">
        <div className="process__stage" aria-hidden="true">
          <div className="process__frame">
            {process.map((s, i) => (
              <img key={s.n} src={img(s.image)} srcSet={srcSet(s.image)} sizes="40vw" alt="" loading="lazy" className={i === active ? 'is-active' : i < active ? 'is-past' : ''} />
            ))}
            <span className="process__count">
              <b>{process[active].n}</b> / 0{process.length}
            </span>
          </div>
        </div>
        <div className="process__steps">
          <p className="kicker" data-reveal="fade">
            Мастерская
          </p>
          <h2 id="process-title" className="display" data-reveal="lines">
            Как рождается <em>букет</em>
          </h2>
          <ol>
            {process.map((s, i) => (
              <li key={s.n} className={`step${i === active ? ' is-active' : ''}`}>
                <span className="step__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <img className="step__img" src={img(s.image)} alt="" loading="lazy" />
              </li>
            ))}
          </ol>
        </div>
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
        <figure className="delivery__img" data-reveal="clip">
          <img src={img('florist-shop')} srcSet={srcSet('florist-shop')} sizes="(max-width: 800px) 92vw, 36vw" alt="Флорист в мастерской" loading="lazy" data-parallax="0.08" />
        </figure>
        <ul className="adv">
          {delivery.advantages.map((a, i) => (
            <li key={a.title} data-reveal="fade" style={{ ['--d' as string]: i * 0.08 + 's' }}>
              <span className="adv__n">0{i + 1}</span>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </li>
          ))}
        </ul>
        <div className="zones" data-reveal="fade">
          <h3>Стоимость</h3>
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
            Слова, ради которых мы <em>работаем</em>
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
          <p>Интервалы по 2 часа, {delivery.slots[0].split('–')[0]}–{delivery.slots[delivery.slots.length - 1].split('–')[1]}</p>
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
          Анимация раскрытия — процедурная 3D-визуализация (заменяется на покадровую съёмку). Фото: Unsplash.
        </p>
        <p>© {new Date().getFullYear()} {site.brand}</p>
      </div>
    </footer>
  );
}
