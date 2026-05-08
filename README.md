**English** · [Français](./README.fr.md)

<div align="center">

# Fiscal Architect

**Tax and revenue simulator for every French micro-entrepreneur (auto-entrepreneur).**
Day-rate freelancers, fixed-price craftspeople, e-commerce sellers, ride-share drivers, short-term rental hosts, multi-activity profiles — track your revenue, split your contributions per activity, watch your thresholds, all in your browser with no backend and no tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](./public/manifest.webmanifest)

<!-- TODO: replace with real screenshot or GIF once produced -->
<!-- <img src=".github/screenshots/hero.png" alt="Fiscal Architect — preview" width="100%"> -->

</div>

> [!TIP]
> 🚀 **Open the app → install in one tap → use it offline**
> **[fiscal-architect.vercel.app](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)**
>
> Works in any modern browser. Install it as a real app on **macOS · iOS · Android · Windows · Linux** — no app store, no account, no server. Your data lives on your device only.

> **About the scope**: this tool is built around the French tax system (micro-entreprise, URSSAF, BNC). The codebase is in English; the user-facing UI is in French.

---

## Why this project?

Online tax calculators are either ad-ridden, send your numbers to third-party servers, or rely on outdated constants — and most only cover one type of micro-entreprise. **Fiscal Architect** is the opposite:

- **100% client-side** — your data never leaves your browser (`localStorage`).
- **All micro-entreprise activities** — sales (BIC), commercial services / artisans, unregulated liberal (SSI), regulated liberal (CIPAV), with multi-activity ventilation per branch.
- **Multiple input modes** — daily calendar (rate × days), fixed-price quotes, aggregated monthly revenue, or mixed.
- **2026 constants up to date** — URSSAF, allowances, micro and VAT thresholds, ACRE 50/25%, RFR for the *versement libératoire*.
- **Open source, MIT** — auditable, modifiable, deployable on your own infrastructure.
- **Installable PWA** — one-tap install on any device, works fully offline once loaded.

## Profiles covered

On first launch, pick your profile — input mode, activity and tax options are pre-filled for you. Everything stays adjustable later.

| Profile | Input mode | Default activity |
|---|---|---|
| **Freelancer / consultant** | Days worked × daily rate | Unregulated liberal (SSI) |
| **Craftsperson / fixed-price provider** | Dated one-off quotes | Commercial services / artisan |
| **E-commerce / marketplace** | Aggregated monthly revenue | Sales / accommodation (BIC) |
| **Ride-share / delivery driver** | Aggregated monthly revenue | Commercial services |
| **Short-term rental host** | Aggregated monthly revenue | Sales / accommodation |
| **Free configuration** | Mixed (up to 4 cumulative activities) | Your call |

## Install on any device

Fiscal Architect is a Progressive Web App: just open the link, and your browser will offer to install it as a standalone app. No app store, no signup, no download manager — and once installed, it runs offline like a native app.

| Platform | How to install |
|---|---|
| **macOS** (Chrome, Edge, Brave) | Address bar → install icon, **or** menu → *Install Fiscal Architect…* |
| **macOS** (Safari 17+) | Share button → *Add to Dock* |
| **iOS / iPadOS** (Safari) | Share button → *Add to Home Screen* |
| **Android** (Chrome, Edge, Samsung) | Install banner, **or** menu → *Install app* / *Add to Home Screen* |
| **Windows** (Chrome, Edge) | Address bar → install icon, **or** menu → *Apps → Install this site as an app* |
| **Linux** (Chromium-based) | Address bar → install icon |

After the first visit, the app is also fully usable **offline** — your calendar, profile and simulations all live in `localStorage` on your device.

## Features

- **4 input modes** — daily calendar, fixed-price quotes, aggregated monthly revenue, or mixed (free combination).
- **Multi-activity** — up to 4 cumulative activities with correct ventilation of URSSAF, CFP, chamber tax and income tax per branch, plus mixed thresholds.
- **Multi-year** — `‹ 2026 ›` stepper for navigation, explicit transition popup when entering a new year (carry over the previous year's settings or start from default values), automatic patch of legal parameters (URSSAF, micro threshold).
- **Dark mode** — light / dark / system theme with unified tokens (`@theme`), respects `prefers-color-scheme`, persisted per device.
- **Persona onboarding** — first-launch modal offers 5 preset profiles that pre-fill the entire configuration.
- **Dismissable notification center** — header bell, count badge, hide *compte pro* / micro threshold alerts without losing them.
- **Quick edit** — click directly on displayed values (fixed expenses, identity…) to edit them without opening the settings drawer.
- **Interactive calendar** — full days, half-days, French public holidays, drag to fill a range, prefill business days.
- **Triple threshold gauge** — realised / projected / target for both the micro threshold **and** the VAT *franchise en base* threshold, with projected breach date.
- **Complete tax charges** — URSSAF, income tax (progressive bracket or flat-rate option), CFP, CCI/CMA chamber tax, optional daily benefits (liberals), ACRE 50%/25% with automatic 12-month window.
- **VL eligibility check** — enter your N-2 *RFR* and tax shares, the toggle is automatically disabled if the cap is exceeded.
- **Mandatory pro account alert** — banner and notification once cumulative revenue passes €10,000 (article L.123-24 of the French Commercial Code).
- **Real-time simulation** — sliders for daily rate / URSSAF / VL; everything recomputes live.
- **Recurring fixed expenses** — managed individually, factored into the monthly net.

## Stack

| Domain | Choice |
|---|---|
| Framework | **React 19** + **TanStack Start** + **TanStack Router** |
| Build | **Vite 8** |
| Styles | **Tailwind CSS 4** (`@theme` tokens) |
| Charts | **Recharts** |
| Animation | **Motion** |
| Icons | **Lucide React** |
| Tests | **Vitest** |
| Persistence | `localStorage` (via the `useLocalStorage` hook) |

## Quick start

```bash
git clone https://github.com/max-mxm/fiscal-architect.git
cd fiscal-architect
pnpm install
pnpm dev          # http://localhost:4000
```

| Command | Description |
|---|---|
| `pnpm dev` | Dev server (port 4000) |
| `pnpm build` | Production build |
| `pnpm lint` | TypeScript check (`tsc --noEmit`) |
| `pnpm test` | Vitest suite |
| `pnpm clean` | Remove `dist/`, `.output/`, `.vinxi/` |

> Node 22 required (see `.nvmrc`). The package manager is **pnpm** (version pinned via `packageManager` in `package.json`); enable it with `corepack enable`.

## 2026 tax constants

Source of truth in code: `src/lib/fiscal.ts` (`ACTIVITY_PARAMS`).

| Activity | URSSAF | Income-tax allowance | Micro threshold | VL | CFP | Chamber tax |
|---|---|---|---|---|---|---|
| Sales / accommodation (BIC) | **12.3%** | 71% | €203,100 | 1.0% | 0.1% | 0.015% |
| Commercial services / artisan | **21.2%** | 50% | €83,600 | 1.7% | 0.3% | 0.044% |
| Unregulated liberal (SSI) | **26.1%** | 34% | €83,600 | 2.2% | 0.2% | 0 |
| Regulated liberal (CIPAV) | **23.2%** | 34% | €83,600 | 2.2% | 0.2% | 0 |

| Cross-cutting concept | 2026 value |
|---|---|
| VAT *franchise en base* threshold — services / BNC | **€36,800** (basic) · €39,100 (boosted) |
| VAT *franchise en base* threshold — sales | **€91,900** (basic) · €101,000 (boosted) |
| 2026 income-tax brackets | 0 / 11 / 30 / 41 / 45% |
| ACRE (before 2024-05-01) | **50%** URSSAF reduction for 12 months |
| ACRE (from 2024-05-01) | **25%** URSSAF reduction for 12 months |
| RFR N-2 cap for VL eligibility | ≈ **€27,478** per fiscal share |
| Mandatory dedicated bank account | from **€10,000** revenue / 2 consecutive years |
| Liberal daily-benefits rate (option) | 0.85% of liberal revenue |

### 2026 changes

1. **Service threshold raised**: €77,700 → €83,600 (applies to fiscal years 2026, 2027, 2028).
2. **+1 percentage point** on social contributions for BNC libéral non réglementé starting 2026-01-01.
3. **ACRE**: 25% rate since 2024-05-01 (50% before).
4. **Versement libératoire**: eligibility now subject to the household's N-2 RFR (≈ €27,478 × fiscal shares).
5. **Pro bank account**: L.123-24 obligation kicks in from €10,000 of revenue across 2 consecutive years.

### Key formulas (multi-activity)

```text
For each activity a (with its CA_a):
  URSSAF_a            = CA_a × URSSAF_rate_a
  CFP_a               = CA_a × CFP_rate_a
  Chamber_a           = CA_a × chamber_rate_a   (sales + BIC services only)
  Taxable income_a    = CA_a × (1 − allowance_a)

ACRE         = Σ URSSAF_gross × (50% or 25%)  for 12 months post-creation
Liberal IJ   = (CA_liberalSsi + CA_liberalCipav) × 0.85%   (option)

Total CA            = Σ CA_a
URSSAF_net          = Σ URSSAF_a − ACRE
Social charges      = URSSAF_net + Σ CFP_a + Σ Chamber_a + IJ
Income tax (bracket)= progressive bracket applied to Σ Taxable income_a
Income tax (VL)     = Σ CA_a × VL_rate_a
Net after income tax= Total CA − Social charges − Fixed expenses − Income tax
```

For a single-activity day-rate freelancer, `CA_a = daily rate × days worked`. For a fixed-price craftsperson, `CA_a = Σ quote amounts`. For a ride-share driver or e-commerce seller, `CA_a = monthly aggregated amount`.

## Roadmap

- [x] localStorage persistence for profile and calendar
- [x] Centralized tax engine (`src/lib/fiscal.ts`) with **227 Vitest tests**
- [x] Interactive 12-month billing calendar
- [x] Installable PWA (manifest + service worker)
- [x] **Pluggable input modes** (days / fixed-price / monthly aggregated / mixed)
- [x] **Multi-activity** with URSSAF / CFP / chamber tax / income tax ventilation per branch
- [x] **VAT franchise tracking** + projected breach alert
- [x] **Dismissable notification center** (pro account, micro threshold)
- [x] **Persona onboarding** (5 preset profile types)
- [x] **Quick edit via popup** (fixed expenses, identity)
- [x] **VL eligibility via N-2 RFR**
- [x] **Optional liberal daily benefits**
- [x] **Light / dark mode** with unified tokens and `prefers-color-scheme` support
- [x] **Multi-year** — navigation stepper and transition popup (carry over from N-1 or default values)

## Disclaimer

> [!WARNING]
> Fiscal Architect provides **estimates for informational purposes only**. The application **does not replace** professional tax advice.
> Always cross-check your figures with [URSSAF](https://www.autoentrepreneur.urssaf.fr/), [Service-Public.fr](https://www.service-public.fr/), or your accountant.
> Tax constants evolve — if you spot an inconsistency, [open an issue](https://github.com/max-mxm/fiscal-architect/issues/new/choose).

## Contributing

Contributions are welcome! Tax-constant corrections and additional tests are particularly appreciated.
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Maxime Morellon

## Acknowledgments

- [TanStack](https://tanstack.com) for Start & Router
- [Recharts](https://recharts.org) for the charts
- [Lucide](https://lucide.dev) for the icons
- [Tailwind CSS](https://tailwindcss.com) for the design system
- [URSSAF auto-entrepreneur](https://www.autoentrepreneur.urssaf.fr/) and [Service-Public.fr](https://www.service-public.fr/) — the canonical sources for French tax data
