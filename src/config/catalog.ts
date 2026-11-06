/**
 * Демонстрационный каталог. Названия, состав и цены условные.
 * image — базовое имя файла в public/images (используются -800 и -1600 .webp).
 */
export type BouquetType = 'peony' | 'rose' | 'author' | 'wedding';
export type Occasion = 'birthday' | 'love' | 'nooccasion' | 'wedding' | 'event';

export interface Bouquet {
  id: string;
  name: string;
  short: string;
  description: string;
  composition: string[];
  price: number; // цена размера M
  type: BouquetType;
  occasions: Occasion[];
  image: string;
  badge?: string;
}

export const bouquetTypes: { id: BouquetType | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'peony', label: 'Пионы' },
  { id: 'rose', label: 'Розы' },
  { id: 'author', label: 'Авторские' },
  { id: 'wedding', label: 'Свадебные' },
];

/** Размеры и множители цены. */
export const sizes = [
  { id: 'S', label: 'S', note: 'камерный', k: 0.75 },
  { id: 'M', label: 'M', note: 'как на фото', k: 1 },
  { id: 'L', label: 'L', note: 'щедрый', k: 1.45 },
] as const;
export type SizeId = (typeof sizes)[number]['id'];

export const bouquets: Bouquet[] = [
  {
    id: 'blush',
    name: 'Румянец',
    short: 'Пионы сорта Sarah Bernhardt',
    description:
      'Пышные розовые пионы, собранные в свободную воздушную форму. Букет, который раскрывается у вас дома ещё два-три дня.',
    composition: ['Пион Sarah Bernhardt', 'Пион в бутоне', 'Эвкалипт', 'Крафт-упаковка'],
    price: 8900,
    type: 'peony',
    occasions: ['love', 'birthday'],
    image: 'peony-blush',
    badge: 'Сезон',
  },
  {
    id: 'morning',
    name: 'Утро у окна',
    short: 'Пионы в стеклянной вазе',
    description:
      'Нежная композиция в низкой вазе — для гостиной, стола в ресторане или утреннего сюрприза.',
    composition: ['Пион', 'Садовая роза', 'Ваза из стекла'],
    price: 11400,
    type: 'peony',
    occasions: ['nooccasion', 'love'],
    image: 'peony-window',
  },
  {
    id: 'silence',
    name: 'Белая тишина',
    short: 'Белые пионы и зелень',
    description:
      'Монохромный букет молочных пионов с садовой зеленью. Спокойная, очень дорогая по ощущению классика.',
    composition: ['Пион Duchesse de Nemours', 'Садовая зелень', 'Шёлковая лента'],
    price: 9600,
    type: 'peony',
    occasions: ['wedding', 'event'],
    image: 'peony-white',
  },
  {
    id: 'coral',
    name: 'Коралловый шарм',
    short: 'Пионы Coral Charm',
    description:
      'Редкий коралловый сорт, который на глазах меняет оттенок от кораллового к персиковому.',
    composition: ['Пион Coral Charm', 'Пион Coral Sunset'],
    price: 10500,
    type: 'peony',
    occasions: ['birthday', 'event'],
    image: 'peony-coral',
    badge: 'Редкий сорт',
  },
  {
    id: 'whisper',
    name: 'Розовый шёпот',
    short: 'Кустовые и садовые розы',
    description:
      'Розы нескольких оттенков розового в матовой упаковке. Лёгкий, девичий, очень фотогеничный.',
    composition: ['Садовая роза', 'Кустовая роза', 'Танацетум', 'Матовая плёнка'],
    price: 6700,
    type: 'rose',
    occasions: ['birthday', 'love', 'nooccasion'],
    image: 'roses-wrap',
  },
  {
    id: 'sunset',
    name: 'Персиковый закат',
    short: 'Садовые розы и альстромерии',
    description:
      'Тёплая персиковая гамма с акцентами тёмных хризантем — сочно, празднично, по-взрослому.',
    composition: ['Роза Juliet', 'Альстромерия', 'Хризантема', 'Сезонная зелень'],
    price: 7800,
    type: 'author',
    occasions: ['birthday', 'event'],
    image: 'roses-peach',
  },
  {
    id: 'garden',
    name: 'Сад после дождя',
    short: 'Авторский микс',
    description:
      'Щедрая садовая композиция с текстурной зеленью и мелкими цветами — ощущение только что собранного сада.',
    composition: ['Роза', 'Скабиоза', 'Эвкалипт', 'Брунии', 'Сезонные цветы'],
    price: 12900,
    type: 'author',
    occasions: ['event', 'nooccasion'],
    image: 'garden-mix',
    badge: 'Хит',
  },
  {
    id: 'vow',
    name: 'Обещание',
    short: 'Букет невесты',
    description:
      'Компактный свадебный букет из персиковых и кремовых роз с гипсофилой. Собирается под платье и образ.',
    composition: ['Пионовидная роза', 'Гипсофила', 'Эвкалипт', 'Лента из шёлка'],
    price: 9200,
    type: 'wedding',
    occasions: ['wedding'],
    image: 'bridal',
  },
  {
    id: 'ranunculus',
    name: 'Пастель',
    short: 'Ранункулюсы',
    description:
      'Многослойные ранункулюсы в пастельной палитре — лёгкий и необычный подарок без повода.',
    composition: ['Ранункулюс', 'Ранункулюс Cloni', 'Бумажная упаковка'],
    price: 5900,
    type: 'author',
    occasions: ['nooccasion', 'love'],
    image: 'ranunculus',
  },
  {
    id: 'mini',
    name: 'Комплимент',
    short: 'Мини-букет',
    description: 'Маленький букет, чтобы просто сказать «я думаю о тебе».',
    composition: ['Сухоцветы', 'Сезонный цветок', 'Лента'],
    price: 2400,
    type: 'author',
    occasions: ['nooccasion', 'love'],
    image: 'mini',
  },
];
