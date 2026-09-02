import type { Activity, CalendarMonth, UserProfile } from '~/types';
import { ACTIVITY_PARAMS, calcCAByActivity, calcCAFromEntries, calcIR } from '~/lib/fiscal';

export interface VLRegularizationRow {
  month: number;
  ca: number;
  taxableIncome: number;
  vlPaid: number;
  estimatedIncomeTax: number;
  difference: number;
}

export interface VLRegularizationEstimate {
  selectedMonths: number[];
  ca: number;
  taxableIncome: number;
  vlPaid: number;
  estimatedIncomeTax: number;
  difference: number;
  amountToProvision: number;
  rows: VLRegularizationRow[];
}

const ACTIVITIES: Activity[] = ['vente', 'serviceBic', 'liberalSsi', 'liberalCipav'];

/**
 * Estimation de trésorerie pour un VL appliqué à tort.
 *
 * Le barème est calculé une seule fois sur la base imposable cumulée des mois
 * sélectionnés, puis ventilé au prorata de la base de chaque mois. Le détail
 * mensuel reste donc explicatif : l'IR est bien un calcul annuel.
 */
export function calcVLRegularization(
  months: CalendarMonth[],
  profile: UserProfile,
  selectedMonths: number[],
): VLRegularizationEstimate {
  const selected = [...new Set(selectedMonths)]
    .filter((month) => Number.isInteger(month) && month >= 0 && month <= 11)
    .sort((a, b) => a - b);

  const rawRows = selected.map((monthIndex) => {
    const month = months.find((candidate) => candidate.month === monthIndex);
    if (!month) return { month: monthIndex, ca: 0, taxableIncome: 0, vlPaid: 0 };
    const byActivity = calcCAByActivity([month], profile);
    const taxableIncome = ACTIVITIES.reduce(
      (sum, activity) => sum + byActivity[activity] * (1 - ACTIVITY_PARAMS[activity].abattement),
      0,
    );
    const vlPaid = ACTIVITIES.reduce(
      (sum, activity) => sum + byActivity[activity] * ACTIVITY_PARAMS[activity].tauxVL,
      0,
    );
    return {
      month: monthIndex,
      ca: calcCAFromEntries(month, profile),
      taxableIncome,
      vlPaid,
    };
  });

  const taxableIncome = rawRows.reduce((sum, row) => sum + row.taxableIncome, 0);
  const estimatedIncomeTax = calcIR(taxableIncome, profile.partsFiscales);
  const rows = rawRows.map((row) => {
    const allocatedTax = taxableIncome > 0
      ? estimatedIncomeTax * (row.taxableIncome / taxableIncome)
      : 0;
    return {
      ...row,
      estimatedIncomeTax: allocatedTax,
      difference: allocatedTax - row.vlPaid,
    };
  });
  const vlPaid = rawRows.reduce((sum, row) => sum + row.vlPaid, 0);
  const difference = estimatedIncomeTax - vlPaid;

  return {
    selectedMonths: selected,
    ca: rawRows.reduce((sum, row) => sum + row.ca, 0),
    taxableIncome,
    vlPaid,
    estimatedIncomeTax,
    difference,
    amountToProvision: Math.max(0, difference),
    rows,
  };
}
