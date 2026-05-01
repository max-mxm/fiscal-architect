import type { FiscalYear, CalendarMonth } from '~/types';

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
] as const;

export const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
] as const;

export const DAY_HEADERS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] as const;

export function createEmptyFiscalYear(year: number): FiscalYear {
  const months: CalendarMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    workedDays: [],
    halfDays: [],
  }));
  return { year, months };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Retourne 0 (Lu) – 6 (Di) pour le 1er du mois. */
export function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Dimanche
  return day === 0 ? 6 : day - 1;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

/** Calcul de la date de Pâques (algorithme de Meeus). */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Set de clés (mois*100+jour) + Map des libellés des jours fériés français. */
export function getJoursFeries(year: number): { set: Set<number>; names: Map<number, string> } {
  const easter = getEasterDate(year);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const lundiPaques = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const lundiPentecote = addDays(easter, 50);

  const entries: [Date, string][] = [
    [new Date(year, 0, 1), 'Jour de l\'An'],
    [lundiPaques, 'Lundi de Pâques'],
    [new Date(year, 4, 1), 'Fête du Travail'],
    [new Date(year, 4, 8), 'Victoire 1945'],
    [ascension, 'Ascension'],
    [lundiPentecote, 'Lundi de Pentecôte'],
    [new Date(year, 6, 14), 'Fête nationale'],
    [new Date(year, 7, 15), 'Assomption'],
    [new Date(year, 10, 1), 'Toussaint'],
    [new Date(year, 10, 11), 'Armistice'],
    [new Date(year, 11, 25), 'Noël'],
  ];

  const set = new Set<number>();
  const names = new Map<number, string>();
  for (const [d, name] of entries) {
    const key = d.getMonth() * 100 + d.getDate();
    set.add(key);
    names.set(key, name);
  }
  return { set, names };
}

export function formatDaysFR(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export function formatDateFR(date: Date): { day: number; monthName: string; year: number } {
  return {
    day: date.getDate(),
    monthName: MONTH_NAMES[date.getMonth()],
    year: date.getFullYear(),
  };
}
