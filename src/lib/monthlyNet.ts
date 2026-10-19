import type { Activity, CalendarMonth, MonthlyBreakdown, UserProfile } from '~/types';
import {
  ACTIVITY_PARAMS,
  IJ_RATE_LIBERAL,
  calcACRE,
  calcCAByActivity,
  calcIJ,
  calcIR,
  calcNetCumuleMulti,
  calcTotalChargesFixes,
  getUrssafRateForActivity,
  monthHasRevenueForModel,
  normalizeParts,
  parseLocalISODate,
  type ACREResult,
} from '~/lib/fiscal';

/** Ordre canonique des types d'activité. */
export const ACTIVITY_TYPES: readonly Activity[] = ['vente', 'serviceBic', 'liberalSsi', 'liberalCipav'];

export type CAByActivity = Record<Activity, number>;

export function emptyCAByActivity(): CAByActivity {
  return { vente: 0, serviceBic: 0, liberalSsi: 0, liberalCipav: 0 };
}

/** Complète une ventilation partielle (activités absentes → 0, valeurs négatives → 0). */
export function toCAByActivity(partial: Partial<Record<Activity, number>>): CAByActivity {
  const out = emptyCAByActivity();
  for (const a of ACTIVITY_TYPES) out[a] = Math.max(0, partial[a] ?? 0);
  return out;
}

function isLiberal(activity: Activity): boolean {
  return activity === 'liberalSsi' || activity === 'liberalCipav';
}

// --- ACRE sur l'URSSAF réelle ---

/**
 * Réduction ACRE d'un mois, calculée sur l'URSSAF **brute réelle** de ce mois.
 * Règles existantes (`calcACRE`) : 50 % si création avant le 01/05/2024, 25 %
 * sinon, pendant 12 mois. Le mois est évalué au 15 (un mois est couvert si son
 * 15 tombe dans la fenêtre [création, création + 12 mois[), ce qui couvre
 * exactement 12 mois civils.
 */
export function calcAcreForMonth(
  urssafBrut: number,
  creationDate: string | Date | null | undefined,
  year: number,
  monthIndex: number,
  acreEnabled: boolean,
): ACREResult {
  const creation = creationDate instanceof Date
    ? creationDate
    : creationDate
      ? parseLocalISODate(creationDate)
      : null;
  return calcACRE(Math.max(0, urssafBrut), creation, new Date(year, monthIndex, 15, 12), acreEnabled);
}

/** URSSAF brute (avant ACRE) d'une ventilation de CA, au taux de chaque activité. */
export function calcUrssafBrut(caByActivity: Partial<Record<Activity, number>>, profile: UserProfile): number {
  const ca = toCAByActivity(caByActivity);
  return ACTIVITY_TYPES.reduce(
    (sum, a) => sum + (ca[a] > 0 ? ca[a] * (getUrssafRateForActivity(profile, a) / 100) : 0),
    0,
  );
}

export interface AcreMonth extends ACREResult {
  month: number;
  urssafBrut: number;
}

/**
 * Réduction ACRE mois par mois à partir du CA réel de chaque mois (URSSAF
 * brute réelle × taux ACRE applicable ce mois-là). L'ordre des mois fournis est
 * conservé.
 */
export function calcAcreByMonth(
  months: CalendarMonth[],
  profile: UserProfile,
  year: number = profile.year,
): AcreMonth[] {
  return months.map((m) => {
    const urssafBrut = calcUrssafBrut(calcCAByActivity([m], profile), profile);
    const acre = calcAcreForMonth(urssafBrut, profile.creationDate, year, m.month, profile.acreEnabled);
    return { month: m.month, urssafBrut, ...acre };
  });
}

/** Somme des réductions ACRE mois par mois. */
export function calcAcreTotal(months: CalendarMonth[], profile: UserProfile, year: number = profile.year): number {
  return calcAcreByMonth(months, profile, year).reduce((sum, r) => sum + r.reduction, 0);
}

// --- Net mensuel multi-activité ---

export interface ActivityMonthlyBreakdown {
  activity: Activity;
  ca: number;
  /** Taux URSSAF appliqué (en %). */
  urssafRate: number;
  urssafBrut: number;
  acreReduction: number;
  /** URSSAF due, nette d'ACRE. */
  urssaf: number;
  cfp: number;
  taxeConsulaire: number;
  ij: number;
  /** Base imposable du mois au barème : CA × (1 − abattement). */
  revenuImposable: number;
  /** Versement libératoire du mois (0 si VL inactif). */
  vl: number;
}

export interface MonthlyBreakdownMulti extends MonthlyBreakdown {
  /** Cotisation indemnités journalières (libéraux, si `ijOption`). */
  ij: number;
  /** URSSAF avant ACRE. */
  urssafBrut: number;
  /** Taux ACRE appliqué ce mois (0, 0,25 ou 0,5). */
  acreRate: number;
  /** Base imposable du mois au barème (somme des activités). */
  revenuImposable: number;
  /** Prélèvements sociaux du mois : URSSAF nette + CFP + taxe consulaire + IJ. */
  contributions: number;
  /** Mode d'imposition utilisé pour `ir`. */
  irMode: 'bareme' | 'vl';
  /** Détail des activités ayant du CA ce mois-ci. */
  byActivity: ActivityMonthlyBreakdown[];
}

export interface MonthlyBreakdownMultiOptions {
  /** Année du mois (défaut : `profile.year`). */
  year?: number;
  /** Mois 0..11 : nécessaire pour le calcul automatique de l'ACRE. */
  month?: number;
  /** Réduction ACRE imposée (prioritaire sur le calcul automatique, bornée par l'URSSAF brute). */
  acreReduction?: number;
  /** Charges fixes du mois (défaut : somme de `profile.fixedCosts`). */
  chargesFixes?: number;
}

/**
 * Net d'un mois pour un CA ventilé par activité :
 * - URSSAF par activité (taux du profil pour la primaire, taux légal de
 *   l'année pour les autres), ACRE calculée sur l'URSSAF brute réelle du mois ;
 * - CFP et taxe consulaire si activées, IJ libérales si `ijOption` ;
 * - IR : barème sur le revenu imposable annualisé (×12, quotient familial avec
 *   `profile.partsFiscales`, puis ÷12) ou VL par activité ;
 * - charges fixes mensuelles.
 */
export function calcMonthlyBreakdownMulti(
  caByActivity: Partial<Record<Activity, number>>,
  profile: UserProfile,
  opts: MonthlyBreakdownMultiOptions = {},
): MonthlyBreakdownMulti {
  const ca = toCAByActivity(caByActivity);
  const year = opts.year ?? profile.year;
  const vl = profile.versementLiberatoire;
  const parts = normalizeParts(profile.partsFiscales);
  const chargesFixes = opts.chargesFixes ?? calcTotalChargesFixes(profile.fixedCosts);

  const active = ACTIVITY_TYPES.filter((a) => ca[a] > 0);
  const brutByActivity = active.map((a) => ca[a] * (getUrssafRateForActivity(profile, a) / 100));
  const urssafBrut = brutByActivity.reduce((s, v) => s + v, 0);

  let acreReduction = 0;
  let acreRate = 0;
  if (opts.acreReduction !== undefined) {
    acreReduction = Math.max(0, Math.min(opts.acreReduction, urssafBrut));
    acreRate = urssafBrut > 0 ? acreReduction / urssafBrut : 0;
  } else if (opts.month !== undefined) {
    const acre = calcAcreForMonth(urssafBrut, profile.creationDate, year, opts.month, profile.acreEnabled);
    acreReduction = acre.reduction;
    acreRate = acre.rate;
  }

  const byActivity: ActivityMonthlyBreakdown[] = active.map((a, i) => {
    const params = ACTIVITY_PARAMS[a];
    const brut = brutByActivity[i];
    const acre = urssafBrut > 0 ? acreReduction * (brut / urssafBrut) : 0;
    return {
      activity: a,
      ca: ca[a],
      urssafRate: getUrssafRateForActivity(profile, a),
      urssafBrut: brut,
      acreReduction: acre,
      urssaf: brut - acre,
      cfp: profile.cfpEnabled ? ca[a] * params.cfpRate : 0,
      taxeConsulaire: profile.taxeConsulaireEnabled ? ca[a] * params.taxeConsulaireRate : 0,
      ij: profile.ijOption && isLiberal(a) ? ca[a] * IJ_RATE_LIBERAL : 0,
      revenuImposable: ca[a] * (1 - params.abattement),
      vl: vl ? ca[a] * params.tauxVL : 0,
    };
  });

  const sum = (key: keyof Omit<ActivityMonthlyBreakdown, 'activity'>) =>
    byActivity.reduce((s, b) => s + b[key], 0);
  const caTotal = sum('ca');
  const urssaf = sum('urssaf');
  const cfp = sum('cfp');
  const taxeConsulaire = sum('taxeConsulaire');
  const ij = sum('ij');
  const revenuImposable = sum('revenuImposable');
  const ir = vl ? sum('vl') : calcIR(revenuImposable * 12, parts) / 12;
  const contributions = urssaf + cfp + taxeConsulaire + ij;
  const net = caTotal - contributions - chargesFixes - ir;

  return {
    ca: caTotal,
    urssaf,
    ir,
    chargesFixes,
    net,
    tauxNet: caTotal > 0 ? net / caTotal : 0,
    cfp,
    taxeConsulaire,
    acreReduction,
    ij,
    urssafBrut,
    acreRate,
    revenuImposable,
    contributions,
    irMode: vl ? 'vl' : 'bareme',
    byActivity,
  };
}

/**
 * Raccourci : net multi-activité d'un mois du calendrier, à partir de ses
 * entries réelles (jours au TJM du mois, forfaits, montants mensuels), avec
 * l'ACRE calculée sur l'URSSAF réelle du mois.
 */
export function calcCalendarMonthBreakdown(
  month: CalendarMonth,
  profile: UserProfile,
  year: number = month.year,
  opts: Omit<MonthlyBreakdownMultiOptions, 'year' | 'month'> = {},
): MonthlyBreakdownMulti {
  return calcMonthlyBreakdownMulti(calcCAByActivity([month], profile), profile, {
    ...opts,
    year,
    month: month.month,
  });
}

// --- Net cumulé ---

/**
 * Net cumulé à partir des mois réels : CA ventilé par activité, charges fixes
 * des mois avec revenu, ACRE **sommée mois par mois** sur l'URSSAF réelle, IJ,
 * et IR (parts du profil) provisionné au rythme annualisé (cf.
 * `calcNetCumuleMulti`).
 */
export function calcNetCumuleFromMonths(
  months: CalendarMonth[],
  profile: UserProfile,
  year: number = profile.year,
): number {
  const caByActivity = calcCAByActivity(months, profile);
  const monthsWithActivity = months.filter((m) => monthHasRevenueForModel(m, profile.revenueModel)).length;
  return calcNetCumuleMulti(
    profile,
    caByActivity,
    calcTotalChargesFixes(profile.fixedCosts),
    monthsWithActivity,
    profile.versementLiberatoire,
    {
      acreReduction: calcAcreTotal(months, profile, year),
      ijAnnuel: calcIJ(caByActivity, profile.ijOption),
    },
  );
}

/**
 * IR à provisionner pour un CA cumulé sur `activeMonths` mois (même règle que
 * `calcNetCumuleMulti`) : au barème, l'IR annuel du rythme moyen annualisé
 * (quotient familial avec `profile.partsFiscales`) × `activeMonths / 12` ; en
 * VL, le VL exact du CA.
 */
export function calcIRProvisionToDate(
  caByActivity: Partial<Record<Activity, number>>,
  activeMonths: number,
  profile: UserProfile,
): number {
  const ca = toCAByActivity(caByActivity);
  const months = Math.max(0, Math.min(12, activeMonths));
  if (profile.versementLiberatoire) {
    return ACTIVITY_TYPES.reduce((s, a) => s + ca[a] * ACTIVITY_PARAMS[a].tauxVL, 0);
  }
  if (months === 0) return 0;
  const annualizedRI = ACTIVITY_TYPES.reduce(
    (s, a) => s + ca[a] * (12 / months) * (1 - ACTIVITY_PARAMS[a].abattement),
    0,
  );
  return calcIR(annualizedRI, normalizeParts(profile.partsFiscales)) * (months / 12);
}
