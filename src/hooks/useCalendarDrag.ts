import { useCallback, useEffect, useRef } from 'react';

export type DayState = 'empty' | 'full' | 'half';

interface UseCalendarDragOptions {
  isWeekendCell: (monthIndex: number, day: number) => boolean;
  isJourFerie: (monthIndex: number, day: number) => boolean;
  getDayState: (monthIndex: number, day: number) => DayState;
  cycleDay: (monthIndex: number, day: number) => void;
  dragSetDay: (monthIndex: number, day: number, add: boolean) => void;
}

/**
 * Logique drag/tap 3 états pour la grille du calendrier (souris + tactile via Pointer Events).
 *
 * Au pointerdown sur une cellule, on prépare un drag potentiel ; on bascule en mode drag
 * dès que le pointeur entre dans une autre cellule. Si pointerup arrive sans drag,
 * on déclenche un cycle 3 états (vide → plein → demi → vide).
 *
 * Les weekends et les jours fériés sont entièrement verrouillés.
 */
export function useCalendarDrag({
  isWeekendCell,
  isJourFerie,
  getDayState,
  cycleDay,
  dragSetDay,
}: UseCalendarDragOptions) {
  const pressMonth = useRef<number>(-1);
  const pressDay = useRef<number>(-1);
  const dragging = useRef(false);
  const dragMode = useRef<'add' | 'remove'>('add');

  const onDayPointerDown = useCallback((monthIndex: number, day: number) => {
    if (isWeekendCell(monthIndex, day)) return;
    if (isJourFerie(monthIndex, day)) return;
    pressMonth.current = monthIndex;
    pressDay.current = day;
    dragging.current = false;
    // Mode drag déterminé par l'état initial : vide → add, sinon → remove
    dragMode.current = getDayState(monthIndex, day) === 'empty' ? 'add' : 'remove';
  }, [isWeekendCell, isJourFerie, getDayState]);

  const onDayPointerEnter = useCallback((monthIndex: number, day: number) => {
    if (pressMonth.current === -1) return;
    if (monthIndex !== pressMonth.current) return;
    if (isWeekendCell(monthIndex, day)) return;
    if (isJourFerie(monthIndex, day)) return;
    // Premier pointerenter sur une cellule différente : on entre en mode drag
    // et on applique aussi sur la cellule de départ (rien n'a été appliqué au pointerdown).
    if (!dragging.current && day !== pressDay.current) {
      dragging.current = true;
      dragSetDay(pressMonth.current, pressDay.current, dragMode.current === 'add');
    }
    if (dragging.current) {
      dragSetDay(monthIndex, day, dragMode.current === 'add');
    }
  }, [isWeekendCell, isJourFerie, dragSetDay]);

  const endPress = useCallback(() => {
    // Pas de drag → pointerup = tap simple → cycle 3 états
    if (pressMonth.current !== -1 && !dragging.current) {
      cycleDay(pressMonth.current, pressDay.current);
    }
    pressMonth.current = -1;
    pressDay.current = -1;
    dragging.current = false;
  }, [cycleDay]);

  const cancelPress = useCallback(() => {
    pressMonth.current = -1;
    pressDay.current = -1;
    dragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', endPress);
    window.addEventListener('pointercancel', cancelPress);
    return () => {
      window.removeEventListener('pointerup', endPress);
      window.removeEventListener('pointercancel', cancelPress);
    };
  }, [endPress, cancelPress]);

  return { onDayPointerDown, onDayPointerEnter };
}
