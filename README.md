**English** · [Français](./README.fr.md)

<div align="center">

# Fiscal Architect

**Tax and revenue simulator for French micro-entrepreneurs (auto-entrepreneurs).**
Track your revenue, anticipate URSSAF contributions, compare legal statuses — all in your browser, with no backend and no tracking.

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

Online tax calculators are either ad-ridden, send your numbers to third-party servers, or rely on outdated constants. **Fiscal Architect** is the opposite:

- **100% client-side** — your data never leaves your browser (`localStorage`).
- **2026 constants up to date** — €83,600 threshold, 26.1% URSSAF rate, 34% BNC allowance, post-July 2026 ACRE.
- **Open source, MIT** — auditable, modifiable, deployable on your own infrastructure.
- **Installable PWA** — one-tap install on any device, works fully offline once loaded.

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

- **Interactive billing calendar** — toggle individual days, drag to fill a range, prefill business days.
- **Cumulative revenue tracking vs threshold** — automatic projection of micro-entreprise threshold breach.
- **Real-time simulation** — sliders for daily rate / URSSAF rate / *versement libératoire* (flat-rate option); everything recomputes live.
- **Recurring fixed expenses** — managed individually, factored into the monthly net.
- **Vacation reserve + projected income tax** — anticipate what you'll actually keep.

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

Scope covered: freelancers providing services as **BNC libéral non réglementé** (unregulated liberal professions). Source of truth in code: `src/lib/fiscal.ts`.

| Concept | 2026 value | Symbol |
|---|---|---|
| Micro-entreprise threshold (BIC/BNC services, 2026-2028) | **€83,600** | `SEUIL_MICRO` |
| URSSAF contribution rate (BNC libéral non réglementé) | **≈ 26.1%** *(+1pt vs 2025)* | `urssafRate` |
| Flat BNC allowance (income-tax base) | **34%** | `ABATTEMENT_BNC` |
| BNC *versement libératoire* (optional flat-tax payment) | **2.2%** of revenue | `TAUX_VL_BNC` |
| 2026 income-tax brackets | 0 / 11 / 30 / 41 / 45% | `TRANCHES_IR` |
| ACRE (from 2026-07-01) | **25%** exemption *(down from 50%)* | — |

### 2026 changes

1. **Service threshold raised**: €77,700 → €83,600 (applies to fiscal years 2026, 2027, 2028).
2. **+1 percentage point** on social contributions for BNC libéral non réglementé starting 2026-01-01.
3. **ACRE**: the reduced rate moves to 75% of normal contributions from 2026-07-01.

### Key formulas (micro regime, no flat-tax option)

```text
Monthly revenue       = daily rate × billed days
URSSAF                = revenue × URSSAF rate
Taxable income        = revenue × (1 − 34% allowance)
Income tax            = progressive bracket applied to taxable income
Net after income tax  = revenue − URSSAF − fixed expenses − income tax
```

With **versement libératoire** enabled, income tax is replaced by `revenue × 2.2%`, withheld together with URSSAF contributions.

## Roadmap

- [x] localStorage persistence for profile and calendar
- [x] Centralized tax engine (`src/lib/fiscal.ts`) with Vitest coverage
- [x] Interactive 12-month billing calendar
- [x] Installable PWA (manifest + service worker)
- [ ] Push notifications on threshold breach
- [ ] Global PDF / CSV export
- [ ] Multi-year view with N / N-1 comparison
- [ ] Light / dark mode

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
