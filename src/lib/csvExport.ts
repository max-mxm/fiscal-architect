import type { CalendarMonth, UserProfile } from '~/types';
import { MONTH_NAMES } from '~/lib/calendar';
import {
  calcCAByActivity,
  calcCAFromEntries,
  calcInvoiceTotals,
  calcTotalChargesFixes,
  effectiveEntriesForModel,
  isTVAApplicableOn,
  monthHasRevenueForModel,
} from '~/lib/fiscal';
import { calcCalendarMonthBreakdown, calcIRProvisionToDate } from '~/lib/monthlyNet';

export interface AnnualRow {
  /** Mois 0..11, `null` pour la ligne Total. */
  month: number | null;
  label: string;
  joursTravailles: number;
  caHT: number;
  tvaCollectee: number;
  factureTTC: number;
  /** URSSAF nette d'ACRE + CFP + taxe consulaire + IJ. */
  contributions: number;
  impot: number;
  chargesFixes: number;
  net: number;
}

export interface AnnualRows {
  rows: AnnualRow[];
  total: AnnualRow;
}

function normalizeMonths(months: CalendarMonth[], year: number): CalendarMonth[] {
  return Array.from({ length: 12 }, (_, i) =>
    months.find((m) => m.month === i)
      ?? { month: i, year, workedDays: [], halfDays: [], entries: [] });
}

/**
 * Tableau annuel à partir de la saisie réelle (jours au TJM du mois, forfaits,
 * montants mensuels), sans extrapolation :
 * - TVA par facture mensuelle (émise le dernier jour du mois), selon la date d'effet ;
 * - contributions : net multi-activité du mois (URSSAF par activité, ACRE sur
 *   l'URSSAF réelle du mois, CFP, taxe consulaire, IJ) ;
 * - impôt : en VL, le VL exact du mois ; au barème, l'IR provisionné de l'année
 *   (rythme moyen annualisé, parts fiscales — cf. `calcNetCumuleMulti`) réparti
 *   au prorata du revenu imposable de chaque mois ;
 * - charges fixes : seulement les mois avec revenu.
 * La ligne Total somme les colonnes ; son net correspond au net cumulé.
 */
export function buildAnnualRows(months: CalendarMonth[], profile: UserProfile, year: number): AnnualRows {
  const all = normalizeMonths(months, year);
  const fixed = calcTotalChargesFixes(profile.fixedCosts);
  const activeMonths = all.filter((m) => monthHasRevenueForModel(m, profile.revenueModel)).length;
  const irProvision = calcIRProvisionToDate(calcCAByActivity(all, profile), activeMonths, profile);

  const prepared = all.map((m) => {
    const hasRevenue = monthHasRevenueForModel(m, profile.revenueModel);
    const breakdown = calcCalendarMonthBreakdown(m, profile, year, { chargesFixes: hasRevenue ? fixed : 0 });
    return { m, breakdown };
  });
  const totalRI = prepared.reduce((s, p) => s + p.breakdown.revenuImposable, 0);

  const rows: AnnualRow[] = prepared.map(({ m, breakdown }) => {
    const caHT = calcCAFromEntries(m, profile);
    const jours = effectiveEntriesForModel(m, profile.revenueModel).reduce(
      (s, e) => (e.kind === 'days' ? s + e.days.length + (e.halfDays?.length ?? 0) * 0.5 : s),
      0,
    );
    const invoice = calcInvoiceTotals(caHT, isTVAApplicableOn(profile, new Date(year, m.month + 1, 0, 12)), profile.tvaRate);
    const impot = profile.versementLiberatoire
      ? breakdown.ir
      : totalRI > 0 ? irProvision * (breakdown.revenuImposable / totalRI) : 0;
    const contributions = breakdown.contributions;
    return {
      month: m.month,
      label: MONTH_NAMES[m.month],
      joursTravailles: jours,
      caHT: invoice.ht,
      tvaCollectee: invoice.tva,
      factureTTC: invoice.ttc,
      contributions,
      impot,
      chargesFixes: breakdown.chargesFixes,
      net: invoice.ht - contributions - impot - breakdown.chargesFixes,
    };
  });

  const sum = (key: keyof Omit<AnnualRow, 'month' | 'label'>) => rows.reduce((s, r) => s + r[key], 0);
  const total: AnnualRow = {
    month: null,
    label: 'Total',
    joursTravailles: sum('joursTravailles'),
    caHT: sum('caHT'),
    tvaCollectee: sum('tvaCollectee'),
    factureTTC: sum('factureTTC'),
    contributions: sum('contributions'),
    impot: sum('impot'),
    chargesFixes: sum('chargesFixes'),
    net: sum('net'),
  };
  return { rows, total };
}

/**
 * Nombre au format français pour CSV : virgule décimale, sans séparateur de
 * milliers (lisible par les tableurs). Montants à 2 décimales, jours à 1
 * décimale au plus.
 */
export function formatCsvNumber(value: number, kind: 'amount' | 'days' = 'amount'): string {
  const decimals = kind === 'amount' ? 2 : 1;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  if (rounded === 0) return kind === 'amount' ? '0,00' : '0';
  const text = kind === 'days' && Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
  return text.replace('.', ',');
}

/** Champ texte CSV : neutralise les formules et met entre guillemets si nécessaire. */
function csvText(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const CSV_HEADER = [
  'Mois',
  'Jours travaillés',
  'CA HT',
  'TVA collectée',
  'Facturé TTC',
  'URSSAF et contributions',
  'Impôt estimé',
  'Charges fixes',
  'Net',
];

function rowToCsv(r: AnnualRow): string {
  return [
    csvText(r.label),
    formatCsvNumber(r.joursTravailles, 'days'),
    formatCsvNumber(r.caHT),
    formatCsvNumber(r.tvaCollectee),
    formatCsvNumber(r.factureTTC),
    formatCsvNumber(r.contributions),
    formatCsvNumber(r.impot),
    formatCsvNumber(r.chargesFixes),
    formatCsvNumber(r.net),
  ].join(';');
}

function summaryLines(profile: UserProfile, year: number): string[] {
  const tvaRate = `${formatCsvNumber(profile.tvaRate * 100, 'days')} %`;
  const pairs: [string, string][] = [
    ['Profil', csvText(profile.name)],
    ['Année', String(year)],
    ['TJM HT', formatCsvNumber(profile.tjm)],
    ['Taux TVA', profile.tvaAssujetti ? tvaRate : 'Franchise en base'],
    ['TVA à partir de', profile.tvaAssujetti ? profile.tvaEffectiveDate ?? 'Dès le début de l’année' : 'Non applicable'],
    ['Jours/mois', formatCsvNumber(profile.workingDays, 'days')],
    ['Taux URSSAF', `${formatCsvNumber(profile.urssafRate, 'days')} %`],
    ['Parts fiscales', formatCsvNumber(profile.partsFiscales, 'days')],
    ['Charges fixes mensuelles', formatCsvNumber(calcTotalChargesFixes(profile.fixedCosts))],
    ['Impôt', profile.versementLiberatoire ? 'Versement libératoire' : 'Barème progressif'],
  ];
  return pairs.map(([k, v]) => `${csvText(k)};${v}`);
}

/**
 * Export CSV annuel (séparateur `;`, nombres au format français) : en-tête,
 * 12 mois, ligne Total, puis, avec `includeSummary`, les paramètres du profil.
 * Fonction pure : le téléchargement (et l'éventuel BOM UTF-8) est à la charge
 * de l'appelant.
 */
export function buildAnnualCsv(
  months: CalendarMonth[],
  profile: UserProfile,
  year: number,
  options: { includeSummary?: boolean } = {},
): string {
  const { rows, total } = buildAnnualRows(months, profile, year);
  const lines = [CSV_HEADER.join(';'), ...rows.map(rowToCsv), rowToCsv(total)];
  if (options.includeSummary) lines.push('', ...summaryLines(profile, year));
  return lines.join('\n');
}
