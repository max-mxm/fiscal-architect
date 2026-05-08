import type { IdentityProfile, YearConfig, YearsIndex, FixedCost } from '~/types';

export const DEFAULT_FIXED_COSTS: FixedCost[] = [
  { id: '1', name: 'Outils & SaaS', description: 'Adobe, Slack, Notion', amount: 85, icon: 'laptop', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' },
  { id: '2', name: 'Espace coworking', description: 'Location bureau mensuel', amount: 350, icon: 'users', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' },
  { id: '3', name: 'Assurance pro', description: 'RC Pro + Mutuelle', amount: 120, icon: 'shield', color: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300' },
];

/**
 * Paramètres légaux par année (taux URSSAF de référence + plafond micro).
 * Source : urssaf.fr / impots.gouv.fr — à mettre à jour quand la loi change.
 */
export const LEGAL_PARAMS_BY_YEAR: Record<number, { urssafRate: number; seuilMicro: number }> = {
  2024: { urssafRate: 21.2, seuilMicro: 77_700 },
  2025: { urssafRate: 24.6, seuilMicro: 77_700 },
  2026: { urssafRate: 26.1, seuilMicro: 83_600 },
  2027: { urssafRate: 26.1, seuilMicro: 83_600 },
  2028: { urssafRate: 26.1, seuilMicro: 83_600 },
};

/** Paramètres légaux applicables à une année — fallback sur l'année la plus récente connue. */
export function getLegalParamsForYear(year: number): { urssafRate: number; seuilMicro: number } {
  if (LEGAL_PARAMS_BY_YEAR[year]) return LEGAL_PARAMS_BY_YEAR[year];
  const knownYears = Object.keys(LEGAL_PARAMS_BY_YEAR).map(Number).sort((a, b) => b - a);
  const closest = knownYears.find((y) => y <= year) ?? knownYears[0];
  return LEGAL_PARAMS_BY_YEAR[closest];
}

export const DEFAULT_IDENTITY: IdentityProfile = {
  schemaVersion: 1,
  name: 'Alex Durand',
  role: 'Freelance Senior UX',
  creationDate: `${new Date().getFullYear()}-01-01`,
  partsFiscales: 1,
  declarationPeriod: 'monthly',
  onboardingDone: false,
};

/** Construit une YearConfig par défaut pour une année donnée. */
export function buildDefaultYearConfig(year: number): YearConfig {
  const legal = getLegalParamsForYear(year);
  return {
    schemaVersion: 1,
    year,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    tjm: 650,
    workingDays: 19,
    revenueModel: 'days',
    activities: [{ id: 'act-default', type: 'liberalSsi', isPrimary: true }],
    fixedCosts: DEFAULT_FIXED_COSTS.map((c) => ({ ...c })),
    versementLiberatoire: false,
    acreEnabled: false,
    tvaAssujetti: false,
    cfpEnabled: true,
    taxeConsulaireEnabled: false,
    ijOption: false,
    rfrN2: null,
    missionStart: `${year}-01-01`,
  };
}

export function buildDefaultYearsIndex(year: number): YearsIndex {
  return { schemaVersion: 1, years: [year], activeYear: year };
}

export const MONTHS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const CHART_DATA = [
  { name: 'Jan', gross: 10000, net: 6500 },
  { name: 'Fév', gross: 11500, net: 7200 },
  { name: 'Mar', gross: 10800, net: 6800 },
  { name: 'Avr', gross: 12000, net: 7800 },
  { name: 'Mai', gross: 11200, net: 7100 },
  { name: 'Jun', gross: 14300, net: 9410 },
  { name: 'Jul', gross: 12400, net: 7820 },
  { name: 'Aoû', gross: 13000, net: 8200 },
  { name: 'Sep', gross: 11800, net: 7400 },
  { name: 'Oct', gross: 12500, net: 7900 },
  { name: 'Nov', gross: 11000, net: 6900 },
  { name: 'Déc', gross: 12000, net: 7600 },
];
