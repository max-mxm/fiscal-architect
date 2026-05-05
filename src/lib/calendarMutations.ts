import type { CalendarMonth } from '~/types';
import { getDaysInMonth, isWeekend } from '~/lib/calendar';

type IsFerieFn = (monthIndex: number, day: number) => boolean;

/** Cycle 3 états pour un jour : vide → plein → demi → vide. */
export function cycleDayInMonths(
  months: CalendarMonth[],
  year: number,
  monthIndex: number,
  day: number,
  isFerie: IsFerieFn,
): CalendarMonth[] {
  if (isWeekend(year, monthIndex, day)) return months;
  if (isFerie(monthIndex, day)) return months;

  return months.map((m, i) => {
    if (i !== monthIndex) return m;
    const half = m.halfDays ?? [];
    const inFull = m.workedDays.includes(day);
    const inHalf = half.includes(day);
    if (!inFull && !inHalf) {
      return { ...m, workedDays: [...m.workedDays, day].sort((a, b) => a - b), halfDays: half };
    }
    if (inFull) {
      return {
        ...m,
        workedDays: m.workedDays.filter((d) => d !== day),
        halfDays: [...half, day].sort((a, b) => a - b),
      };
    }
    return { ...m, halfDays: half.filter((d) => d !== day) };
  });
}

/** Drag binaire : ajoute en plein (add=true) ou efface (add=false). */
export function dragSetDayInMonths(
  months: CalendarMonth[],
  year: number,
  monthIndex: number,
  day: number,
  add: boolean,
  isFerie: IsFerieFn,
): CalendarMonth[] {
  if (isWeekend(year, monthIndex, day)) return months;
  if (isFerie(monthIndex, day)) return months;

  return months.map((m, i) => {
    if (i !== monthIndex) return m;
    const half = m.halfDays ?? [];
    const inFull = m.workedDays.includes(day);
    const inHalf = half.includes(day);
    if (add) {
      if (inFull) return m;
      return {
        ...m,
        workedDays: [...m.workedDays, day].sort((a, b) => a - b),
        halfDays: inHalf ? half.filter((d) => d !== day) : half,
      };
    }
    if (!inFull && !inHalf) return m;
    return {
      ...m,
      workedDays: inFull ? m.workedDays.filter((d) => d !== day) : m.workedDays,
      halfDays: inHalf ? half.filter((d) => d !== day) : half,
    };
  });
}

function weekdaysOfMonth(year: number, monthIndex: number, isFerie: IsFerieFn): number[] {
  const total = getDaysInMonth(year, monthIndex);
  const days: number[] = [];
  for (let d = 1; d <= total; d++) {
    if (!isWeekend(year, monthIndex, d) && !isFerie(monthIndex, d)) days.push(d);
  }
  return days;
}

/** Remplit tous les jours ouvrés (hors weekends et fériés) d'un mois. */
export function fillMonthInMonths(
  months: CalendarMonth[],
  year: number,
  monthIndex: number,
  isFerie: IsFerieFn,
): CalendarMonth[] {
  return months.map((m, i) => {
    if (i !== monthIndex) return m;
    return { ...m, workedDays: weekdaysOfMonth(year, m.month, isFerie), halfDays: [] };
  });
}

/** Remplit tous les jours ouvrés sur les 12 mois. */
export function fillAllInMonths(
  months: CalendarMonth[],
  year: number,
  isFerie: IsFerieFn,
): CalendarMonth[] {
  return months.map((m) => ({
    ...m,
    workedDays: weekdaysOfMonth(year, m.month, isFerie),
    halfDays: [],
  }));
}

/** Vide un mois (jours pleins + demi-journées). */
export function clearMonthInMonths(months: CalendarMonth[], monthIndex: number): CalendarMonth[] {
  return months.map((m, i) => (i !== monthIndex ? m : { ...m, workedDays: [], halfDays: [] }));
}
