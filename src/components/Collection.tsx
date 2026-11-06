import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { bouquets, bouquetTypes, type BouquetType } from '../config/catalog';
import { moments } from '../config/content';
import { img, money, prefersReducedMotion, srcSet } from '../lib';
import { useStore } from '../store';

export function Collection() {
  const { add, openBouquet, occasion, setOccasion } = useStore();
  const [type, setType] = useState<BouquetType | 'all'>('all');
  const gridRef = useRef<HTMLUListElement>(null);

  const list = useMemo(
    () =>
      bouquets.filter((b) => (type === 'all' || b.type === type) && (!occasion || b.occasions.includes(occasion))),
    [type, occasion],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: bouquets.length };
    bouquets.forEach((b) => (m[b.type] = (m[b.type] || 0) + 1));
    return m;
  }, []);

  // мягкое появление карточек при смене фильтра
  useLayoutEffect(() => {
    if (!gridRef.current || prefersReducedMotion()) return;
    const items = gridRef.current.querySelectorAll('.card');
    gsap.fromTo(items, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' });
  }, [type, occasion]);

  const occ = moments.find((m) => m.id === occasion);

  return (
    <section id="collection" className="collection section" tabIndex={-1} aria-labelledby="collection-title">
      <div className="wrap">
        <header className="collection__head">
          <p className="kicker" data-reveal="fade">Каталог</p>
          <h2 id="collection-title" className="display" data-reveal="lines">
            Букеты <em>сезона</em>
          </h2>
          <p className="collection__lead" data-reveal="fade">
            Цена — за размер M, как на фото. Нажмите на букет, чтобы посмотреть состав и выбрать размер S или L.
          </p>
        </header>

        <div className="filters" role="toolbar" aria-label="Фильтр букетов">
          {bouquetTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip${type === t.id ? ' is-active' : ''}`}
              aria-pressed={type === t.id}
              onClick={() => setType(t.id)}
            >
              {t.label}
              <sup>{counts[t.id] ?? 0}</sup>
            </button>
          ))}
          {occ && (
            <button type="button" className="chip chip--occasion is-active" onClick={() => setOccasion(null)} aria-label={`Сбросить повод: ${occ.title}`}>
              Повод: {occ.title} <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          Показано букетов: {list.length}
        </p>

        {list.length === 0 ? (
          <div className="empty">
            <p>По этому сочетанию пока ничего нет — но флорист соберёт букет под ваш запрос.</p>
            <button type="button" className="btn btn--line" onClick={() => { setType('all'); setOccasion(null); }}>
              <span>Показать все букеты</span>
            </button>
          </div>
        ) : (
          <ul className="grid" ref={gridRef}>
            {list.map((b) => (
              <li key={b.id} className="card">
                <button type="button" className="card__media" onClick={() => openBouquet(b.id)} aria-label={`Подробнее о букете «${b.name}»`}>
                  <img
                    src={img(b.image)}
                    srcSet={srcSet(b.image)}
                    sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 30vw"
                    alt={`Букет «${b.name}» — ${b.short.toLowerCase()}`}
                    loading="lazy"
                    decoding="async"
                  />
                  {b.badge && <span className="card__badge">{b.badge}</span>}
                  <span className="card__more" aria-hidden="true">
                    Подробнее <i>→</i>
                  </span>
                </button>
                <div className="card__body">
                  <h3 className="card__name">{b.name}</h3>
                  <p className="card__short">{b.short}</p>
                  <div className="card__row">
                    <span className="card__price">{money(b.price)}</span>
                    <button type="button" className="add-btn" onClick={() => add(b.id)} aria-label={`Добавить «${b.name}» в корзину`}>
                      <span className="add-btn__plus" aria-hidden="true" />
                      <span className="add-btn__label">В корзину</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
