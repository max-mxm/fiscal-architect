[English](./README.md) · **Français**

<div align="center">

# Fiscal Architect

**Simulateur fiscal et de revenus pour micro-entrepreneurs français.**
Suivez votre CA, anticipez vos charges URSSAF, comparez les statuts — directement dans le navigateur, sans backend ni tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](./public/manifest.webmanifest)

<!-- TODO: replace with real screenshot or GIF once produced -->
<!-- <img src=".github/screenshots/hero.png" alt="Fiscal Architect — aperçu" width="100%"> -->

</div>

> [!TIP]
> 🚀 **Ouvrez l'app → installez-la en 1 tap → utilisez-la hors ligne**
> **[fiscal-architect.vercel.app](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)**
>
> Fonctionne dans n'importe quel navigateur moderne. Installable comme une vraie app sur **macOS · iOS · Android · Windows · Linux** — sans store, sans compte, sans serveur. Vos données restent uniquement sur votre appareil.

---

## Pourquoi ce projet ?

Les calculatrices fiscales en ligne sont soit truffées de pubs, soit envoient vos chiffres à un serveur tiers, soit basées sur des constantes obsolètes. **Fiscal Architect** est l'inverse :

- **100 % client-side** — vos données ne quittent jamais votre navigateur (`localStorage`).
- **Constantes 2026 à jour** — seuil 83 600 €, taux URSSAF 26,1 %, abattement BNC 34 %, ACRE post-juillet 2026.
- **Open source, MIT** — auditable, modifiable, déployable sur votre propre infra.
- **PWA installable** — installation en 1 tap sur n'importe quel appareil, fonctionne entièrement offline une fois chargée.

## Installable sur tous les appareils

Fiscal Architect est une Progressive Web App : ouvrez le lien et votre navigateur vous proposera de l'installer comme une app à part entière. Pas de store, pas d'inscription, pas de gestionnaire de téléchargement — et une fois installée, elle fonctionne offline comme une app native.

| Plateforme | Comment installer |
|---|---|
| **macOS** (Chrome, Edge, Brave) | Barre d'adresse → icône d'installation, **ou** menu → *Installer Fiscal Architect…* |
| **macOS** (Safari 17+) | Bouton Partager → *Ajouter au Dock* |
| **iOS / iPadOS** (Safari) | Bouton Partager → *Sur l'écran d'accueil* |
| **Android** (Chrome, Edge, Samsung) | Bandeau d'installation, **ou** menu → *Installer l'application* / *Ajouter à l'écran d'accueil* |
| **Windows** (Chrome, Edge) | Barre d'adresse → icône d'installation, **ou** menu → *Applications → Installer ce site en tant qu'application* |
| **Linux** (Chromium-based) | Barre d'adresse → icône d'installation |

Après la première visite, l'app est aussi totalement utilisable **hors ligne** — votre calendrier, votre profil et vos simulations vivent dans le `localStorage` de votre appareil.

## Fonctionnalités

- **Calendrier de facturation interactif** — toggle jour par jour, drag pour remplir une plage, pré-remplissage des jours ouvrés.
- **Suivi CA cumulé vs seuil** — projection automatique du dépassement micro-entreprise.
- **Simulation temps réel** — sliders TJM / taux URSSAF / option versement libératoire ; tout se recalcule en live.
- **Charges fixes récurrentes** — gérables individuellement, intégrées au net mensuel.
- **Réserve vacances + IR projeté** — anticipez ce que vous garderez vraiment.

## Stack

| Domaine | Choix |
|---|---|
| Framework | **React 19** + **TanStack Start** + **TanStack Router** |
| Build | **Vite 8** |
| Styles | **Tailwind CSS 4** (`@theme` tokens) |
| Charts | **Recharts** |
| Anim | **Motion** |
| Icons | **Lucide React** |
| Tests | **Vitest** |
| Persistance | `localStorage` (hook `useLocalStorage`) |

## Quick start

```bash
git clone https://github.com/max-mxm/fiscal-architect.git
cd fiscal-architect
pnpm install
pnpm dev          # http://localhost:4000
```

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de dev (port 4000) |
| `pnpm build` | Build production |
| `pnpm lint` | Vérification TypeScript (`tsc --noEmit`) |
| `pnpm test` | Tests Vitest |
| `pnpm clean` | Supprime `dist/`, `.output/`, `.vinxi/` |

> Node 22 requis (voir `.nvmrc`). Le gestionnaire de paquets est **pnpm** (version épinglée via `packageManager` dans `package.json`) ; activez-le avec `corepack enable`.

## Constantes fiscales 2026

Périmètre couvert : freelance en prestations de services **BNC libéral non réglementé**. Source de vérité applicative : `src/lib/fiscal.ts`.

| Concept | Valeur 2026 | Symbole |
|---|---|---|
| Seuil micro-entreprise (services BIC/BNC, 2026-2028) | **83 600 €** | `SEUIL_MICRO` |
| Taux URSSAF cotisations BNC libéral non réglementé | **≈ 26,1 %** *(+1 pt vs 2025)* | `urssafRate` |
| Abattement forfaitaire BNC (assiette IR) | **34 %** | `ABATTEMENT_BNC` |
| Versement libératoire BNC (option) | **2,2 %** du CA | `TAUX_VL_BNC` |
| Tranches IR 2026 | 0 / 11 / 30 / 41 / 45 % | `TRANCHES_IR` |
| ACRE (à partir du 01/07/2026) | exonération **25 %** *(vs 50 % avant)* | — |

### Évolutions 2026

1. **Relèvement du seuil services** : 77 700 € → 83 600 € (applicable aux exercices 2026, 2027, 2028).
2. **Hausse de 1 point** des cotisations sociales BNC libéral non réglementé au 1er janvier 2026.
3. **ACRE** : le taux minoré passe à 75 % des cotisations habituelles à compter du 1er juillet 2026.

### Formules clés (régime micro, sans VL)

```text
CA mensuel        = TJM × jours travaillés
URSSAF            = CA × taux_URSSAF
Revenu imposable  = CA × (1 − abattement 34 %)
IR                = barème progressif appliqué au revenu imposable
Net après IR      = CA − URSSAF − charges fixes − IR
```

Avec **versement libératoire** activé, l'IR est remplacé par `CA × 2,2 %` prélevé en même temps que les cotisations URSSAF.

## Roadmap

- [x] Persistance localStorage du profil et du calendrier
- [x] Moteur fiscal centralisé (`src/lib/fiscal.ts`) avec tests Vitest
- [x] Calendrier de facturation 12 mois interactif
- [x] PWA installable (manifest + service worker)
- [ ] Alertes push de dépassement de seuil
- [ ] Export PDF / CSV global
- [ ] Multi-années avec comparaison N / N-1
- [ ] Mode clair / sombre

## Disclaimer

> [!WARNING]
> Fiscal Architect fournit des **estimations à titre indicatif**. L'application **ne remplace pas** un conseil fiscal professionnel.
> Vérifiez systématiquement vos calculs auprès de l'[URSSAF](https://www.autoentrepreneur.urssaf.fr/), de [Service-Public.fr](https://www.service-public.fr/), ou de votre comptable.
> Les constantes fiscales évoluent — si vous repérez une incohérence, [ouvrez une issue](https://github.com/max-mxm/fiscal-architect/issues/new/choose).

## Contributing

Les contributions sont bienvenues ! Les corrections de constantes fiscales et les tests supplémentaires sont particulièrement appréciés.
Voir [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

[MIT](./LICENSE) © Maxime Morellon

## Remerciements

- [TanStack](https://tanstack.com) pour Start & Router
- [Recharts](https://recharts.org) pour les graphiques
- [Lucide](https://lucide.dev) pour les icônes
- [Tailwind CSS](https://tailwindcss.com) pour le design system
- L'[URSSAF auto-entrepreneur](https://www.autoentrepreneur.urssaf.fr/) et [Service-Public.fr](https://www.service-public.fr/) — sources de vérité fiscale
