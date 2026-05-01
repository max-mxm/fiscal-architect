# Fiscal Architect

Outil de simulation et suivi fiscal pour freelances et micro-entrepreneurs français. Simulez vos revenus, calculez vos charges URSSAF, et planifiez votre fiscalité en toute sérénité.

## Fonctionnalités

- **Dashboard** — Vue d'ensemble des revenus bruts/nets, graphiques mensuels, simulation en temps réel
- **Comparaison de statuts** — Micro-entreprise vs SASU vs EURL avec simulation chiffrée
- **Calendrier fiscal** — Suivi de facturation mensuel et progression vers le seuil micro-entreprise (83 600 €)
- **Profil personnalisable** — TJM, jours travaillés, taux URSSAF, charges fixes récurrentes

## Stack technique

React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · Recharts · Motion · Lucide React

## Installation

```bash
# Cloner le repo
git clone <url-du-repo>
cd fiscal-architect

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run lint` | Vérification TypeScript |
| `npm run clean` | Suppression du dossier `dist/` |

## Structure du projet

```
src/
├── App.tsx              # Routeur principal + state global
├── types.ts             # Interfaces TypeScript (UserProfile, Page)
├── constants.ts         # Données par défaut et données de graphiques
├── utils.ts             # Utilitaire cn() (clsx + tailwind-merge)
├── index.css            # Design tokens, fonts, styles globaux
├── components/
│   └── Navigation.tsx   # Sidebar, TopBar, MobileNav
└── pages/
    ├── Dashboard.tsx    # Simulation de revenus et charges
    ├── Comparison.tsx   # Comparaison micro / SASU / EURL
    ├── Calendar.tsx     # Calendrier de facturation + seuil CA
    └── Profile.tsx      # Configuration du profil freelance
```

## Variables d'environnement

Créer un fichier `.env` à la racine si nécessaire :

```env
GEMINI_API_KEY=       # Clé API Google Gemini (fonctionnalités IA optionnelles)
```

## Domaine métier — Fiscalité micro-entrepreneur (2026)

Périmètre couvert par défaut : freelance en prestations de services relevant des **BNC** (bénéfices non commerciaux), libéral non réglementé. Les valeurs ci-dessous sont celles en vigueur au **1er janvier 2026**. La source de vérité applicative reste `src/lib/fiscal.ts`.

### Constantes clés

| Concept | Valeur 2026 | Référence code |
|---------|-------------|----------------|
| Seuil micro-entreprise (services BIC/BNC, 2026-2028) | **83 600 €** | `SEUIL_MICRO` |
| Taux URSSAF cotisations BNC libéral non réglementé | **≈ 26,1 %** (+1 pt vs 2025) | `urssafRate` (profil) |
| Abattement forfaitaire BNC (assiette IR) | **34 %** | `ABATTEMENT_BNC` |
| Versement libératoire BNC (option) | **2,2 %** du CA | `TAUX_VL_BNC` |
| Tranches IR 2026 | 0 % / 11 % / 30 % / 41 % / 45 % | `TRANCHES_IR` |
| ACRE (à partir du 01/07/2026) | exonération **25 %** des cotisations (vs 50 % avant) | non implémenté |

### Évolutions 2026

1. **Relèvement du seuil services** : 77 700 € → 83 600 €, applicable aux exercices 2026, 2027 et 2028.
2. **Hausse de 1 point** des cotisations sociales BNC libéral non réglementé au 1er janvier 2026.
3. **ACRE** : le taux minoré passe à 75 % des cotisations habituelles à compter du 1er juillet 2026 (l'exonération tombe de 50 % à 25 %).

### Formules clés (régime micro, sans VL)

```
CA mensuel        = TJM × jours travaillés
URSSAF            = CA × taux_URSSAF
Revenu imposable  = CA × (1 − abattement 34 %)
IR                = barème progressif appliqué au revenu imposable
Net après IR      = CA − URSSAF − charges fixes − IR
```

Avec **versement libératoire** (option), l'IR est remplacé par `CA × 2,2 %` prélevé en même temps que les cotisations URSSAF.

> Les statuts **SASU** (70 % salaire / 30 % dividendes) et **EURL** (TNS) sont implémentés à titre comparatif dans `src/lib/fiscal.ts` et utilisent l'IS réduit à 15 % jusqu'à 42 500 € de bénéfice puis 25 % au-delà.

## Roadmap

- [ ] Persistance des données via localStorage
- [ ] Alertes de dépassement de seuil micro-entreprise
- [ ] Gestion multi-années avec comparaison N/N-1
- [ ] Simulation versement libératoire de l'IR (impact sur charges URSSAF totales avec/sans option)

## Licence

Projet privé.
