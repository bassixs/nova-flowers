import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { scrollToHash } from '../lib';
import { useStore } from '../store';
import { useDialog } from '../hooks/useDialog';

export function Header() {
  const { count, setCartOpen } = useStore();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useDialog(menu, menuRef, () => setMenu(false));

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > window.innerHeight * 0.5);
      setHidden(y > window.innerHeight * 1.2 && y > lastY + 4);
      if (y < lastY - 4) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);
  useEffect(() => {
    prevCount.current = count;
  });

  const nav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenu(false);
    setTimeout(() => scrollToHash(href), menu ? 260 : 0);
  };

  return (
    <header className={`header${solid ? ' is-solid' : ''}${hidden && !menu ? ' is-hidden' : ''}${menu ? ' is-menu' : ''}`}>
      <div className="header__inner">
        <a className="logo" href="#top" onClick={(e) => nav(e, '#top')} aria-label={`${site.brand} — в начало`}>
          {site.brand}
        </a>
        <nav className="header__nav" aria-label="Основная навигация">
          {site.nav.map((n) => (
            <a key={n.href} href={n.href} className="link" onClick={(e) => nav(e, n.href)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="header__actions">
          <a className="header__phone link" href={site.contacts.phoneHref}>
            {site.contacts.phone}
          </a>
          <button
            type="button"
            className={`cart-btn${bump ? ' is-bump' : ''}`}
            onClick={() => setCartOpen(true)}
            aria-label={`Корзина, товаров: ${count}`}
          >
            <span>Корзина</span>
            <span className="cart-btn__count" aria-hidden="true">
              {count}
            </span>
          </button>
          <button
            type="button"
            className="burger"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenu((m) => !m)}
          >
            <i />
            <i />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mmenu${menu ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        hidden={!menu}
      >
        <nav className="mmenu__nav">
          {site.nav.map((n, i) => (
            <a key={n.href} href={n.href} onClick={(e) => nav(e, n.href)} style={{ ['--i' as string]: i }}>
              <small>0{i + 1}</small>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="mmenu__foot">
          <a href={site.contacts.phoneHref}>{site.contacts.phone}</a>
          <div>
            {site.socials
              .filter((s) => s.href)
              .map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
