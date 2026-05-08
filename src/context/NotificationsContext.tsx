import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { useNotifications, type UseNotificationsResult } from '~/hooks/useNotifications';
import {
  calcCAYearFromEntries,
  calcCaRealiseFromEntries,
} from '~/lib/fiscal';

const NotificationsContext = createContext<UseNotificationsResult | null>(null);

/**
 * Fournit le résultat de `useNotifications` à l'arbre. Agrège les inputs depuis
 * `ProfileContext` + `FiscalYearContext` afin d'éviter de re-saisir caCumule,
 * caRealise et seuilMicro dans chaque consommateur.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const fy = useFiscalYearCtx();

  const caCumule = useMemo(
    () => calcCAYearFromEntries(fy.fiscalYear.months, profile),
    [fy.fiscalYear.months, profile],
  );

  const caRealise = useMemo(
    () => calcCaRealiseFromEntries(fy.fiscalYear.months, profile, fy.currentMonthIndex, fy.todayDate).caRealise,
    [fy.fiscalYear.months, profile, fy.currentMonthIndex, fy.todayDate],
  );

  const value = useNotifications({
    caCumule,
    caRealise,
    seuilMicro: profile.seuilMicro,
  });

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsCtx(): UseNotificationsResult {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsCtx must be used within NotificationsProvider');
  return ctx;
}
