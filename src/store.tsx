import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { bouquets, sizes, type Bouquet, type Occasion, type SizeId } from './config/catalog';

export interface CartLine {
  key: string;
  id: string;
  size: SizeId;
  qty: number;
}

interface Toast {
  id: number;
  text: string;
}

interface Store {
  cart: CartLine[];
  add: (id: string, size?: SizeId, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  linePrice: (l: CartLine) => number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  active: Bouquet | null;
  openBouquet: (id: string | null) => void;
  occasion: Occasion | null;
  setOccasion: (o: Occasion | null) => void;
  toasts: Toast[];
  toast: (text: string) => void;
}

const Ctx = createContext<Store | null>(null);
const KEY = 'fleure-cart-v1';

export const unitPrice = (id: string, size: SizeId) => {
  const b = bouquets.find((x) => x.id === id);
  const k = sizes.find((s) => s.id === size)?.k ?? 1;
  return b ? Math.round((b.price * k) / 100) * 100 : 0;
};

function loadCart(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((l) => bouquets.some((b) => b.id === l.id)) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* приватный режим — корзина живёт до перезагрузки */
    }
  }, [cart]);

  const toast = useCallback((text: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const add = useCallback(
    (id: string, size: SizeId = 'M', qty = 1) => {
      const key = `${id}:${size}`;
      setCart((c) => {
        const ex = c.find((l) => l.key === key);
        if (ex) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l));
        return [...c, { key, id, size, qty }];
      });
      const b = bouquets.find((x) => x.id === id);
      toast(`«${b?.name}» добавлен в корзину`);
    },
    [toast],
  );

  const value = useMemo<Store>(() => {
    const linePrice = (l: CartLine) => unitPrice(l.id, l.size) * l.qty;
    return {
      cart,
      add,
      setQty: (key, qty) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l))),
      remove: (key) => setCart((c) => c.filter((l) => l.key !== key)),
      clear: () => setCart([]),
      count: cart.reduce((s, l) => s + l.qty, 0),
      subtotal: cart.reduce((s, l) => s + linePrice(l), 0),
      linePrice,
      cartOpen,
      setCartOpen,
      active: bouquets.find((b) => b.id === activeId) ?? null,
      openBouquet: setActiveId,
      occasion,
      setOccasion,
      toasts,
      toast,
    };
  }, [cart, add, cartOpen, activeId, occasion, toasts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
