import { useCallback } from 'react';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import { buildDefaultYearsIndex } from '~/constants';
import type { YearsIndex } from '~/types';

/**
 * Index global des années connues + année active dans l'UI. Persisté dans la clé
 * `fiscal-years-index`. Permet de lister rapidement les années saisies (sélecteur
 * d'année) et de mémoriser l'année consultée par l'utilisateur entre deux sessions.
 */
export function useYearsIndex() {
  const [index, setIndex] = useVersionedStorage<YearsIndex>(
    'fiscal-years-index',
    buildDefaultYearsIndex(new Date().getFullYear()),
  );

  const setActiveYear = useCallback((year: number) => {
    setIndex((prev) => {
      const years = prev.years.includes(year) ? prev.years : [...prev.years, year].sort((a, b) => a - b);
      return { ...prev, years, activeYear: year };
    });
  }, [setIndex]);

  const addYear = useCallback((year: number) => {
    setIndex((prev) => {
      if (prev.years.includes(year)) return prev;
      return { ...prev, years: [...prev.years, year].sort((a, b) => a - b) };
    });
  }, [setIndex]);

  const removeYear = useCallback((year: number) => {
    setIndex((prev) => {
      const years = prev.years.filter((y) => y !== year);
      const activeYear = prev.activeYear === year
        ? (years[years.length - 1] ?? new Date().getFullYear())
        : prev.activeYear;
      return { ...prev, years, activeYear };
    });
  }, [setIndex]);

  return {
    years: index.years,
    activeYear: index.activeYear,
    setActiveYear,
    addYear,
    removeYear,
  };
}
