import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useFiscalYear } from '~/hooks/useFiscalYear';

type FiscalYearApi = ReturnType<typeof useFiscalYear>;

interface FiscalYearContextValue extends FiscalYearApi {
  year: number;
  currentMonthIndex: number;
  todayDate: number;
}

const FiscalYearContext = createContext<FiscalYearContextValue | null>(null);

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const api = useFiscalYear(year);

  const value: FiscalYearContextValue = {
    ...api,
    year,
    currentMonthIndex: now.getMonth(),
    todayDate: now.getDate(),
  };

  return <FiscalYearContext.Provider value={value}>{children}</FiscalYearContext.Provider>;
}

export function useFiscalYearCtx(): FiscalYearContextValue {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) throw new Error('useFiscalYearCtx must be used within FiscalYearProvider');
  return ctx;
}
