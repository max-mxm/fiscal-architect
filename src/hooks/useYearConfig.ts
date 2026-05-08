import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import { buildDefaultYearConfig, getLegalParamsForYear } from '~/constants';
import type { YearConfig } from '~/types';

const yearConfigKey = (year: number) => `fiscal-year-config-${year}`;

/**
 * Charge / persiste la `YearConfig` d'une année donnée. Si la clé n'existe pas
 * en localStorage, l'initialisation suit cette stratégie :
 *
 * 1. Si l'année précédente a une config en localStorage, la cloner (préférences
 *    perso conservées : TJM, charges fixes, activités, parts fiscales…).
 * 2. Patcher les paramètres légaux (`urssafRate`, `seuilMicro`) avec les valeurs
 *    applicables à cette année (table `LEGAL_PARAMS_BY_YEAR`).
 * 3. Réinitialiser `missionStart` à `${year}-01-01` (sera ajusté manuellement).
 *
 * Si aucune année antérieure n'est disponible, on utilise `buildDefaultYearConfig`.
 */
export function useYearConfig(year: number): [YearConfig, Dispatch<SetStateAction<YearConfig>>] {
  const [config, setConfig] = useVersionedStorage<YearConfig>(
    yearConfigKey(year),
    buildDefaultYearConfig(year),
  );

  // Au premier mount sur une année non encore initialisée, on tente un clone depuis
  // la config de l'année antérieure la plus proche, puis on patche les params légaux.
  const initRef = useRef<number | null>(null);
  useEffect(() => {
    if (initRef.current === year) return;
    initRef.current = year;
    try {
      const existing = localStorage.getItem(yearConfigKey(year));
      if (existing) return; // déjà initialisé pour cette année
    } catch {
      return;
    }

    // Cherche l'année antérieure la plus proche dans localStorage
    let donor: YearConfig | null = null;
    for (let y = year - 1; y >= year - 20; y--) {
      try {
        const raw = localStorage.getItem(yearConfigKey(y));
        if (!raw) continue;
        const parsed = JSON.parse(raw) as YearConfig;
        if (parsed && typeof parsed === 'object') {
          donor = parsed;
          break;
        }
      } catch {
        continue;
      }
    }

    if (donor) {
      const legal = getLegalParamsForYear(year);
      const cloned: YearConfig = {
        ...donor,
        schemaVersion: 1,
        year,
        urssafRate: legal.urssafRate,
        seuilMicro: legal.seuilMicro,
        missionStart: `${year}-01-01`,
        // Cloner les sous-objets pour éviter les références partagées
        activities: donor.activities.map((a) => ({ ...a })),
        fixedCosts: donor.fixedCosts.map((c) => ({ ...c })),
      };
      setConfig(cloned);
    }
  }, [year, setConfig]);

  return [config, setConfig];
}
