# Fiscal Architect

Outil de suivi et simulation fiscale pour micro-entrepreneurs français. Application client-side (pas de backend/DB), tout le state est géré localement dans React.

## Stack technique

- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Tailwind CSS 4** (utility-first, `@theme` tokens dans `src/index.css`)
- **Recharts** — graphiques (revenus brut/net)
- **Motion** (ex Framer Motion) — animations et transitions
- **Lucide React** — icônes
- **clsx + tailwind-merge** — utilitaire `cn()` dans `src/utils.ts`

## Architecture

```
src/
├── App.tsx              # Routeur (switch sur activePage) + state global (profile, activePage)
├── main.tsx             # Point d'entrée React
├── types.ts             # Interfaces TypeScript : UserProfile, Page
├── constants.ts         # Données par défaut (DEFAULT_PROFILE, CHART_DATA, MONTHS)
├── utils.ts             # Utilitaire cn() (clsx + tailwind-merge)
├── index.css            # Design tokens (@theme), fonts, glass-panel
├── components/
│   └── Navigation.tsx   # Sidebar, TopBar, MobileNav
└── pages/
    ├── Dashboard.tsx    # Page principale — simulation revenus/charges
    ├── Comparison.tsx   # Comparaison de scénarios (micro vs SASU vs EURL)
    ├── Calendar.tsx     # Calendrier de facturation + suivi seuil CA
    └── Profile.tsx      # Configuration du profil utilisateur
```

### State management

Pas de store externe. Le state est dans `App.tsx` via `useState` :
- `activePage: Page` — navigation entre pages
- `profile: UserProfile` — profil utilisateur (TJM, jours, taux URSSAF, charges fixes)

Les pages reçoivent `profile` et `setProfile` en props.

## Design system

| Token | Valeur | Usage |
|-------|--------|-------|
| `surface` | `#f7f9fb` | Background principal |
| `surface-lowest` | `#ffffff` | Cards |
| `secondary` | `#006c49` | Accent vert (CTA, slider, highlights) |
| `secondary-container` | `#6cf8bb` | Accent vert clair |

- **Fonts** : Inter (body), Manrope (headlines), JetBrains Mono (données chiffrées)
- **Glassmorphism** : classe `.glass-panel` (rgba blanc + blur 20px)
- **Rounded corners** : `rounded-2xl` / `rounded-3xl` sur les cards

## Commandes

```bash
npm run dev      # Serveur de dev (port 3000)
npm run build    # Build production
npm run lint     # TypeScript check (tsc --noEmit)
npm run clean    # Supprime dist/
```

## Conventions de code

- Composants fonctionnels React (pas de classes)
- Tailwind utility-first — pas de CSS modules
- Animations via `motion` (`<motion.div>`)
- Pas de DB, pas d'API — tout est client-side
- `cn()` pour merger les classes Tailwind conditionnellement

## Domaine métier — Fiscalité micro-entrepreneur

| Concept | Valeur |
|---------|--------|
| Taux URSSAF (prestations de services BNC) | 22% |
| Seuil micro-entreprise (services) | 77 700 € CA annuel |
| Statuts comparés | Micro-entreprise, SASU, EURL |
| TJM | Taux Journalier Moyen |
| Tranches IR | Barème progressif français |

### Formules clés

- **CA mensuel** = TJM × jours travaillés
- **Charges URSSAF** = CA × taux URSSAF (22% par défaut)
- **Net avant IR** = CA − charges URSSAF − charges fixes

## Vision produit

- Suivi fiscal annuel complet (CA cumulé, charges, net)
- Historique des déclarations URSSAF
- Paramétrage complet du profil freelance
- Alertes de seuils (dépassement micro-entreprise)
- Comparaison statuts juridiques avec simulation chiffrée
