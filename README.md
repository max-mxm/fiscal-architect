**English** · [Français](./README.fr.md)

<div align="center">

# Fiscal Architect

**A private tax and revenue simulator for French micro-entrepreneurs.**

Plan revenue, social contributions, income tax, VAT thresholds and cash collection from a fully client-side PWA.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](./public/manifest.webmanifest)

[Open the app](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)

<!-- Demo placeholder: add your GIF here when ready. -->
<!-- <img src="./.github/screenshots/demo.gif" alt="Fiscal Architect demo" width="100%"> -->

</div>

---

## What It Does

Fiscal Architect helps French freelancers and small independent businesses simulate the practical side of a micro-entreprise:

- revenue input by worked days, fixed-price work, monthly totals, or mixed mode;
- multi-activity profiles across sales, BIC services, liberal SSI and liberal CIPAV;
- URSSAF, CFP, chamber tax, ACRE, income tax and versement liberatoire simulation;
- micro-enterprise and VAT franchise threshold tracking;
- cashflow projection from invoice dates to expected payment dates;
- multi-year navigation and local backup export/import.

The application has no backend, no account system and no tracking. User data stays in the browser through `localStorage`.

## Developer Overview

| Area | Choice |
|---|---|
| Framework | **React 19** + **TanStack Start** |
| Routing | **TanStack Router** file routes |
| Build | **Vite 8** |
| Styling | **Tailwind CSS 4** with theme tokens |
| Charts | **Recharts** |
| Animation | **Motion** |
| Icons | **Lucide React** |
| Tests | **Vitest** |
| Persistence | Versioned `localStorage` hooks |

## Project Structure

```text
src/
  components/       Shared UI and feature components
  context/          App providers for profile, fiscal year, theme and notifications
  hooks/            Browser state, storage and interaction hooks
  lib/              Fiscal engine, calendar logic, cashflow, import/export and tests
  pages/            Main application screens
  routes/           TanStack Router route entries
  styles/           Tailwind theme and global styles
```

## Local Development

```bash
corepack enable
pnpm install
pnpm dev
```

The dev server runs on [http://localhost:4000](http://localhost:4000).

| Command | Description |
|---|---|
| `pnpm dev` | Start the local dev server |
| `pnpm build` | Build the production app |
| `pnpm lint` | Run TypeScript checks |
| `pnpm test` | Run the Vitest suite |
| `pnpm clean` | Remove generated build folders |

Node 22 is required. See [.nvmrc](./.nvmrc).

## Fiscal Scope

The tax engine source of truth lives in `src/lib/fiscal.ts`.

| Activity | URSSAF | Allowance | Micro threshold | VL |
|---|---:|---:|---:|---:|
| Sales / accommodation | 12.3% | 71% | EUR 203,100 | 1.0% |
| BIC services / craft | 21.2% | 50% | EUR 83,600 | 1.7% |
| Liberal SSI | 25.6% | 34% | EUR 83,600 | 2.2% |
| Liberal CIPAV | 23.2% | 34% | EUR 83,600 | 2.2% |

Other modeled rules include VAT franchise thresholds, ACRE reduction windows, RFR-based versement liberatoire eligibility, liberal daily benefits and the dedicated bank-account alert.

## Quality Notes

- Calculation-heavy logic is isolated in `src/lib` and covered by Vitest.
- Persistent objects carry `schemaVersion` fields and can be migrated through `useVersionedStorage`.
- The app is designed to remain usable offline after the first load.
- Import/export uses an application backup format rather than CSV, because it is intended for restore workflows.

## Disclaimer

Fiscal Architect provides estimates for informational purposes only. It does not replace professional tax advice.
Always cross-check important figures with URSSAF, Service-Public.fr, or an accountant.

## License

[MIT](./LICENSE) © Maxime Morellon
