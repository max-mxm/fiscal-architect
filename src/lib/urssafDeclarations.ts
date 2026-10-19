import type { Activity, UserProfile } from '~/types';
import { MONTH_NAMES } from '~/lib/calendar';
import { getPrimaryActivity } from '~/lib/fiscal';
import type { PaymentProjection } from '~/lib/cashflow';
import { ACTIVITY_TYPES, calcMonthlyBreakdownMulti, emptyCAByActivity, type CAByActivity } from '~/lib/monthlyNet';

/**
 * - `past` : la date limite de déclaration est dépassée ;
 * - `current` : la période est close et la déclaration est à faire (échéance à venir) ;
 * - `upcoming` : la période n'est pas terminée.
 */
export type DeclarationStatus = 'past' | 'current' | 'upcoming';

export interface UrssafDeclaration {
  periodicity: 'monthly' | 'quarterly';
  /** Mois (0..11) ou trimestre (0..3). */
  index: number;
  /** « Janvier 2026 » ou « T1 2026 ». */
  label: string;
  periodStart: Date;
  periodEnd: Date;
  /** Date limite de déclaration et de paiement. */
  dueDate: Date;
  /** CA HT encaissé dans la période (date d'encaissement des factures). */
  caEncaisse: number;
  caByActivity: CAByActivity;
  urssafBrut: number;
  acreReduction: number;
  /** URSSAF nette d'ACRE. */
  urssaf: number;
  cfp: number;
  taxeConsulaire: number;
  ij: number;
  /** Versement libératoire (0 si inactif). */
  vl: number;
  /** Cotisations estimées : URSSAF nette + CFP + taxe consulaire + IJ + VL. */
  total: number;
  status: DeclarationStatus;
}

function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
}

/**
 * Déclarations URSSAF de l'année : le micro-entrepreneur déclare le CA
 * **encaissé** sur la période (mensuelle ou trimestrielle selon
 * `profile.declarationPeriod`). Le CA de chaque période est la somme des
 * projections dont la date d'encaissement (`dueDate`) tombe dans la période ;
 * les encaissements d'une autre année sont ignorés.
 *
 * Cotisations estimées mois d'encaissement par mois d'encaissement : URSSAF par
 * activité moins l'ACRE du mois, CFP et taxe consulaire si activées, IJ si
 * `ijOption`, VL si actif. Date limite : dernier jour du mois suivant la
 * période (31/01 N+1 pour décembre / T4). Approximation : la première
 * déclaration d'une création (période allongée) n'est pas modélisée.
 */
export function buildUrssafDeclarations(
  paymentProjections: PaymentProjection[],
  profile: UserProfile,
  year: number,
  referenceDate: Date = new Date(),
): UrssafDeclaration[] {
  const primary: Activity = getPrimaryActivity(profile)?.type ?? 'liberalSsi';
  const caByMonth: CAByActivity[] = Array.from({ length: 12 }, emptyCAByActivity);
  for (const p of paymentProjections) {
    if (p.dueDate.getFullYear() !== year) continue;
    const target = caByMonth[p.dueDate.getMonth()];
    const split = p.amountByActivity ?? { ...emptyCAByActivity(), [primary]: p.amount };
    for (const a of ACTIVITY_TYPES) target[a] += split[a] ?? 0;
  }

  const monthly = caByMonth.map((ca, month) => {
    const b = calcMonthlyBreakdownMulti(ca, profile, { year, month, chargesFixes: 0 });
    return {
      ca,
      urssafBrut: b.urssafBrut,
      acreReduction: b.acreReduction,
      urssaf: b.urssaf,
      cfp: b.cfp,
      taxeConsulaire: b.taxeConsulaire,
      ij: b.ij,
      vl: b.byActivity.reduce((s, x) => s + x.vl, 0),
    };
  });

  const quarterly = profile.declarationPeriod === 'quarterly';
  const size = quarterly ? 3 : 1;
  const ref = dayNumber(referenceDate);
  const out: UrssafDeclaration[] = [];
  for (let index = 0; index < 12 / size; index++) {
    const first = index * size;
    const last = first + size - 1;
    const slice = monthly.slice(first, last + 1);
    const caByActivity = emptyCAByActivity();
    for (const m of slice) for (const a of ACTIVITY_TYPES) caByActivity[a] += m.ca[a];
    const sum = (key: 'urssafBrut' | 'acreReduction' | 'urssaf' | 'cfp' | 'taxeConsulaire' | 'ij' | 'vl') =>
      slice.reduce((s, m) => s + m[key], 0);
    const periodStart = new Date(year, first, 1, 12);
    const periodEnd = new Date(year, last + 1, 0, 12);
    const dueDate = new Date(year, last + 2, 0, 12);
    const urssaf = sum('urssaf');
    const cfp = sum('cfp');
    const taxeConsulaire = sum('taxeConsulaire');
    const ij = sum('ij');
    const vl = sum('vl');
    const status: DeclarationStatus = ref > dayNumber(dueDate)
      ? 'past'
      : ref > dayNumber(periodEnd) ? 'current' : 'upcoming';
    out.push({
      periodicity: quarterly ? 'quarterly' : 'monthly',
      index,
      label: quarterly ? `T${index + 1} ${year}` : `${MONTH_NAMES[first]} ${year}`,
      periodStart,
      periodEnd,
      dueDate,
      caEncaisse: ACTIVITY_TYPES.reduce((s, a) => s + caByActivity[a], 0),
      caByActivity,
      urssafBrut: sum('urssafBrut'),
      acreReduction: sum('acreReduction'),
      urssaf,
      cfp,
      taxeConsulaire,
      ij,
      vl,
      total: urssaf + cfp + taxeConsulaire + ij + vl,
      status,
    });
  }
  return out;
}
