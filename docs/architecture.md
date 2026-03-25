# Architecture — Décisions (ADR)

---

## ADR-001 : Pas de store externe

**Statut** : Accepté

**Contexte** : L'application utilise `useState` dans App.tsx avec props drilling vers les pages.

**Décision** : Conserver useState + props drilling. Pas de Redux, Zustand ou autre store externe.

**Conséquences** :
- Simple et explicite
- Suffisant tant que le state reste limité (profil + page active)
- À réévaluer si le nombre de props drillées dépasse 3-4 niveaux ou si le state grandit significativement

---

## ADR-002 : Moteur fiscal en fonctions pures

**Statut** : Proposé

**Contexte** : Les calculs fiscaux sont actuellement hardcodés dans les composants ou inexistants.

**Décision** : Créer `src/lib/fiscal.ts` contenant des fonctions pures pour tous les calculs fiscaux.

**Fonctions prévues** :
- `calcChargesURSSAF(ca, taux)` — charges sociales
- `calcIR(revenuImposable)` — impôt sur le revenu (barème progressif)
- `calcNetMicro(ca, tauxURSSAF, chargesFixes)` — net micro-entreprise
- `calcNetSASU(ca)` — net SASU (salaire + dividendes + flat tax)
- `calcNetEURL(ca)` — net EURL (TNS + IS)
- `calcSeuilDate(caCumule, joursRestants)` — projection dépassement seuil
- `generateChartData(profile)` — données pour Recharts

**Conséquences** :
- Testable unitairement
- Réutilisable sur toutes les pages
- Source unique de vérité pour les calculs

---

## ADR-003 : Persistence localStorage via hook custom

**Statut** : Proposé

**Contexte** : Le state est perdu à chaque rechargement de page.

**Décision** : Créer un hook `useLocalStorage<T>(key, defaultValue)` qui synchronise le state React avec localStorage.

**Conséquences** :
- Persistence transparente sans backend
- API identique à useState (migration facile)
- Sérialisation JSON automatique

---

## ADR-004 : Pas de routeur

**Statut** : Accepté

**Contexte** : La navigation utilise un switch sur `activePage` dans App.tsx au lieu d'un routeur (react-router, TanStack Router).

**Décision** : Conserver le switch sur activePage.

**Conséquences** :
- Pas d'URL distinctes par page (pas de deep linking)
- Simple pour une SPA avec peu de pages
- À réévaluer si besoin de deep linking ou de navigation complexe
