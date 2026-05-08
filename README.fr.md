[English](./README.md) · **Français**

<div align="center">

# Fiscal Architect

**Simulateur fiscal et de revenus pour tous les micro-entrepreneurs français.**
Freelance journalier, artisan au forfait, e-commerçant, VTC, loueur meublé, multi-activités… Suivez votre CA, ventilez vos charges par activité, vérifiez vos seuils — directement dans le navigateur, sans backend ni tracking.

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

Les calculatrices fiscales en ligne sont soit truffées de pubs, soit envoient vos chiffres à un serveur tiers, soit basées sur des constantes obsolètes — et la plupart ne couvrent qu'un seul type de micro. **Fiscal Architect** est l'inverse :

- **100 % client-side** — vos données ne quittent jamais votre navigateur (`localStorage`).
- **Toutes les activités micro** — vente, services BIC/artisan, libéral SSI, CIPAV, multi-activité avec ventilation par branche.
- **Plusieurs modes de saisie** — calendrier journalier (TJM × jours), prestations au forfait, CA mensuel agrégé, ou mixte.
- **Constantes 2026 à jour** — URSSAF, abattements, seuils micro et TVA, ACRE 50/25 %, RFR pour le VL.
- **Open source, MIT** — auditable, modifiable, déployable sur votre propre infra.
- **PWA installable** — installation en 1 tap sur n'importe quel appareil, fonctionne entièrement offline une fois chargée.

## Profils couverts

Au premier lancement, choisissez votre profil — la configuration (mode de saisie, activité, options fiscales) est pré-remplie pour vous. Tout reste ajustable ensuite.

| Profil | Mode de saisie | Activité par défaut |
|---|---|---|
| **Freelance / consultant** | Jours travaillés × TJM | Libéral non réglementé (SSI) |
| **Artisan / prestataire au forfait** | Prestations ponctuelles datées | Services BIC / artisan |
| **E-commerce / marketplace** | CA mensuel agrégé | Vente / hébergement (BIC) |
| **VTC / livreur** | CA mensuel agrégé | Services BIC |
| **Loueur meublé / chambre d'hôte** | CA mensuel agrégé | Vente / hébergement |
| **Configuration libre** | Mixte (jusqu'à 4 activités cumulables) | À votre main |

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

- **4 modes de saisie** — calendrier journalier, prestations au forfait, CA mensuel agrégé, ou mixte (mélange libre).
- **Multi-activité** — jusqu'à 4 activités cumulables avec ventilation correcte de l'URSSAF, CFP, taxe consulaire et IR par branche, et seuils mixtes.
- **Onboarding par persona** — au premier lancement, une modale propose 5 profils types qui pré-remplissent toute la configuration.
- **Centre de notifications dismissable** — cloche en header, badge de comptage, alertes compte pro / seuil micro masquables sans les perdre.
- **Édition rapide** — clic direct sur les valeurs affichées (charges fixes, identité…) pour les modifier sans ouvrir le drawer.
- **Calendrier interactif** — jours pleins, demi-journées, jours fériés FR, drag pour remplir une plage, pré-remplissage des jours ouvrés.
- **Triple jauge de seuils** — réalisé / projeté / cible pour le seuil micro **et** le seuil franchise TVA, avec alerte de bascule projetée.
- **Charges fiscales complètes** — URSSAF, IR au barème ou versement libératoire, CFP, taxe consulaire CCI/CMA, indemnités journalières optionnelles (libéraux), ACRE 50 %/25 % avec fenêtre 12 mois automatique.
- **Vérification éligibilité VL** — saisie du RFR N-2 et des parts fiscales, désactive automatiquement le toggle si le plafond est dépassé.
- **Alerte légale compte pro** — banderole et notification dès 10 000 € de CA cumulé (article L.123-24 du Code de commerce).
- **Simulation temps réel** — sliders TJM / URSSAF / VL ; tout se recalcule en live.
- **Charges fixes récurrentes** — gérables individuellement, intégrées au net mensuel.

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

Source de vérité applicative : `src/lib/fiscal.ts` (`ACTIVITY_PARAMS`).

| Activité | URSSAF | Abattement IR | Plafond micro | VL | CFP | Taxe consulaire |
|---|---|---|---|---|---|---|
| Vente / hébergement (BIC) | **12,3 %** | 71 % | 203 100 € | 1,0 % | 0,1 % | 0,015 % |
| Services BIC / artisan | **21,2 %** | 50 % | 83 600 € | 1,7 % | 0,3 % | 0,044 % |
| Libéral non réglementé (SSI) | **26,1 %** | 34 % | 83 600 € | 2,2 % | 0,2 % | 0 |
| Libéral réglementé (CIPAV) | **23,2 %** | 34 % | 83 600 € | 2,2 % | 0,2 % | 0 |

| Concept transverse | Valeur 2026 |
|---|---|
| Seuil franchise TVA — services / BNC | **36 800 €** (basique) · 39 100 € (majoré) |
| Seuil franchise TVA — vente | **91 900 €** (basique) · 101 000 € (majoré) |
| Tranches IR 2026 | 0 / 11 / 30 / 41 / 45 % |
| ACRE (avant 01/05/2024) | **50 %** d'URSSAF pendant 12 mois |
| ACRE (à partir du 01/05/2024) | **25 %** d'URSSAF pendant 12 mois |
| Plafond RFR N-2 pour VL | ≈ **27 478 €** par part fiscale |
| Compte bancaire dédié obligatoire | dès **10 000 €** de CA / 2 années consécutives |
| Taux IJ libéral (option) | 0,85 % du CA libéral |

### Évolutions 2026

1. **Relèvement du seuil services** : 77 700 € → 83 600 € (applicable aux exercices 2026, 2027, 2028).
2. **Hausse de 1 point** des cotisations sociales BNC libéral non réglementé au 1er janvier 2026.
3. **ACRE** : taux 25 % depuis le 01/05/2024 (50 % avant).
4. **Versement libératoire** : éligibilité subordonnée au RFR N-2 du foyer (≈ 27 478 € × parts fiscales).
5. **Compte pro** : obligation L.123-24 du Code de commerce dès 10 000 € de CA pendant 2 ans.

### Formules clés (multi-activité)

```text
Pour chaque activité a (avec son CA_a) :
  URSSAF_a            = CA_a × taux_URSSAF_a
  CFP_a               = CA_a × taux_CFP_a
  Taxe consulaire_a   = CA_a × taux_taxe_a   (vente + services BIC seulement)
  Revenu imposable_a  = CA_a × (1 − abattement_a)

ACRE        = Σ URSSAF_brut × (50 % ou 25 %)  pendant 12 mois post-création
IJ libéral  = (CA_liberalSsi + CA_liberalCipav) × 0,85 %  (option)

CA_total          = Σ CA_a
URSSAF_net        = Σ URSSAF_a − ACRE
Charges sociales  = URSSAF_net + Σ CFP_a + Σ Taxe_a + IJ
IR (barème)       = barème progressif appliqué à Σ Revenu imposable_a
IR (VL activé)    = Σ CA_a × taux_VL_a
Net après IR      = CA_total − Charges sociales − Charges fixes − IR
```

Pour un freelance journalier mono-activité, `CA_a = TJM × jours_travaillés`. Pour un artisan au forfait, `CA_a = Σ montants des prestations`. Pour un VTC ou e-commerçant, `CA_a = montant mensuel agrégé`.

## Roadmap

- [x] Persistance localStorage du profil et du calendrier
- [x] Moteur fiscal centralisé (`src/lib/fiscal.ts`) avec **212 tests Vitest**
- [x] Calendrier de facturation 12 mois interactif
- [x] PWA installable (manifest + service worker)
- [x] **Modes de saisie pluggables** (jours / forfait / mensuel agrégé / mixte)
- [x] **Multi-activité** avec ventilation URSSAF / CFP / taxe consulaire / IR par branche
- [x] **Suivi TVA franchise en base** + alerte de bascule projetée
- [x] **Centre de notifications dismissable** (compte pro, seuil micro)
- [x] **Onboarding par persona** (5 profils types pré-configurés)
- [x] **Édition rapide via popup** (charges fixes, identité)
- [x] **Éligibilité VL via RFR N-2**
- [x] **Indemnités journalières optionnelles** pour libéraux
- [ ] Notifications push PWA (Service Worker)
- [ ] Export PDF / CSV global
- [ ] Multi-années avec comparaison N / N-1
- [ ] Mode clair / sombre
- [ ] Comparateur micro-entreprise vs régime réel simplifié

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
