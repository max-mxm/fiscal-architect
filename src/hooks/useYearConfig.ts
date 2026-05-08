import { type Dispatch, type SetStateAction } from 'react';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import { buildDefaultYearConfig } from '~/constants';
import type { YearConfig } from '~/types';

const yearConfigKey = (year: number) => `fiscal-year-config-${year}`;

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
  return useVersionedStorage<YearConfig>(yearConfigKey(year), buildDefaultYearConfig(year));
}
