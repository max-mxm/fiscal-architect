import { useEffect, useState } from 'react';

/**
 * Reflète l'état de la media-query `prefers-reduced-motion: reduce`.
 *
 * Côté SSR (TanStack Start), `window` est indisponible — on retourne `false`
 * tant que l'effet n'a pas tourné côté client. La valeur se met à jour si
 * l'utilisateur change sa préférence sans recharger.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}
