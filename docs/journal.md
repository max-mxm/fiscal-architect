# Journal de développement

---

## 2026-03-19 — Audit initial et mise en place documentation

### État du POC

L'application est un POC statique fonctionnel visuellement mais non interactif :
- Le dashboard affiche des données hardcodées (CHART_DATA dans constants.ts)
- Les métriques affichent des valeurs fixes ("+12% vs mois dernier")
- La page Comparaison utilise des fake divs au lieu de vrais graphiques Recharts
- Le calendrier n'est pas interactif (pas de clic sur les jours)
- Les boutons de la TopBar sont décoratifs
- La page Profil a des boutons sans handler

### Incohérences trouvées

- **`cn()` dupliqué** : présent dans `src/types.ts` et `src/utils.ts` — à nettoyer
- **`useState` importé mais non utilisé** dans `Comparison.tsx`
- **Dépendances inutilisées** dans package.json : `@google/genai`, `express` — ne correspondent pas à une app client-side pure

### Décisions

- Structure de documentation style B-MAD avec 6 fichiers dans `docs/`
- Identifiants de tâches uniques (FOUND-xx, DASH-xx, etc.) pour traçabilité dans les commits
- Milestones organisées avec M0 comme prérequis bloquant
- Ajout d'un `agent.md` pour guider les sessions de développement assistées par LLM
