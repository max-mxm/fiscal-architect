# Objectifs — Milestones

## Vision

Transformer le POC statique de Fiscal Architect en application complètement interactive et fonctionnelle, tout en restant client-side (pas de backend).

## Milestones

### M0 — Fondations

**Scope** : Infrastructure technique nécessaire à toutes les autres milestones.

- Hook `useLocalStorage` pour persister le state
- Moteur fiscal centralisé (`src/lib/fiscal.ts`) avec fonctions pures
- Types TypeScript enrichis (CalendarMonth, Scenario, FiscalYear)

**Dépendances** : Aucune
**Prérequis pour** : M1, M2, M3, M4

---

### M1 — Dashboard interactif

**Scope** : Rendre le dashboard fonctionnel avec des données réelles.

- Graphique dynamique alimenté par le profil utilisateur
- CRUD charges fixes
- Réserve vacances calculée
- Export CSV des prévisions
- Suppression des métriques hardcodées

**Dépendances** : M0

---

### M2 — Profil utilisateur

**Scope** : Page profil entièrement fonctionnelle.

- Champs nom/rôle éditables
- CRUD charges fixes complet
- Boutons Annuler/Initialiser fonctionnels
- Validation des formulaires

**Dépendances** : M0

---

### M3 — Comparaison de statuts

**Scope** : Comparaison réelle entre micro-entreprise, SASU et EURL.

- Scénarios A/B configurables
- Calculs fiscaux réels par statut
- Vrais graphiques Recharts (remplacement des fake divs)
- Bouton "Configurer les paramètres" fonctionnel
- Scénario C optionnel

**Dépendances** : M0

---

### M4 — Calendrier de facturation

**Scope** : Calendrier interactif avec suivi du CA.

- Vrai calendrier (12 mois, jours réels)
- Clic sur jour → toggle travaillé/non
- TJM lié au profil
- Seuil micro-entreprise dynamique
- Boutons fonctionnels (remplir jours ouvrés, tout effacer, exporter)
- Stats hebdo/mensuelles calculées

**Dépendances** : M0

---

### M5 — Transversal

**Scope** : Fonctionnalités transversales et finitions.

- Alertes seuil micro-entreprise
- TopBar fonctionnelle
- MobileNav complète (ajout page Comparaison)
- Export global PDF/CSV

**Dépendances** : M1, M2, M3, M4

## Ordre de priorité

```
M0 → M1 + M2 + M3 + M4 (parallélisables) → M5
```
