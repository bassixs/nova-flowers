/**
 * Слой обработки заказов. Сейчас подключён ДЕМО-адаптер: ничего никуда не отправляется.
 *
 * Чтобы подключить реальный канал, реализуйте OrderAdapter и замените activeAdapter.
 * ВАЖНО: токены Telegram-бота / CRM нельзя хранить во фронтенде (GitHub Pages — статический
 * хостинг, код виден всем). Используйте свой сервер или serverless-функцию
 * (Cloudflare Workers, Yandex Cloud Functions, Vercel) как прокси — пример ниже.
 */
export interface OrderItem {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
}

export interface Order {
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  customer: { name: string; phone: string };
  recipient: { name: string; phone: string; callBefore: boolean };
  delivery: { address: string; date: string; slot: string; zone: string };
  card: string;
  comment: string;
  createdAt: string;
}

export type OrderResult = { ok: true; id: string; demo: boolean } | { ok: false; error: string };

export interface OrderAdapter {
  name: string;
  submit(order: Order): Promise<OrderResult>;
}

/** Демо: имитирует обработку, заказ не уходит за пределы браузера. */
export const demoAdapter: OrderAdapter = {
  name: 'demo',
  async submit(order) {
    await new Promise((r) => setTimeout(r, 900));
    console.info('[FLEURÉ demo] заявка сформирована (не отправлена):', order);
    return { ok: true, id: 'DEMO-' + Math.random().toString(36).slice(2, 7).toUpperCase(), demo: true };
  },
};

/**
 * Пример будущей интеграции: отправка на ваш endpoint, который уже сам
 * пересылает заказ в Telegram / MAX / amoCRM / Bitrix24 / RetailCRM.
 *
 * export const webhookAdapter = (endpoint: string): OrderAdapter => ({
 *   name: 'webhook',
 *   async submit(order) {
 *     const r = await fetch(endpoint, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(order),
 *     });
 *     if (!r.ok) return { ok: false, error: 'Не удалось отправить заказ' };
 *     const data = await r.json();
 *     return { ok: true, id: data.id, demo: false };
 *   },
 * });
 */

export const activeAdapter: OrderAdapter = demoAdapter;
