import { useEffect } from 'react';
import { prefersReducedMotion } from '../lib';

/**
 * Помечает документ классом motion / no-motion.
 * Анимации появления секций сознательно убраны: движение живёт только на первом экране.
 */
export function useRevealSystem() {
  useEffect(() => {
    document.documentElement.classList.add(prefersReducedMotion() ? 'no-motion' : 'motion');
  }, []);
}
