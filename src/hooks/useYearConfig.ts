import { type Dispatch, type SetStateAction } from 'react';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import { buildDefaultYearConfig } from '~/constants';
import type { YearConfig } from '~/types';

const yearConfigKey = (year: number) => `fiscal-year-config-${year}`;

/**
 * Migrations de schéma pour `YearConfig`. Chaque entrée `[N]` reçoit la valeur
 * en version `N` et la transforme en version `N + 1`.
 */
const YEAR_CONFIG_MIGRATIONS: Record<number, (old: any) => any> = {
  // v1 → v2 : introduction de `tjmByMonth` (sparse, undefined par défaut).
  1: (old: any) => ({ ...old, schemaVersion: 2 }),
  // v2 → v3 : délai de paiement. Zéro préserve strictement les projections existantes.
  2: (old: any) => ({
    ...old,
    schemaVersion: 3,
    paymentDelayDays: 0,
    paymentDelayMode: 'net',
    endOfMonthCalculation: 'delayThenMonthEnd',
  }),
};

/**
 * Charge / persiste la `YearConfig` d'une année donnée. Si la clé n'existe pas
 * en localStorage, on retombe sur les valeurs par défaut (`buildDefaultYearConfig`).
 *
 * Le clonage des préférences perso depuis une année antérieure n'est PLUS
 * automatique : c'est un choix explicite de l'utilisateur via
 * `YearTransitionModal`, qui appelle `createYearInherited` (cf. `lib/yearLifecycle`)
 * pour écrire la config clonée avant de switcher l'année active.
 */
export function useYearConfig(year: number): [YearConfig, Dispatch<SetStateAction<YearConfig>>] {
  return useVersionedStorage<YearConfig>(
    yearConfigKey(year),
    buildDefaultYearConfig(year),
    YEAR_CONFIG_MIGRATIONS,
  );
}
