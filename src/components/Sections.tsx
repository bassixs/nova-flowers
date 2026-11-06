import { useState } from 'react';
import { bouquets } from '../config/catalog';
import { about, faq, finale, howTo, moments, orderExample, reviews } from '../config/content';
import { delivery } from '../config/delivery';
import { site } from '../config/site';
import { img, money, plural, scrollToHash, srcSet } from '../lib';
import { unitPrice, useStore } from '../store';
import { PriceTag } from './Collection';

const go = (href: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  scrollToHash(href);
};

/* ---------------- Поводы: список строк ---------------- */
export function Moments() {
  const { setOccasion } = useStore();
  const pick = (id: (typeof moments)[number]['id']) => {
    setOccasion(id);
    scrollToHash('#collection');
  };
  return (
    <section id="moments" className="moments section" tabIndex={-1} aria-labelledby="moments-title">
      <div className="wrap moments__grid">
        <header className="sec-head">
          <h2 id="moments-title" className="display">
            Букет к поводу
          </h2>
          <p className="sec-head__lead">Выберите повод, и каталог покажет подходящие букеты</p>
        </header>
        <ul className="occ">
          {moments.map((m) => {
            const n = bouquets.filter((b) => b.occasions.includes(m.id)).length;
            return (
              <li key={m.id}>
                <button type="button" className="occ__row" onClick={() => pick(m.id)}>
                  <span className="occ__title">{m.title}</span>
                  <span className="occ__note">{m.note}</span>
                  <span className="occ__n">
                    {n} {plural(n, ['букет', 'букета', 'букетов'])}
                  </span>
                  <svg className="occ__arrow" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- Как заказать + открытка-заказ ---------------- */
function OrderCard() {
  const b = bouquets.find((x) => x.id === orderExample.bouquetId)!;
  const price = unitPrice(b.id, orderExample.size as 'M');
  const fee = delivery.cityFee;
  return (
    <figure className="order" aria-label="Пример заполненного заказа">
      <div className="order__paper">
        <div className="order__head">
          <span>Заказ № {orderExample.number}</span>
          <span>пример</span>
        </div>
        <div className="order__item">
          <img src={img(b.image)} alt="" width="800" height="1000" />
          <div>
            <b>{b.name}</b>
            <span>Размер {orderExample.size}</span>
          </div>
          <span className="order__sum">{money(price)}</span>
        </div>
        <dl className="order__fields">
          <div>
            <dt>Кому</dt>
            <dd>{orderExample.recipient}</dd>
          </div>
          <div>
            <dt>Куда</dt>
            <dd>{orderExample.address}</dd>
          </div>
          <div>
            <dt>Когда</dt>
            <dd>
              {orderExample.date}, {orderExample.slot}
            </dd>
          </div>
          <div>
            <dt>Доставка</dt>
            <dd className="order__num">{money(fee)}</dd>
          </div>
        </dl>
        <div className="order__total">
          <span>Итого</span>
          <PriceTag value={price + fee} />
        </div>
        <p className="order__photo">Фото готового букета пришлём до {orderExample.photoBy}</p>
      </div>
      <div className="order__card" aria-label="Текст открытки">
        <p>{orderExample.card}</p>
        <span>— {orderExample.from}</span>
      </div>
    </figure>
  );
}

export function HowTo() {
  return (
    <section id="how" className="how section" tabIndex={-1} aria-labelledby="how-title">
      <div className="wrap how__grid">
        <div className="how__text">
          <h2 id="how-title" className="display">
            Как заказать
          </h2>
          <ol className="steps">
            {howTo.map((s) => (
              <li key={s.n}>
                <span className="steps__n">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="how__cta">
            <a className="btn btn--solid" href="#collection" onClick={go('#collection')}>
              Выбрать букет
            </a>
            <a className="btn btn--line" href={site.contacts.phoneHref}>
              Позвонить
            </a>
          </div>
        </div>
        <OrderCard />
      </div>
    </section>
  );
}

/* ---------------- О мастерской ---------------- */
export function About() {
  return (
    <section id="about" className="about section" tabIndex={-1} aria-labelledby="about-title">
      <div className="wrap about__grid">
        <figure className="about__img">
          <img src={img(about.image, 1600)} srcSet={srcSet(about.image)} sizes="(max-width: 900px) 92vw, 44vw" alt="Флорист собирает букет в мастерской" loading="lazy" width="1600" height="2000" />
        </figure>
        <div className="about__body">
          <p className="kicker">О мастерской</p>
          <h2 id="about-title" className="about__title">
            {about.title}
          </h2>
          <p className="about__text">{about.text}</p>
          <ul className="about__points">
            {about.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
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
          <h2 id="delivery-title" className="display">
            {delivery.title}
          </h2>
          <p className="sec-head__lead">{delivery.lead}</p>
          <ul className="perks">
            {delivery.advantages.map((a) => (
              <li key={a.title}>
                <b>{a.title}</b>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="delivery__info">
          <table className="zones">
            <caption>Стоимость доставки</caption>
            <tbody>
              {delivery.zones.map((z) => (
                <tr key={z.name}>
                  <th scope="row">
                    {z.name}
                    {z.note && <small>{z.note}</small>}
                  </th>
                  <td>{z.price === 0 ? 'бесплатно' : money(z.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="slots">
            <p className="slots__label">Интервалы доставки</p>
            <ul>
              {delivery.slots.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="demo-note">Условия демонстрационные и меняются под конкретный салон</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Отзывы ---------------- */
export function Reviews() {
  return (
    <section id="reviews" className="reviews section" tabIndex={-1} aria-labelledby="reviews-title">
      <div className="wrap">
        <header className="sec-head sec-head--split">
          <h2 id="reviews-title" className="display">
            Отзывы
          </h2>
          <p className="demo-badge">Демонстрационные отзывы — пример наполнения, не реальные клиенты</p>
        </header>
        <ul className="rev">
          {reviews.map((r) => (
            <li key={r.name}>
              <blockquote>
                <p>{r.text}</p>
                <footer>
                  {r.name} · {r.meta}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
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
        <h2 id="faq-title" className="display">
          Вопросы
        </h2>
        <ul className="faq__list">
          {faq.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className={`qa${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={`qa-${i}`} id={`qa-b-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    <span>{f.q}</span>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 8h10" />
                      <path className="qa__v" d="M8 3v10" />
                    </svg>
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
  return (
    <section className="finale" aria-labelledby="finale-title">
      <div className="wrap finale__inner">
        <h2 id="finale-title" className="display">
          {finale.title}
        </h2>
        <div className="finale__side">
          <p>
            Звоните или пишите — поможем выбрать. {site.contacts.hours}
          </p>
          <div className="finale__cta">
            <a className="btn btn--solid" href={finale.cta.href} onClick={go(finale.cta.href)}>
              {finale.cta.label}
            </a>
            <a className="btn btn--line" href={site.contacts.phoneHref}>
              {site.contacts.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Подвал ---------------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <span className="footer__logo">{site.brand}</span>
          <p>
            {site.brandTagline}. {site.city}
          </p>
        </div>
        <nav aria-label="Навигация в подвале">
          {site.nav.map((n) => (
            <a key={n.href} href={n.href} className="link" onClick={go(n.href)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div>
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
          {site.socials
            .filter((s) => s.href)
            .map((s) => (
              <a key={s.id} className="link" href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
        </div>
      </div>
      <div className="wrap footer__legal">
        <p>Демонстрационный сайт. Контакты, цены, условия и отзывы — пример наполнения и не относятся к реальному магазину. Фото: Unsplash</p>
        <p>
          © {new Date().getFullYear()} {site.brand}
        </p>
      </div>
    </footer>
  );
}
