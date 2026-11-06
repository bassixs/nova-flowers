/**
 * ГЛАВНЫЙ ФАЙЛ АДАПТАЦИИ ПОД КОНКРЕТНЫЙ САЛОН.
 * Все контакты ниже — демонстрационные и не принадлежат реальному магазину.
 */
export const site = {
  brand: 'FLEURÉ',
  brandTagline: 'Цветочная мастерская',
  city: 'Калуга',
  currency: '₽',
  locale: 'ru-RU',

  seo: {
    title: 'FLEURÉ — авторские букеты с доставкой',
    description:
      'Авторские букеты из пионов, садовых роз и сезонных цветов. Доставка по городу в удобное время, фото букета перед отправкой.',
  },

  contacts: {
    phone: '+7 (900) 000-00-00',
    phoneHref: 'tel:+79000000000',
    email: 'hello@fleure.example',
    address: 'ул. Цветочная, 1 (демо-адрес)',
    hours: 'Ежедневно 9:00–21:00',
  },

  /** Ссылки на мессенджеры и соцсети. Пустая строка = пункт скрывается. */
  socials: [
    { id: 'telegram', label: 'Telegram', href: 'https://t.me/' },
    { id: 'max', label: 'MAX', href: 'https://max.ru/' },
    { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/' },
    { id: 'vk', label: 'VK', href: 'https://vk.com/' },
    { id: 'instagram', label: 'Instagram', href: '' },
  ],

  nav: [
    { href: '#collection', label: 'Каталог' },
    { href: '#moments', label: 'Поводы' },
    { href: '#how', label: 'Как заказать' },
    { href: '#delivery', label: 'Доставка' },
    { href: '#reviews', label: 'Отзывы' },
    { href: '#faq', label: 'Вопросы' },
  ],

  /** Демо-режим: формы не отправляют реальных заказов. */
  demoMode: true,
} as const;
