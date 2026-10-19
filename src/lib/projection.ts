import type { CalendarMonth, RevenueEntry, UserProfile } from '~/types';
import { getDaysInMonth, getJoursFeries, isWeekend } from '~/lib/calendar';
import { calcCAYearFromEntries, monthHasRevenueForModel } from '~/lib/fiscal';

export interface ProjectMonthsOptions {
  /** Année consultée. */
  year: number;
  /** Premier mois (0..11) à projeter s'il est vide (mois courant pour l'année en cours). */
  currentMonthIndex: number;
  /** Fériés (mois 0..11, jour). Défaut : jours fériés français de `year`. */
  isJourFerie?: (month: number, day: number) => boolean;
  /** Date du jour, pour reconnaître une année passée. Défaut : maintenant. */
  today?: Date;
}

function businessDays(
  year: number,
  monthIndex: number,
  count: number,
  isJourFerie: (month: number, day: number) => boolean,
): number[] {
  const days: number[] = [];
  const total = getDaysInMonth(year, monthIndex);
  for (let d = 1; d <= total && days.length < count; d++) {
    if (!isWeekend(year, monthIndex, d) && !isJourFerie(monthIndex, d)) days.push(d);
  }
  return days;
}

function isProjectable(
  month: CalendarMonth,
  profile: UserProfile,
  opts: ProjectMonthsOptions,
): boolean {
  if (profile.revenueModel !== 'days' && profile.revenueModel !== 'mixed') return false;
  const today = opts.today ?? new Date();
  if (opts.year < today.getFullYear()) return false;
  if (month.month < opts.currentMonthIndex) return false;
  const hasDays = month.workedDays.length > 0 || (month.halfDays?.length ?? 0) > 0;
  return !hasDays && !monthHasRevenueForModel(month, profile.revenueModel);
}

/**
 * Projection des mois futurs (règle unique, auparavant dupliquée dans les
 * pages) : en mode `days` ou `mixed` seulement, chaque mois sans saisie dont
 * l'index est ≥ `currentMonthIndex` reçoit les N premiers jours ouvrés (hors
 * week-ends et fériés), N = `profile.workingDays`. Une année passée n'est
 * jamais projetée. Les mois non projetés sont renvoyés tels quels (même
 * référence) ; l'entrée n'est pas mutée.
 */
export function projectMonths(
  months: CalendarMonth[],
  profile: UserProfile,
  opts: ProjectMonthsOptions,
): CalendarMonth[] {
  let isJourFerie = opts.isJourFerie;
  if (!isJourFerie) {
    const feries = getJoursFeries(opts.year).set;
    isJourFerie = (m: number, d: number) => feries.has(m * 100 + d);
  }
  const count = Math.max(0, Math.floor(profile.workingDays));
  return months.map((m) => {
    if (!isProjectable(m, profile, opts)) return m;
    return { ...m, workedDays: businessDays(opts.year, m.month, count, isJourFerie), halfDays: [] };
  });
}

/** Index (0..11) des mois que `projectMonths` extrapole. */
export function projectedMonthIndexes(
  months: CalendarMonth[],
  profile: UserProfile,
  opts: ProjectMonthsOptions,
): number[] {
  return months.filter((m) => isProjectable(m, profile, opts)).map((m) => m.month);
}

/** CA annuel projeté : CA saisi + extrapolation des mois futurs sans saisie. */
export function calcCAProjected(
  months: CalendarMonth[],
  profile: UserProfile,
  opts: ProjectMonthsOptions,
): number {
  return calcCAYearFromEntries(projectMonths(months, profile, opts), profile);
}

// --- Réalisé à date ---

export interface YearProgress {
  /** Mois courant (0..11) : 11 pour une année passée, 0 pour une année future. */
  currentMonthIndex: number;
  /** Jour du mois courant : 31 pour une année passée, 0 pour une année future. */
  todayDate: number;
}

/**
 * Curseur « à date » d'une année consultée, identique à celui du contexte
 * calendrier : année passée entièrement réalisée, année future pas du tout.
 */
export function getYearProgress(year: number, today: Date = new Date()): YearProgress {
  const realYear = today.getFullYear();
  if (year < realYear) return { currentMonthIndex: 11, todayDate: 31 };
  if (year > realYear) return { currentMonthIndex: 0, todayDate: 0 };
  return { currentMonthIndex: today.getMonth(), todayDate: today.getDate() };
}

/**
 * Restreint les mois au réalisé à date (mêmes règles que
 * `calcCaRealiseFromEntries`) : mois passés intacts, mois futurs vidés, mois
 * courant limité aux jours et forfaits ≤ `todayDate`, montants mensuels au
 * prorata `todayDate / jours du mois`. Permet de réutiliser tous les calculs
 * (ventilation par activité, ACRE, net) sur le réalisé. L'entrée n'est pas mutée.
 */
export function monthsThroughDate(
  months: CalendarMonth[],
  currentMonthIndex: number,
  todayDate: number,
): CalendarMonth[] {
  return months.map((m) => {
    if (m.month < currentMonthIndex) return m;
    if (m.month > currentMonthIndex) return { ...m, workedDays: [], halfDays: [], entries: [] };
    const keep = (d: number) => d <= todayDate;
    const daysInMonth = getDaysInMonth(m.year, m.month);
    return {
      ...m,
      workedDays: m.workedDays.filter(keep),
      halfDays: (m.halfDays ?? []).filter(keep),
      entries: (m.entries ?? []).flatMap((e): RevenueEntry[] => {
        if (e.kind === 'days') return [{ ...e, days: e.days.filter(keep), halfDays: (e.halfDays ?? []).filter(keep) }];
        if (e.kind === 'forfait') {
          const day = parseInt(e.date.slice(8, 10), 10);
          return !Number.isNaN(day) && day <= todayDate ? [e] : [];
        }
        return [{ ...e, amount: e.amount * (Math.max(0, todayDate) / daysInMonth) }];
      }),
    };
  });
}
