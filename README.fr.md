[English](./README.md) · **Français**

<div align="center">

# Fiscal Architect

**Simulateur fiscal et de revenus privé pour micro-entrepreneurs français.**

Pilotez chiffre d'affaires, cotisations, impôt, seuils TVA et encaissements dans une PWA 100 % côté navigateur.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](./public/manifest.webmanifest)

[Ouvrir l'application](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)

<!-- Emplacement démo : ajoutez le GIF ici quand il sera prêt. -->
<!-- <img src="./.github/screenshots/demo.gif" alt="Démo de Fiscal Architect" width="100%"> -->

</div>

---

## Ce Que Fait L'App

Fiscal Architect aide les freelances et indépendants français à simuler le quotidien d'une micro-entreprise :

- saisie du revenu par jours travaillés, forfaits, CA mensuel ou mode mixte ;
- profils multi-activités : vente, services BIC, libéral SSI et libéral CIPAV ;
- simulation URSSAF, CFP, taxe consulaire, ACRE, impôt et versement libératoire ;
- suivi des seuils micro-entreprise et franchise TVA ;
- projection des encaissements à partir des factures et délais de paiement ;
- navigation multi-années et export/import de sauvegarde locale.

L'application n'a pas de backend, pas de compte utilisateur et pas de tracking. Les données restent dans le navigateur via `localStorage`.

## Vue Développeur

| Domaine | Choix |
|---|---|
| Framework | **React 19** + **TanStack Start** |
| Routing | **TanStack Router** avec file routes |
| Build | **Vite 8** |
| Styles | **Tailwind CSS 4** avec tokens de thème |
| Graphiques | **Recharts** |
| Animation | **Motion** |
| Icônes | **Lucide React** |
| Tests | **Vitest** |
| Persistance | Hooks `localStorage` versionnés |

## Structure Du Projet

```text
src/
  components/       UI partagée et composants métier
  context/          Providers profil, année fiscale, thème et notifications
  hooks/            État navigateur, stockage et interactions
  lib/              Moteur fiscal, calendrier, encaissements, import/export et tests
  pages/            Écrans principaux
  routes/           Entrées TanStack Router
  styles/           Thème Tailwind et styles globaux
```

## Développement Local

```bash
corepack enable
pnpm install
pnpm dev
```

Le serveur de développement tourne sur [http://localhost:4000](http://localhost:4000).

| Commande | Description |
|---|---|
| `pnpm dev` | Lance le serveur local |
| `pnpm build` | Build l'application |
| `pnpm lint` | Lance la vérification TypeScript |
| `pnpm test` | Lance les tests Vitest |
| `pnpm clean` | Supprime les dossiers générés |

Node 22 est requis. Voir [.nvmrc](./.nvmrc).

## Périmètre Fiscal

La source de vérité du moteur fiscal se trouve dans `src/lib/fiscal.ts`.

| Activité | URSSAF | Abattement | Seuil micro | VL |
|---|---:|---:|---:|---:|
| Vente / hébergement | 12,3 % | 71 % | 203 100 EUR | 1,0 % |
| Services BIC / artisan | 21,2 % | 50 % | 83 600 EUR | 1,7 % |
| Libéral SSI | 25,6 % | 34 % | 83 600 EUR | 2,2 % |
| Libéral CIPAV | 23,2 % | 34 % | 83 600 EUR | 2,2 % |

L'app modélise aussi les seuils de franchise TVA, les fenêtres ACRE, l'éligibilité au versement libératoire via RFR, l'option IJ libérale et l'alerte compte bancaire dédié.

## Notes Qualité

- La logique de calcul est isolée dans `src/lib` et couverte par Vitest.
- Les objets persistés portent des `schemaVersion` et peuvent être migrés via `useVersionedStorage`.
- L'app est pensée pour rester utilisable hors ligne après le premier chargement.
- L'import/export utilise un format de sauvegarde applicatif plutôt qu'un CSV, car l'objectif est la restauration rapide.

## Avertissement

Fiscal Architect fournit des estimations à titre indicatif. L'application ne remplace pas un conseil fiscal professionnel.
Vérifiez toujours les chiffres importants auprès de l'URSSAF, de Service-Public.fr ou d'un comptable.

## Licence

[MIT](./LICENSE) © Maxime Morellon
