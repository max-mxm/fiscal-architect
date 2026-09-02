**English** · [Français](./README.fr.md)

# Fiscal Architect

Fiscal Architect is a private, client-side tax and revenue simulator for French micro-entrepreneurs.
It helps freelancers and small independent businesses plan revenue, social contributions, income tax, VAT thresholds, cash collection and yearly transitions without sending data to a server.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml/badge.svg)](https://github.com/max-mxm/fiscal-architect/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=react)](https://tanstack.com/start)

## App

[Open Fiscal Architect](https://fiscal-architect-j1gfhjmps-maxmxms-projects.vercel.app/)

- 100% browser-based: data is stored locally in `localStorage`.
- Installable PWA: works offline after the first load.
- Built for French micro-entreprise rules and 2026 tax constants.
- User interface in French, codebase mostly in English.

## Main Features

- Revenue input by worked days, fixed-price work, monthly totals, or mixed mode.
- Multi-activity profiles: sales, BIC services, unregulated liberal SSI, regulated liberal CIPAV.
- URSSAF, CFP, chamber tax, ACRE, liberal daily-benefit option and income-tax simulation.
- Versement liberatoire eligibility check from N-2 RFR and tax shares.
- Micro-enterprise and VAT franchise threshold tracking.
- Cashflow projection from invoice dates to expected payment dates.
- Multi-year navigation with explicit yearly transition.
- Local backup export/import for restoring data after a reset or redeploy.
- Dark mode, notification center, quick edits and install prompt.

## Stack

| Area | Choice |
|---|---|
| Framework | React 19, TanStack Start, TanStack Router |
| Build | Vite 8 |
| Styles | Tailwind CSS 4 |
| Charts | Recharts |
| Animation | Motion |
| Icons | Lucide React |
| Tests | Vitest |
| Persistence | localStorage |

## Development

```bash
corepack enable
pnpm install
pnpm dev
```

The dev server runs on [http://localhost:4000](http://localhost:4000).

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the app |
| `pnpm lint` | Run TypeScript checks |
| `pnpm test` | Run the Vitest suite |
| `pnpm clean` | Remove generated build folders |

Node 22 is required. See [.nvmrc](./.nvmrc).

## Fiscal Scope

The tax engine uses constants defined in `src/lib/fiscal.ts`.

| Activity | URSSAF | Allowance | Micro threshold | VL |
|---|---:|---:|---:|---:|
| Sales / accommodation | 12.3% | 71% | EUR 203,100 | 1.0% |
| BIC services / craft | 21.2% | 50% | EUR 83,600 | 1.7% |
| Liberal SSI | 25.6% | 34% | EUR 83,600 | 2.2% |
| Liberal CIPAV | 23.2% | 34% | EUR 83,600 | 2.2% |

Important 2026 values:

- VAT franchise threshold: EUR 36,800 for services/BNC, EUR 91,900 for sales.
- ACRE: 25% URSSAF reduction for 12 months since 2024-05-01, 50% before that date.
- VL eligibility: based on household N-2 RFR and tax shares.
- Dedicated bank account alert: from EUR 10,000 revenue over two consecutive years.

## Disclaimer

Fiscal Architect provides estimates for informational purposes only. It does not replace professional tax advice.
Always cross-check important figures with URSSAF, Service-Public.fr, or an accountant.

## License

[MIT](./LICENSE) © Maxime Morellon
