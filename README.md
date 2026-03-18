# Fiscal Architect

Outil de simulation et suivi fiscal pour freelances et micro-entrepreneurs français. Simulez vos revenus, calculez vos charges URSSAF, et planifiez votre fiscalité en toute sérénité.

## Fonctionnalités

- **Dashboard** — Vue d'ensemble des revenus bruts/nets, graphiques mensuels, simulation en temps réel
- **Comparaison de statuts** — Micro-entreprise vs SASU vs EURL avec simulation chiffrée
- **Calendrier fiscal** — Suivi de facturation mensuel et progression vers le seuil micro-entreprise (77 700 €)
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

## Roadmap

- [ ] Persistance des données via localStorage
- [ ] Alertes de dépassement de seuil micro-entreprise
- [ ] Gestion multi-années avec comparaison N/N-1
- [ ] Simulation versement libératoire de l'IR (impact sur charges URSSAF totales avec/sans option)

## Licence

Projet privé.
