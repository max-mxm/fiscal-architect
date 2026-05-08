import { useCallback } from 'react';
import type { FiscalYear, RevenueEntry } from '~/types';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import {
  MONTH_NAMES,
  createEmptyFiscalYear,
  getJoursFeries,
  formatDaysFR,
} from '~/lib/calendar';
import { calcEquivDays } from '~/lib/fiscal';
import {
  cycleDayInMonths,
  dragSetDayInMonths,
  fillMonthInMonths,
  fillAllInMonths,
  clearMonthInMonths,
} from '~/lib/calendarMutations';

export function useFiscalYear(year: number) {
  const [fiscalYear, setFiscalYear] = useVersionedStorage<FiscalYear>(
    `fiscal-calendar-${year}`,
    createEmptyFiscalYear(year),
  );

  const { set: joursFeriesSet, names: joursFeriesNames } = getJoursFeries(year);
  const isJourFerie = useCallback(
    (month: number, day: number) => joursFeriesSet.has(month * 100 + day),
    [joursFeriesSet],
  );
  const getJourFerieName = useCallback(
    (month: number, day: number) => joursFeriesNames.get(month * 100 + day),
    [joursFeriesNames],
  );

  const cycleDay = useCallback((monthIndex: number, day: number) => {
    setFiscalYear((prev) => ({
      ...prev,
      months: cycleDayInMonths(prev.months, year, monthIndex, day, isJourFerie),
    }));
  }, [year, isJourFerie, setFiscalYear]);

  const dragSetDay = useCallback((monthIndex: number, day: number, add: boolean) => {
    setFiscalYear((prev) => ({
      ...prev,
      months: dragSetDayInMonths(prev.months, year, monthIndex, day, add, isJourFerie),
    }));
  }, [year, isJourFerie, setFiscalYear]);

  const fillMonth = useCallback((monthIndex: number) => {
    setFiscalYear((prev) => ({
      ...prev,
      months: fillMonthInMonths(prev.months, prev.year, monthIndex, isJourFerie),
    }));
  }, [isJourFerie, setFiscalYear]);

  const fillAll = useCallback(() => {
    setFiscalYear((prev) => ({
      ...prev,
      months: fillAllInMonths(prev.months, prev.year, isJourFerie),
    }));
  }, [isJourFerie, setFiscalYear]);

  const clearMonth = useCallback((monthIndex: number) => {
    setFiscalYear((prev) => ({
      ...prev,
      months: clearMonthInMonths(prev.months, monthIndex),
    }));
  }, [setFiscalYear]);

  const clearAll = useCallback(() => {
    setFiscalYear(createEmptyFiscalYear(year));
  }, [year, setFiscalYear]);

  /** Restaure un snapshot de mois (utilisé par le pattern Undo). */
  const restoreMonths = useCallback((months: import('~/types').CalendarMonth[]) => {
    setFiscalYear((prev) => ({ ...prev, months }));
  }, [setFiscalYear]);

  /** Met à jour les entries (forfait/flat/days mixés) d'un mois. */
  const setMonthEntries = useCallback((monthIndex: number, entries: RevenueEntry[]) => {
    setFiscalYear((prev) => ({
      ...prev,
      months: prev.months.map((m, i) => (i === monthIndex ? { ...m, entries } : m)),
    }));
  }, [setFiscalYear]);

  /**
   * Purge toutes les clés `fiscal-*` du localStorage et recharge la page sur la
   * racine. On utilise `location.replace(pathname)` (et non `reload()`) pour
   * supprimer toute query string — sinon `?confirm=reset-all` survivrait au
   * reload et rouvrirait la modal de confirmation.
   */
  const resetEverything = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('fiscal-'));
      for (const k of keys) localStorage.removeItem(k);
    } catch {
      // localStorage indisponible — on tente le reload quand même
    }
    if (typeof window !== 'undefined') {
      window.location.replace(window.location.pathname);
    }
  }, []);

  const exportCSV = useCallback((tjm: number) => {
    const header = 'Mois,Jours pleins,Demi-journées,Jours équivalents,CA (€)\n';
    const rows = fiscalYear.months
      .map((m) => {
        const halfCount = m.halfDays.length;
        const equiv = calcEquivDays(m);
        const ca = equiv * tjm;
        return `${MONTH_NAMES[m.month]},${m.workedDays.length},${halfCount},${formatDaysFR(equiv)},${ca}`;
      })
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `previsions-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fiscalYear, year]);

  return {
    fiscalYear,
    isJourFerie,
    getJourFerieName,
    cycleDay,
    dragSetDay,
    fillMonth,
    fillAll,
    clearMonth,
    clearAll,
    restoreMonths,
    setMonthEntries,
    resetEverything,
    exportCSV,
  };
}
