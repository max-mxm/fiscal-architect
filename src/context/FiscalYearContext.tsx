import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useFiscalYear } from '~/hooks/useFiscalYear';
import { useProfile } from '~/context/ProfileContext';
import {
  createYearFresh,
  createYearInherited,
  isYearEmpty,
} from '~/lib/yearLifecycle';

type FiscalYearApi = ReturnType<typeof useFiscalYear>;

export type YearTransitionMode = 'inherit' | 'fresh';

export interface YearTransitionRequest {
  /** Année cible à créer ou rejoindre. */
  targetYear: number;
  /** Année source à cloner (généralement targetYear - 1). null = pas de source dispo. */
  sourceYear: number | null;
}

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

  /** Demande à passer à `targetYear`. Si l'année cible existe déjà avec des données, switch direct. Sinon ouvre la popup. */
  requestYearTransition: (targetYear: number) => void;
  /** État courant de la demande de transition (null si aucune popup ouverte). */
  transitionRequest: YearTransitionRequest | null;
  /** Confirme la transition selon le mode choisi (héritage ou from scratch). */
  confirmYearTransition: (mode: YearTransitionMode) => void;
  /** Annule la transition en cours sans changer l'année active. */
  cancelYearTransition: () => void;
}

const FiscalYearContext = createContext<FiscalYearContextValue | null>(null);

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const { activeYear, years, setActiveYear, addYear } = useProfile();
  const now = useMemo(() => new Date(), []);
  const api = useFiscalYear(activeYear);

  const [transitionRequest, setTransitionRequest] = useState<YearTransitionRequest | null>(null);

  const requestYearTransition = useCallback((targetYear: number) => {
    if (years.includes(targetYear) && !isYearEmpty(targetYear)) {
      setActiveYear(targetYear);
      return;
    }
    const sourceYear = years.length > 0
      ? years.filter((y) => y < targetYear).sort((a, b) => b - a)[0] ?? null
      : null;
    setTransitionRequest({ targetYear, sourceYear });
  }, [years, setActiveYear]);

  const confirmYearTransition = useCallback((mode: YearTransitionMode) => {
    if (!transitionRequest) return;
    const { targetYear, sourceYear } = transitionRequest;
    if (mode === 'inherit' && sourceYear != null) {
      createYearInherited(targetYear, sourceYear);
    } else {
      createYearFresh(targetYear);
    }
    addYear(targetYear);
    setActiveYear(targetYear);
    setTransitionRequest(null);
  }, [transitionRequest, addYear, setActiveYear]);

  const cancelYearTransition = useCallback(() => {
    setTransitionRequest(null);
  }, []);

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
    requestYearTransition,
    transitionRequest,
    confirmYearTransition,
    cancelYearTransition,
  };

  return <FiscalYearContext.Provider value={value}>{children}</FiscalYearContext.Provider>;
}

export function useFiscalYearCtx(): FiscalYearContextValue {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) throw new Error('useFiscalYearCtx must be used within FiscalYearProvider');
  return ctx;
}
