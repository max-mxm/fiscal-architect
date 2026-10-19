[English](./README.md) · **Français**

<div align="center">

# Fiscal Architect

**Simulateur fiscal et de revenus privé pour micro-entrepreneurs français.**

Cochez vos jours travaillés et voyez ce que vous gagnez vraiment : cotisations, impôt, TVA, seuils et encaissements, dans une PWA 100 % côté navigateur.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](./public/manifest.webmanifest)

[Ouvrir l'application](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)

</div>

---

## Ce Que Fait L'App

Fiscal Architect répond d'abord à une question : **combien je gagne vraiment ?** L'app s'adresse aux micro-entrepreneurs français, en particulier aux freelances au TJM, et elle est pensée pour le mobile d'abord.

| Écran | Ce qu'on y fait |
|---|---|
| **Mois** | Cochez vos jours travaillés. Le net, le montant à facturer au client (TTC quand la TVA s'applique) et la répartition du CA se mettent à jour aussitôt. Réglages rapides : TJM du mois, versement libératoire, TVA, ACRE et charges fixes. |
| **Année** | CA cumulé face aux seuils micro et TVA, date de franchissement projetée, leviers annuels (TJM par défaut, taux de cotisations) et tableau mois par mois. |
| **Trésorerie** | Ce qui reste à encaisser, les sommes à prévoir (cotisations, impôt, TVA à reverser), les déclarations URSSAF sur le CA encaissé et l'échéancier des paiements. |
| **Réglages** | Profil, activités, facturation et délais de paiement, sauvegarde et restauration, export CSV. |

Sous le capot :

- saisie du revenu par jours travaillés (le mode principal), forfaits, CA mensuel ou mode mixte ;
- profils multi-activités : vente, services BIC, libéral SSI et libéral CIPAV ;
- URSSAF, CFP, taxe consulaire, ACRE, impôt avec parts fiscales et versement libératoire. Celui-ci s'active aussi pour une simulation « et si » quand vous n'y avez pas droit, signalée en rouge ;
- seuils micro-entreprise et franchise TVA, TVA appliquée à partir d'une date choisie ;
- projection des encaissements à partir des factures et délais de paiement ;
- navigation multi-années, sauvegarde locale et export CSV annuel.

Chaque type de chiffre garde sa couleur partout : le net en vert, le CA en bleu, **la TVA et les montants TTC en violet**, les cotisations en orange, l'impôt en rose. Thèmes clair et sombre.

L'application n'a pas de backend, pas de compte utilisateur et pas de tracking. Les données restent dans le navigateur via `localStorage`.

## Aperçu

Les captures ci-dessous utilisent un jeu de démonstration entièrement fictif : **Studio Lumen**. Elles ne contiennent aucune donnée personnelle ni donnée de production.

### Mois : pointer ses jours, voir son net

![Écran Mois : net d'octobre dans un bloc vert avec le montant TTC à facturer au client, barre de répartition du CA, calendrier des jours travaillés et réglages rapides](./.github/screenshots/month.png)

### Année : seuils et leviers

![Écran Année : net cumulé, montant facturé TTC, courbe du CA cumulé face au plafond micro, seuils et leviers](./.github/screenshots/year.png)

### Trésorerie : ce qui reste à encaisser et ce qu'il faut mettre de côté

![Écran Trésorerie : reste à encaisser, factures encaissées et à venir, sommes à prévoir et déclarations URSSAF](./.github/screenshots/treasury.png)

### Sur mobile

<p>
  <img src="./.github/screenshots/mobile-month.png" alt="Écran Mois sur mobile en thème clair : net, montant à facturer et calendrier" width="300">
  &nbsp;
  <img src="./.github/screenshots/mobile-treasury-dark.png" alt="Écran Trésorerie sur mobile en thème sombre : reste à encaisser et factures" width="300">
</p>

## Vue Développeur

| Domaine | Choix |
|---|---|
| Framework | **React 19** + **TanStack Start** |
| Routing | **TanStack Router** avec file routes |
| Build | **Vite 8** |
| Styles | **Tailwind CSS 4** avec tokens de thème |
| Typographie | **Figtree** via `@fontsource` |
| Graphiques | Composants SVG faits main (`src/components/viz`) |
| Animation | **Motion** |
| Icônes | **Lucide React** |
| Tests | **Vitest** |
| Persistance | Hooks `localStorage` versionnés |

Les choix produit et design sont consignés dans [PRODUCT.md](./PRODUCT.md) et [DESIGN.md](./DESIGN.md).

## Structure Du Projet

```text
src/
  screens/          Écrans Mois, Année, Trésorerie, Réglages et régularisation VL
  shell/            Coque de l'app : rail de navigation, barre d'onglets, année, notifications
  ui/               Primitives du design system : boutons, interrupteurs, dialogues, familles de couleurs
  view/             Modèles de vue calculés une fois depuis le moteur fiscal (useFiscalView)
  components/       Composants métier : calendrier, réglages rapides, graphiques, onboarding
  context/          Providers profil, année fiscale, thème et notifications
  hooks/            Stockage, gestes et état navigateur
  lib/              Moteur fiscal, projections, provisions, déclarations URSSAF, import/export et tests
  routes/           Entrées TanStack Router
  styles/           Tokens de thème Tailwind et styles globaux
```

## Développement Local

```bash
corepack enable
pnpm install
pnpm dev
```

Le serveur de développement tourne sur [http://localhost:4000](http://localhost:4000). Pour l'essayer sur un téléphone du même réseau, lancez `pnpm dev --host`.

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

L'app modélise aussi les seuils de franchise TVA, les fenêtres ACRE, l'éligibilité au versement libératoire via RFR, les parts fiscales du foyer, l'option IJ libérale et l'alerte compte bancaire dédié.

## Notes Qualité

- La logique de calcul est isolée dans `src/lib` et couverte par Vitest.
- Les objets persistés portent des `schemaVersion` et peuvent être migrés via `useVersionedStorage`. La version 2.0 conserve les données existantes telles quelles.
- L'app est pensée pour rester utilisable hors ligne après le premier chargement.
- La sauvegarde utilise un format applicatif pensé pour la restauration ; un export CSV annuel séparé sert aux tableurs et au comptable.

## Avertissement

Fiscal Architect fournit des estimations à titre indicatif. L'application ne remplace pas un conseil fiscal professionnel.
Vérifiez toujours les chiffres importants auprès de l'URSSAF, de Service-Public.fr ou d'un comptable.

## Licence

[MIT](./LICENSE) © Maxime Morellon
