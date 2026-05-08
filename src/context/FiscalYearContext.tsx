import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useFiscalYear } from '~/hooks/useFiscalYear';
import { useProfile } from '~/context/ProfileContext';

type FiscalYearApi = ReturnType<typeof useFiscalYear>;

interface FiscalYearContextValue extends FiscalYearApi {
  /** Année actuellement consultée (= activeYear de l'index global). */
  year: number;
  /**
   * Index du mois courant SI on consulte l'année calendaire actuelle, sinon 11
   * (toute l'année passée est "consommée" pour les calculs cumulés).
   * Pour les années futures, 0 (rien n'a encore été réalisé).
   */
  currentMonthIndex: number;
  todayDate: number;
}

const FiscalYearContext = createContext<FiscalYearContextValue | null>(null);

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { activeYear } = useProfile();
  const now = useMemo(() => new Date(), []);
  const api = useFiscalYear(activeYear);

  // Pour les calculs "réalisé à date", on adapte selon que l'année consultée
  // est passée, courante, ou future.
  const realYear = now.getFullYear();
  let currentMonthIndex: number;
  let todayDate: number;
  if (activeYear < realYear) {
    currentMonthIndex = 11;
    todayDate = 31;
  } else if (activeYear > realYear) {
    currentMonthIndex = 0;
    todayDate = 0;
  } else {
    currentMonthIndex = now.getMonth();
    todayDate = now.getDate();
  }

  const value: FiscalYearContextValue = {
    ...api,
    year: activeYear,
    currentMonthIndex,
    todayDate,
  };

  return <FiscalYearContext.Provider value={value}>{children}</FiscalYearContext.Provider>;
}

export function useFiscalYearCtx(): FiscalYearContextValue {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) throw new Error('useFiscalYearCtx must be used within FiscalYearProvider');
  return ctx;
}
