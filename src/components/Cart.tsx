import { useCallback, useMemo, useRef, useState } from 'react';
import { bouquets } from '../config/catalog';
import { delivery } from '../config/delivery';
import { site } from '../config/site';
import { img, money, plural } from '../lib';
import { activeAdapter, type Order } from '../services/orders';
import { unitPrice, useStore } from '../store';
import { useDialog } from '../hooks/useDialog';

type Step = 'cart' | 'form' | 'done';

interface Form {
  name: string;
  phone: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  zone: string;
  date: string;
  slot: string;
  card: string;
  comment: string;
  callBefore: boolean;
  agree: boolean;
}

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const digits = (s: string) => s.replace(/\D/g, '');

/** Мягкая маска телефона: +7 (900) 000-00-00 */
function formatPhone(v: string) {
  let d = digits(v);
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = '+7';
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3) out += ')';
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  return out;
}

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Укажите имя';
  if (digits(f.phone).length !== 11) e.phone = 'Введите телефон полностью: +7 и 10 цифр';
  if (f.recipientPhone && digits(f.recipientPhone).length !== 11) e.recipientPhone = 'Проверьте номер получателя';
  if (f.address.trim().length < 6) e.address = 'Укажите адрес: улица, дом, квартира';
  if (!f.date) e.date = 'Выберите дату';
  else if (f.date < todayISO()) e.date = 'Дата не может быть в прошлом';
  if (!f.slot) e.slot = 'Выберите интервал';
  if (f.card.length > 200) e.card = 'Не более 200 символов';
  if (!f.agree) e.agree = 'Подтвердите, что понимаете демо-режим';
  return e;
}

export function Cart() {
  const { cart, cartOpen, setCartOpen, setQty, remove, subtotal, linePrice, count, clear, toast } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>('cart');
  const [closing, setClosing] = useState(false);
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Form>({
    name: '', phone: '', recipient: '', recipientPhone: '', address: '', zone: delivery.zones[1].name,
    date: todayISO(), slot: '', card: '', comment: '', callBefore: false, agree: false,
  });

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setCartOpen(false);
      setStep((s) => (s === 'done' ? 'cart' : s));
    }, 320);
  }, [setCartOpen]);

  useDialog(cartOpen && !closing, ref, close);

  const zone = delivery.zones.find((z) => z.name === form.zone) ?? delivery.zones[1];
  const fee = zone.price === 0 && subtotal < delivery.freeFrom ? delivery.cityFee : zone.price;
  const errors = useMemo(() => validate(form), [form]);
  const show = (k: keyof Form) => (touched[k] || submitted) && errors[k];

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: keyof Form) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      const order: (keyof Form)[] = ['name', 'phone', 'recipientPhone', 'address', 'date', 'slot', 'card', 'agree'];
      const firstKey = order.find((k) => errors[k]);
      if (firstKey) document.getElementById(`f-${firstKey}`)?.focus();
      toast('Проверьте поля, отмеченные красным');
      return;
    }
    setSending(true);
    const order: Order = {
      items: cart.map((l) => ({
        id: l.id,
        name: bouquets.find((b) => b.id === l.id)?.name ?? l.id,
        size: l.size,
        qty: l.qty,
        price: unitPrice(l.id, l.size),
      })),
      total: subtotal + fee,
      deliveryFee: fee,
      customer: { name: form.name.trim(), phone: form.phone },
      recipient: { name: form.recipient.trim(), phone: form.recipientPhone, callBefore: form.callBefore },
      delivery: { address: form.address.trim(), date: form.date, slot: form.slot, zone: form.zone },
      card: form.card.trim(),
      comment: form.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    const res = await activeAdapter.submit(order);
    setSending(false);
    if (res.ok) {
      setOrderId(res.id);
      setStep('done');
      clear();
      setSubmitted(false);
      setTouched({});
      ref.current?.querySelector<HTMLElement>('.drawer__scroll')?.scrollTo(0, 0);
    } else {
      toast(res.error);
    }
  };

  if (!cartOpen) return null;

  const field = (k: keyof Form, label: string, input: React.ReactNode, hint?: string) => (
    <div className={`field${show(k) ? ' has-error' : ''}`}>
      <label htmlFor={`f-${k}`}>{label}</label>
      {input}
      {show(k) ? (
        <span className="field__err" id={`e-${k}`} role="alert">
          {errors[k]}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
  const aria = (k: keyof Form) => ({
    id: `f-${k}`,
    'aria-invalid': show(k) ? (true as const) : undefined,
    'aria-describedby': show(k) ? `e-${k}` : undefined,
    onBlur: blur(k),
  });

  return (
    <div className={`overlay overlay--drawer${closing ? ' is-closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer__head">
          <h2 id="cart-title">{step === 'cart' ? 'Корзина' : step === 'form' ? 'Оформление' : 'Заявка сформирована'}</h2>
          <button type="button" className="icon-close" onClick={close} aria-label="Закрыть корзину">
            <i />
            <i />
          </button>
        </div>
        {site.demoMode && step !== 'done' && (
          <p className="drawer__demo">Демо-режим: заказы не отправляются и не оплачиваются.</p>
        )}

        <div className="drawer__scroll">
          {step === 'cart' &&
            (cart.length === 0 ? (
              <div className="drawer__empty">
                <p>Здесь пока пусто.</p>
                <button
                  type="button"
                  className="btn btn--line"
                  onClick={() => {
                    close();
                    setTimeout(() => document.querySelector('#collection')?.scrollIntoView({ behavior: 'smooth' }), 340);
                  }}
                >
                  <span>Перейти к букетам</span>
                </button>
              </div>
            ) : (
              <ul className="lines">
                {cart.map((l) => {
                  const b = bouquets.find((x) => x.id === l.id)!;
                  return (
                    <li key={l.key} className="line">
                      <img src={img(b.image)} alt="" />
                      <div>
                        <h3>{b.name}</h3>
                        <p>Размер {l.size} · {money(unitPrice(l.id, l.size))}</p>
                        <div className="qty qty--sm" role="group" aria-label={`Количество «${b.name}»`}>
                          <button type="button" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label="Меньше">
                            −
                          </button>
                          <output>{l.qty}</output>
                          <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Больше">
                            +
                          </button>
                        </div>
                      </div>
                      <div className="line__end">
                        <b>{money(linePrice(l))}</b>
                        <button type="button" className="link line__rm" onClick={() => remove(l.key)} aria-label={`Удалить «${b.name}»`}>
                          Удалить
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}

          {step === 'form' && (
            <form id="checkout" className="checkout" noValidate onSubmit={submit}>
              <fieldset>
                <legend>Заказчик</legend>
                {field('name', 'Ваше имя *', <input {...aria('name')} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />)}
                {field('phone', 'Телефон *', <input {...aria('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} />)}
              </fieldset>
              <fieldset>
                <legend>Получатель</legend>
                {field('recipient', 'Имя получателя', <input {...aria('recipient')} value={form.recipient} onChange={(e) => set('recipient', e.target.value)} />, 'Если дарите — укажите, кому')}
                {field('recipientPhone', 'Телефон получателя', <input {...aria('recipientPhone')} type="tel" inputMode="tel" value={form.recipientPhone} onChange={(e) => set('recipientPhone', formatPhone(e.target.value))} />)}
                <label className="check">
                  <input type="checkbox" checked={form.callBefore} onChange={(e) => set('callBefore', e.target.checked)} />
                  <span>Позвонить получателю перед доставкой</span>
                </label>
              </fieldset>
              <fieldset>
                <legend>Доставка</legend>
                {field('address', 'Адрес *', <input {...aria('address')} autoComplete="street-address" value={form.address} onChange={(e) => set('address', e.target.value)} />)}
                {field(
                  'zone',
                  'Зона',
                  <select {...aria('zone')} value={form.zone} onChange={(e) => set('zone', e.target.value)}>
                    {delivery.zones.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name} — {z.price ? money(z.price) : `бесплатно ${z.note}`}
                      </option>
                    ))}
                  </select>,
                )}
                <div className="field-row">
                  {field('date', 'Дата *', <input {...aria('date')} type="date" min={todayISO()} value={form.date} onChange={(e) => set('date', e.target.value)} />)}
                  {field(
                    'slot',
                    'Интервал *',
                    <select {...aria('slot')} value={form.slot} onChange={(e) => set('slot', e.target.value)}>
                      <option value="">Выберите</option>
                      {delivery.slots.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>,
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend>Детали</legend>
                {field('card', 'Текст открытки', <textarea {...aria('card')} rows={3} maxLength={220} value={form.card} onChange={(e) => set('card', e.target.value)} />, `${form.card.length}/200`)}
                {field('comment', 'Комментарий флористу', <textarea {...aria('comment')} rows={2} value={form.comment} onChange={(e) => set('comment', e.target.value)} />)}
                <label className={`check${show('agree') ? ' has-error' : ''}`}>
                  <input type="checkbox" id="f-agree" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} aria-invalid={show('agree') ? true : undefined} />
                  <span>Я понимаю, что это демонстрационный сайт и заказ не будет отправлен *</span>
                </label>
                {show('agree') && <span className="field__err" role="alert">{errors.agree}</span>}
              </fieldset>
            </form>
          )}

          {step === 'done' && (
            <div className="done">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" />
                <path d="M20 33l8 8 16-17" />
              </svg>
              <p className="done__id">Номер демо-заявки: {orderId}</p>
              <p>
                Так выглядит подтверждение для покупателя. <strong>Заказ не отправлен</strong> — сайт работает в
                демонстрационном режиме, оплата и доставка не производятся.
              </p>
              <p className="done__dev">
                При подключении бэкенда заявка будет уходить в Telegram, MAX или CRM салона (см. src/services/orders.ts).
              </p>
              <button type="button" className="btn btn--solid" onClick={close}>
                <span>Вернуться на сайт</span>
              </button>
            </div>
          )}
        </div>

        {step !== 'done' && cart.length > 0 && (
          <div className="drawer__foot">
            <div className="sum">
              <span>
                {count} {plural(count, ['букет', 'букета', 'букетов'])}
              </span>
              <span>{money(subtotal)}</span>
            </div>
            {step === 'form' && (
              <>
                <div className="sum">
                  <span>Доставка</span>
                  <span>{fee === 0 ? 'бесплатно' : money(fee)}</span>
                </div>
                <div className="sum sum--total">
                  <span>Итого</span>
                  <span>{money(subtotal + fee)}</span>
                </div>
              </>
            )}
            {step === 'cart' ? (
              <button type="button" className="btn btn--solid btn--wide" onClick={() => setStep('form')}>
                <span>Оформить заказ</span>
              </button>
            ) : (
              <div className="drawer__btns">
                <button type="button" className="btn btn--line" onClick={() => setStep('cart')}>
                  <span>Назад</span>
                </button>
                <button type="submit" form="checkout" className="btn btn--solid btn--wide" disabled={sending} aria-busy={sending}>
                  <span>{sending ? 'Формируем…' : 'Отправить демо-заявку'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
