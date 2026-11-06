import { useMemo, useState } from 'react';
import { bouquets, bouquetTypes, type BouquetType } from '../config/catalog';
import { moments } from '../config/content';
import { img, money, srcSet } from '../lib';
import { useStore } from '../store';

/** Цена на бирке — фирменная деталь: используется только там, где есть цена. */
export function PriceTag({ value, from }: { value: number; from?: boolean }) {
  return (
    <span className="tag">
      {from && <span className="tag__from">от </span>}
      {money(value)}
    </span>
  );
}

export function Collection() {
  const { add, openBouquet, occasion, setOccasion } = useStore();
  const [type, setType] = useState<BouquetType | 'all'>('all');

  const list = useMemo(
    () => bouquets.filter((b) => (type === 'all' || b.type === type) && (!occasion || b.occasions.includes(occasion))),
    [type, occasion],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: bouquets.length };
    bouquets.forEach((b) => (m[b.type] = (m[b.type] || 0) + 1));
    return m;
  }, []);
  const occ = moments.find((m) => m.id === occasion);

  return (
    <section id="collection" className="collection section" tabIndex={-1} aria-labelledby="collection-title">
      <div className="wrap">
        <header className="sec-head sec-head--split">
          <h2 id="collection-title" className="display">
            Букеты сезона
          </h2>
          <p className="sec-head__lead">
            Цена указана за размер M, как на фото. В карточке букета можно выбрать размер S или L и посмотреть состав
          </p>
        </header>

        <div className="filters" role="toolbar" aria-label="Фильтр букетов">
          {bouquetTypes.map((t) => (
            <button key={t.id} type="button" className={`ftab${type === t.id ? ' is-active' : ''}`} aria-pressed={type === t.id} onClick={() => setType(t.id)}>
              {t.label}
              <span className="ftab__n">{counts[t.id] ?? 0}</span>
            </button>
          ))}
          {occ && (
            <button type="button" className="ftab ftab--occ" onClick={() => setOccasion(null)} aria-label={`Сбросить повод: ${occ.title}`}>
              Повод: {occ.title}
              <span aria-hidden="true" className="ftab__x">
                ×
              </span>
            </button>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          Показано букетов: {list.length}
        </p>

        {list.length === 0 ? (
          <div className="empty">
            <p>По этому сочетанию пока ничего нет. Флорист соберёт букет под ваш запрос</p>
            <button type="button" className="btn btn--line" onClick={() => { setType('all'); setOccasion(null); }}>
              Показать все букеты
            </button>
          </div>
        ) : (
          <ul className="grid">
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
                    width="800"
                    height="1000"
                  />
                </button>
                <div className="card__body">
                  <h3 className="card__name">
                    <button type="button" onClick={() => openBouquet(b.id)}>
                      {b.name}
                    </button>
                  </h3>
                  <p className="card__short">
                    {b.short}
                    {b.badge && <span className="card__badge"> · {b.badge.toLowerCase()}</span>}
                  </p>
                  <div className="card__row">
                    <PriceTag value={b.price} />
                    <button type="button" className="btn btn--line card__add" onClick={() => add(b.id)} aria-label={`Добавить «${b.name}» в корзину`}>
                      В корзину
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
