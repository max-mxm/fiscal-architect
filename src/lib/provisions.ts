import type { CalendarMonth, UserProfile } from '~/types';
import { buildPaymentProjections } from '~/lib/cashflow';
import { calcIR, monthHasRevenueForModel, normalizeParts } from '~/lib/fiscal';
import { calcCalendarMonthBreakdown } from '~/lib/monthlyNet';
import { getYearProgress, monthsThroughDate, projectMonths } from '~/lib/projection';
import { calcVLEligibilityForYear, type VLEligibility } from '~/lib/vlEligibility';
import { calcVLRegularization } from '~/lib/vlRegularization';

export interface ProvisionAmounts {
  caHT: number;
  /** URSSAF nette d'ACRE. */
  urssaf: number;
  acreReduction: number;
  cfp: number;
  taxeConsulaire: number;
  ij: number;
  /** URSSAF nette + CFP + taxe consulaire + IJ. */
  urssafEtContributions: number;
  /** IR estimé : barème avec parts, ou VL. */
  impot: number;
  impotMode: 'bareme' | 'vl';
  /** TVA collectée à reverser (factures soumises à la TVA). */
  tvaCollectee: number;
  /** Complément d'IR si le VL est actif alors que le RFR le rend inéligible. */
  regularisationVL: number;
  total: number;
}

export interface Provisions {
  /** Réalisé : travail effectué jusqu'à la date de référence (TVA : factures émises). */
  aDate: ProvisionAmounts;
  /** Projeté : saisie + extrapolation des mois futurs (`projectMonths`). */
  finAnnee: ProvisionAmounts;
  vlEligibility: VLEligibility;
  /** VL actif alors que le RFR dépasse le plafond. */
  vlRegularizationNeeded: boolean;
  referenceDate: Date;
}

export interface ProvisionsOptions {
  year: number;
  /** Date de référence du « à date ». Défaut : maintenant. */
  referenceDate?: Date;
  /** Fériés pour la projection. Défaut : fériés français de l'année. */
  isJourFerie?: (month: number, day: number) => boolean;
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Sommes à prévoir pour l'année, « à date » (réalisé) et « fin d'année » (projeté) :
 * - URSSAF et contributions : net multi-activité mois par mois (ACRE sur l'URSSAF réelle) ;
 * - impôt : VL exact, ou barème avec parts sur le revenu imposable de l'année
 *   projetée ; « à date » = cet IR annuel au prorata du revenu imposable réalisé ;
 * - TVA collectée : factures soumises de l'année (à date : émises au plus tard
 *   à la date de référence) ;
 * - régularisation VL (`calcVLRegularization`) si le VL est actif et que le RFR
 *   le rend inéligible (motif `rfr-too-high` ; un RFR inconnu ne déclenche rien).
 */
export function calcProvisions(
  months: CalendarMonth[],
  profile: UserProfile,
  opts: ProvisionsOptions,
): Provisions {
  const { year } = opts;
  const referenceDate = opts.referenceDate ?? new Date();
  const progress = getYearProgress(year, referenceDate);
  const realized = monthsThroughDate(months, progress.currentMonthIndex, progress.todayDate);
  const projected = projectMonths(months, profile, {
    year,
    currentMonthIndex: progress.currentMonthIndex,
    isJourFerie: opts.isJourFerie,
    today: referenceDate,
  });

  const vlEligibility = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, year);
  const vlRegularizationNeeded = profile.versementLiberatoire && vlEligibility.motif === 'rfr-too-high';
  const parts = normalizeParts(profile.partsFiscales);

  const scope = (scopeMonths: CalendarMonth[]) => {
    const breakdowns = scopeMonths.map((m) => calcCalendarMonthBreakdown(m, profile, year, { chargesFixes: 0 }));
    const sum = (key: 'ca' | 'urssaf' | 'acreReduction' | 'cfp' | 'taxeConsulaire' | 'ij' | 'revenuImposable') =>
      breakdowns.reduce((s, b) => s + b[key], 0);
    const vl = breakdowns.reduce((s, b) => s + b.byActivity.reduce((t, x) => t + x.vl, 0), 0);
    let regularisationVL = 0;
    if (vlRegularizationNeeded) {
      const selected = profile.vlRegularizationMonths
        ?? scopeMonths.filter((m) => monthHasRevenueForModel(m, profile.revenueModel)).map((m) => m.month);
      regularisationVL = calcVLRegularization(scopeMonths, profile, selected).amountToProvision;
    }
    return {
      caHT: sum('ca'),
      urssaf: sum('urssaf'),
      acreReduction: sum('acreReduction'),
      cfp: sum('cfp'),
      taxeConsulaire: sum('taxeConsulaire'),
      ij: sum('ij'),
      revenuImposable: sum('revenuImposable'),
      vl,
      regularisationVL,
    };
  };

  const fin = scope(projected);
  const done = scope(realized);
  const irAnnuel = calcIR(fin.revenuImposable, parts);
  const impotMode: 'bareme' | 'vl' = profile.versementLiberatoire ? 'vl' : 'bareme';

  const projectedInvoices = buildPaymentProjections(projected, profile)
    .filter((p) => p.invoiceDate.getFullYear() === year);
  const limit = endOfDay(referenceDate);
  const issuedInvoices = buildPaymentProjections(months, profile)
    .filter((p) => p.invoiceDate.getFullYear() === year && p.invoiceDate <= limit);
  const tva = (list: typeof projectedInvoices) => list.reduce((s, p) => s + p.taxAmount, 0);

  const amounts = (s: ReturnType<typeof scope>, impot: number, tvaCollectee: number): ProvisionAmounts => {
    const urssafEtContributions = s.urssaf + s.cfp + s.taxeConsulaire + s.ij;
    return {
      caHT: s.caHT,
      urssaf: s.urssaf,
      acreReduction: s.acreReduction,
      cfp: s.cfp,
      taxeConsulaire: s.taxeConsulaire,
      ij: s.ij,
      urssafEtContributions,
      impot,
      impotMode,
      tvaCollectee,
      regularisationVL: s.regularisationVL,
      total: urssafEtContributions + impot + tvaCollectee + s.regularisationVL,
    };
  };

  const impotFin = impotMode === 'vl' ? fin.vl : irAnnuel;
  const impotADate = impotMode === 'vl'
    ? done.vl
    : fin.revenuImposable > 0 ? irAnnuel * (done.revenuImposable / fin.revenuImposable) : 0;

  return {
    aDate: amounts(done, impotADate, tva(issuedInvoices)),
    finAnnee: amounts(fin, impotFin, tva(projectedInvoices)),
    vlEligibility,
    vlRegularizationNeeded,
    referenceDate,
  };
}
