import { useEffect, useRef } from 'react';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { useProfile } from '~/context/ProfileContext';
import { isYearEmpty } from '~/lib/yearLifecycle';

/**
 * Au démarrage de l'app, si l'année active est antérieure à l'année système
 * réelle ET que l'année système n'a pas encore été créée (ou est vide), on
 * propose à l'utilisateur de transitionner via la popup.
 *
 * Skip silencieux si :
 * - l'année système est déjà active
 * - l'année système est dans `years[]` avec des données saisies (l'utilisateur
 *   a déjà fait son choix précédemment)
 * - aucune année n'existe encore (premier démarrage de l'app — géré ailleurs)
 *
 * Ne s'exécute qu'une fois par mount pour éviter de spammer la popup si
 * l'utilisateur l'annule.
 */
export function useYearAutoTransition(): void {
  const { activeYear, years } = useProfile();
  const { requestYearTransition } = useFiscalYearCtx();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (years.length === 0) return;
    const systemYear = new Date().getFullYear();
    if (systemYear <= activeYear) return;
    if (years.includes(systemYear) && !isYearEmpty(systemYear)) return;
    ranRef.current = true;
    requestYearTransition(systemYear);
  }, [activeYear, years, requestYearTransition]);
}
