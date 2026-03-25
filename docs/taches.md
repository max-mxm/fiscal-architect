# Tâches

Légende : `[ ]` todo · `[~]` en cours · `[x]` fait · `[!]` bloqué

---

## M0 — Fondations (prérequis)

- [x] `FOUND-01` : Hook `useLocalStorage` + remplacement du useState dans App.tsx
- [x] `FOUND-02` : Moteur fiscal `src/lib/fiscal.ts` (calcChargesURSSAF, calcIR, calcNetMicro, calcNetSASU, calcNetEURL, calcSeuilDate, generateChartData)
- [x] `FOUND-03` : Types enrichis (CalendarMonth, Scenario, FiscalYear dans `src/types.ts`)

## M1 — Dashboard

- [x] `DASH-01` : Graphique dynamique (remplacer CHART_DATA par generateChartData)
- [x] `DASH-02` : CRUD charges fixes (ajouter/modifier/supprimer)
- [x] `DASH-03` : Réserve vacances calculée dynamiquement
- [x] `DASH-04` : Bouton "Exporter les prévisions" (CSV via URL.createObjectURL)
- [x] `DASH-05` : Nettoyer métriques hardcodées ("+12% vs mois dernier")

## M2 — Profil

- [x] `PROF-01` : Champs name/role éditables
- [x] `PROF-02` : CRUD charges fixes complet (ajouter/modifier/supprimer)
- [x] `PROF-03` : Boutons "Annuler" (reset localStorage) et "Initialiser" (save + toast)
- [x] `PROF-04` : Validation formulaire (TJM > 0, taux 0-100, etc.)

## M3 — Comparaison

- [x] `COMP-01` : Scénarios A/B configurables avec useState (pré-remplir A depuis profil)
- [x] `COMP-02` : Calculs fiscaux réels par statut via `src/lib/fiscal.ts`
- [x] `COMP-03` : Remplacer les fake divs par vrais BarChart Recharts
- [x] `COMP-04` : Bouton "Configurer les paramètres" fonctionnel
- [x] `COMP-05` : Scénario C optionnel ("Nouvelle simulation")

## M4 — Calendrier

- [x] `CAL-01` : Calendrier réel (vrais jours/mois, 12 mois, offset premier jour)
- [x] `CAL-02` : Clic sur jour → toggle travaillé/non (state FiscalYear)
- [x] `CAL-03` : Lier TJM au profil (supprimer defaultValue="650")
- [x] `CAL-04` : Seuil micro-entreprise calculé dynamiquement
- [x] `CAL-05` : Boutons fonctionnels (Remplir jours ouvrés, Tout effacer, Exporter)
- [x] `CAL-06` : Stats hebdo/mensuelles calculées depuis les données réelles

## M5 — Transversal

- [x] `TRANS-01` : Alertes seuil micro-entreprise (composant ThresholdAlert)
- [x] `TRANS-02` : TopBar fonctionnelle (Objectifs CA, Année fiscale, Settings, Bell)
- [x] `TRANS-03` : MobileNav complète (ajouter Comparaison, actuellement absent)
- [x] `TRANS-04` : Export global PDF/CSV
