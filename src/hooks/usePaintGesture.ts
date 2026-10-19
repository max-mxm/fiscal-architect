import { useCallback, useEffect, useRef } from 'react';

export type DayState = 'empty' | 'full' | 'half';

interface Options {
  /** Jour verrouillé (week-end, férié). */
  isLocked: (day: number) => boolean;
  getState: (day: number) => DayState;
  cycle: (day: number) => void;
  paint: (day: number, add: boolean) => void;
  /** Délai d'appui long avant de peindre au doigt. */
  longPressMs?: number;
}

const MOVE_TOLERANCE = 10;

/**
 * Pointage unifié souris / doigt / stylet.
 * - Clic ou toucher : cycle vide → plein → demi → vide (via `onClick`, donc
 *   aussi au clavier et au lecteur d'écran).
 * - Souris : cliquer-glisser peint immédiatement.
 * - Doigt : appui long puis glisser peint ; un glissement sans appui long
 *   reste un défilement de page.
 * La cellule sous le doigt est retrouvée par `elementFromPoint`, car le
 * tactile ne déclenche pas d'événements d'entrée sur les autres cellules.
 */
export function usePaintGesture({ isLocked, getState, cycle, paint, longPressMs = 260 }: Options) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ day: number; x: number; y: number; touch: boolean } | null>(null);
  const painting = useRef(false);
  const mode = useRef<'add' | 'remove'>('add');
  const painted = useRef<Set<number>>(new Set());
  const timer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const applyTo = useCallback(
    (day: number) => {
      if (isLocked(day) || painted.current.has(day)) return;
      painted.current.add(day);
      paint(day, mode.current === 'add');
    },
    [isLocked, paint],
  );

  const beginPaint = useCallback(() => {
    const s = start.current;
    if (!s) return;
    painting.current = true;
    applyTo(s.day);
    if (s.touch && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        /* sans retour haptique */
      }
    }
  }, [applyTo]);

  const dayAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest<HTMLElement>('[data-day]');
    if (!cell || !gridRef.current?.contains(cell)) return null;
    const d = Number(cell.dataset.day);
    return Number.isFinite(d) ? d : null;
  };

  const onPointerDown = useCallback(
    (day: number, e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (isLocked(day)) return;
      const touch = e.pointerType !== 'mouse';
      start.current = { day, x: e.clientX, y: e.clientY, touch };
      painting.current = false;
      painted.current = new Set();
      mode.current = getState(day) === 'empty' ? 'add' : 'remove';
      clearTimer();
      if (touch) timer.current = window.setTimeout(beginPaint, longPressMs);
    },
    [isLocked, getState, beginPaint, longPressMs],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      if (!painting.current) {
        const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE;
        if (s.touch) {
          // Le doigt a bougé avant l'appui long : c'est un défilement.
          if (moved) {
            clearTimer();
            start.current = null;
          }
          return;
        }
        const d = dayAt(e.clientX, e.clientY);
        if (d != null && d !== s.day) beginPaint();
        else return;
      }
      const d = dayAt(e.clientX, e.clientY);
      if (d != null) applyTo(d);
    };
    const onUp = () => {
      clearTimer();
      if (painting.current) suppressClick.current = true;
      painting.current = false;
      start.current = null;
    };
    // Bloque le défilement pendant qu'on peint au doigt.
    const onTouchMove = (e: TouchEvent) => {
      if (painting.current && e.cancelable) e.preventDefault();
    };
    const grid = gridRef.current;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    grid?.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      grid?.removeEventListener('touchmove', onTouchMove);
      clearTimer();
    };
  }, [applyTo, beginPaint]);

  const onClick = useCallback(
    (day: number) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      if (isLocked(day)) return;
      cycle(day);
    },
    [isLocked, cycle],
  );

  return { gridRef, onPointerDown, onClick };
}
