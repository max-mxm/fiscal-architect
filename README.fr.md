[English](./README.md) · **Français**

# Fiscal Architect

Fiscal Architect est un simulateur fiscal et de revenus pour micro-entrepreneurs français.
L'application aide à piloter le chiffre d'affaires, les cotisations, l'impôt, les seuils, les encaissements et les transitions d'année, sans backend ni tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)

## Application

[Ouvrir Fiscal Architect](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)

- 100 % côté navigateur : les données restent dans `localStorage`.
- PWA installable : utilisable hors ligne après le premier chargement.
- Pensée pour les règles françaises de la micro-entreprise et les constantes 2026.
- Interface en français, code majoritairement en anglais.

## Fonctionnalités

- Saisie du revenu par jours travaillés, prestations au forfait, CA mensuel ou mode mixte.
- Profils multi-activités : vente, services BIC, libéral SSI, libéral CIPAV.
- Simulation URSSAF, CFP, taxe consulaire, ACRE, option IJ libérale et impôt sur le revenu.
- Vérification du versement libératoire via RFR N-2 et parts fiscales.
- Suivi des seuils micro-entreprise et franchise TVA.
- Projection des encaissements à partir des dates de facture et délais de paiement.
- Navigation multi-années avec transition explicite.
- Export/import de sauvegarde locale pour restaurer les données après reset ou redéploiement.
- Mode sombre, centre de notifications, édition rapide et installation PWA.

## Stack

| Domaine | Choix |
|---|---|
| Framework | React 19, TanStack Start, TanStack Router |
| Build | Vite 8 |
| Styles | Tailwind CSS 4 |
| Graphiques | Recharts |
| Animation | Motion |
| Icônes | Lucide React |
| Tests | Vitest |
| Persistance | localStorage |

## Développement

```bash
corepack enable
pnpm install
pnpm dev
```

Le serveur de développement tourne sur [http://localhost:4000](http://localhost:4000).

| Commande | Description |
|---|---|
| `pnpm dev` | Lance le serveur de dev |
| `pnpm build` | Build l'application |
| `pnpm lint` | Lance la vérification TypeScript |
| `pnpm test` | Lance les tests Vitest |
| `pnpm clean` | Supprime les dossiers générés |

Node 22 est requis. Voir [.nvmrc](./.nvmrc).

## Périmètre Fiscal

Le moteur fiscal utilise les constantes définies dans `src/lib/fiscal.ts`.

| Activité | URSSAF | Abattement | Seuil micro | VL |
|---|---:|---:|---:|---:|
| Vente / hébergement | 12,3 % | 71 % | 203 100 EUR | 1,0 % |
| Services BIC / artisan | 21,2 % | 50 % | 83 600 EUR | 1,7 % |
| Libéral SSI | 25,6 % | 34 % | 83 600 EUR | 2,2 % |
| Libéral CIPAV | 23,2 % | 34 % | 83 600 EUR | 2,2 % |

Valeurs importantes 2026 :

- Franchise TVA : 36 800 EUR pour services/BNC, 91 900 EUR pour vente.
- ACRE : réduction URSSAF de 25 % pendant 12 mois depuis le 01/05/2024, 50 % avant cette date.
- Versement libératoire : éligibilité basée sur le RFR N-2 du foyer et les parts fiscales.
- Alerte compte bancaire dédié : à partir de 10 000 EUR de CA sur deux années consécutives.

## Avertissement

Fiscal Architect fournit des estimations à titre indicatif. L'application ne remplace pas un conseil fiscal professionnel.
Vérifiez toujours les chiffres importants auprès de l'URSSAF, de Service-Public.fr ou d'un comptable.

## Licence

[MIT](./LICENSE) © Maxime Morellon
