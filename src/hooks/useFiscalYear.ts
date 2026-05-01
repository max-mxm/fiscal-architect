import { useCallback } from 'react';
import type { FiscalYear } from '~/types';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import {
  MONTH_NAMES,
  createEmptyFiscalYear,
  getDaysInMonth,
  getJoursFeries,
  isWeekend,
  formatDaysFR,
} from '~/lib/calendar';
import { calcEquivDays } from '~/lib/fiscal';

export function useFiscalYear(year: number) {
  const [fiscalYear, setFiscalYear] = useLocalStorage<FiscalYear>(
    `fiscal-calendar-${year}`,
    createEmptyFiscalYear(year),
  );
  const [missionStart, setMissionStart] = useLocalStorage<string>(
    `fiscal-mission-start-${year}`,
    `${year}-01-01`,
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

  /** Cycle 3 états : vide → plein → demi → vide. `force` outrepasse le verrou férié. */
  const cycleDay = useCallback((monthIndex: number, day: number, force = false) => {
    if (isWeekend(year, monthIndex, day)) return;
    if (!force && isJourFerie(monthIndex, day)) return;
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
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
      return { ...prev, months: newMonths };
    });
  }, [year, isJourFerie, setFiscalYear]);

  /** Drag binaire : ajoute en plein (add=true) ou efface (add=false). */
  const dragSetDay = useCallback((monthIndex: number, day: number, add: boolean) => {
    if (isWeekend(year, monthIndex, day)) return;
    if (isJourFerie(monthIndex, day)) return;
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
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
      return { ...prev, months: newMonths };
    });
  }, [year, isJourFerie, setFiscalYear]);

  const fillMonth = useCallback((monthIndex: number) => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== monthIndex) return m;
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d) && !isJourFerie(m.month, d)) weekdays.push(d);
        }
        return { ...m, workedDays: weekdays, halfDays: [] };
      });
      return { ...prev, months: newMonths };
    });
  }, [isJourFerie, setFiscalYear]);

  const fillAll = useCallback(() => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m) => {
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d) && !isJourFerie(m.month, d)) weekdays.push(d);
        }
        return { ...m, workedDays: weekdays, halfDays: [] };
      });
      return { ...prev, months: newMonths };
    });
  }, [isJourFerie, setFiscalYear]);

  const clearMonth = useCallback((monthIndex: number) => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== monthIndex) return m;
        return { ...m, workedDays: [], halfDays: [] };
      });
      return { ...prev, months: newMonths };
    });
  }, [setFiscalYear]);

  const clearAll = useCallback(() => {
    setFiscalYear(createEmptyFiscalYear(year));
  }, [year, setFiscalYear]);

  /** Vide tout + purge toutes les clés localStorage commençant par `fiscal-`. */
  const resetEverything = useCallback(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('fiscal-'));
    for (const k of keys) localStorage.removeItem(k);
    setFiscalYear(createEmptyFiscalYear(year));
    setMissionStart(`${year}-01-01`);
  }, [year, setFiscalYear, setMissionStart]);

  const exportCSV = useCallback((tjm: number) => {
    const header = 'Mois,Jours pleins,Demi-journées,Jours équivalents,CA (€)\n';
    const rows = fiscalYear.months
      .map((m) => {
        const halfCount = (m.halfDays ?? []).length;
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
    missionStart,
    setMissionStart,
    isJourFerie,
    getJourFerieName,
    cycleDay,
    dragSetDay,
    fillMonth,
    fillAll,
    clearMonth,
    clearAll,
    resetEverything,
    exportCSV,
  };
}
