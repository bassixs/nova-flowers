import { useCallback, useEffect, useRef, useState } from 'react';
import { sizes, type SizeId } from '../config/catalog';
import { img, money, srcSet } from '../lib';
import { unitPrice, useStore } from '../store';
import { useDialog } from '../hooks/useDialog';

export function BouquetModal() {
  const { active, openBouquet, add, setCartOpen } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<SizeId>('M');
  const [qty, setQty] = useState(1);
  const [closing, setClosing] = useState(false);
  const open = !!active;

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      openBouquet(null);
    }, 280);
  }, [openBouquet]);

  useDialog(open && !closing, ref, close);

  useEffect(() => {
    if (active) {
      setSize('M');
      setQty(1);
    }
  }, [active]);

  if (!active) return null;
  const price = unitPrice(active.id, size);

  return (
    <div className={`overlay${closing ? ' is-closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className="pmodal" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <button type="button" className="icon-close" onClick={close} aria-label="Закрыть">
          <i />
          <i />
        </button>
        <div className="pmodal__media">
          <img src={img(active.image, 1600)} srcSet={srcSet(active.image)} sizes="(max-width: 800px) 100vw, 50vw" alt={`Букет «${active.name}»`} />
        </div>
        <div className="pmodal__body">
          <p className="kicker">{active.short}</p>
          <h2 id="pm-title" className="pmodal__title">
            {active.name}
          </h2>
          <p className="pmodal__desc">{active.description}</p>

          <h3 className="pmodal__label">Состав</h3>
          <ul className="pmodal__comp">
            {active.composition.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <fieldset className="sizes">
            <legend className="pmodal__label">Размер</legend>
            {sizes.map((s) => (
              <label key={s.id} className={`size${size === s.id ? ' is-active' : ''}`}>
                <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} />
                <b>{s.label}</b>
                <span>{s.note}</span>
                <em>{money(unitPrice(active.id, s.id))}</em>
              </label>
            ))}
          </fieldset>

          <div className="pmodal__buy">
            <div className="qty" role="group" aria-label="Количество">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Меньше" disabled={qty <= 1}>
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Больше">
                +
              </button>
            </div>
            <button
              type="button"
              className="btn btn--solid btn--wide"
              data-autofocus
              onClick={() => {
                add(active.id, size, qty);
                close();
              }}
            >
              <span>В корзину · {money(price * qty)}</span>
            </button>
          </div>
          <button
            type="button"
            className="link pmodal__quick"
            onClick={() => {
              add(active.id, size, qty);
              openBouquet(null);
              setCartOpen(true);
            }}
          >
            Оформить сразу →
          </button>
          <p className="pmodal__note">Фото готового букета пришлём перед отправкой. Оттенки сезонных цветов могут немного отличаться.</p>
        </div>
      </div>
    </div>
  );
}
