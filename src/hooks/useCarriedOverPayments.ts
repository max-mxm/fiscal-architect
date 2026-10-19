import { useEffect, useMemo, useState } from 'react';
import { carriedOverPayments, type PaymentProjection } from '~/lib/cashflow';
import { profileForYear, readStoredFiscalYear, readStoredYearConfig } from '~/lib/yearLifecycle';
import type { CalendarMonth, UserProfile, YearConfig } from '~/types';

/**
 * Factures de N-1 encaissées en N, pour compléter les déclarations URSSAF de N.
 * N-1 est lue après l'hydratation (localStorage absent côté serveur) et rien
 * n'est écrit pour elle. Vide si N-1 n'a jamais été configurée.
 */
export function useCarriedOverPayments(year: number, profile: UserProfile): PaymentProjection[] {
  const [previous, setPrevious] = useState<{ config: YearConfig; months: CalendarMonth[] } | null>(null);

  useEffect(() => {
    const config = readStoredYearConfig(year - 1);
    setPrevious(config ? { config, months: readStoredFiscalYear(year - 1).months } : null);
  }, [year]);

  return useMemo(() => {
    if (!previous) return [];
    return carriedOverPayments(previous.months, profileForYear(profile, previous.config), year);
  }, [previous, profile, year]);
}
