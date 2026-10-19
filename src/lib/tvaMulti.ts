import type { Activity, TVAStatus, UserProfile } from '~/types';
import { TVA_FRANCHISE_2026, activityCategory } from '~/lib/fiscal';
import type { PaymentProjection } from '~/lib/cashflow';

export interface TVASeuilPair {
  basique: number;
  majore: number;
}

export interface TVAThresholdDates {
  /** Facture qui fait dépasser un seuil basique (franchise perdue l'année suivante). */
  basique: Date | null;
  /** Facture qui fait dépasser un seuil majoré (TVA due dès ce dépassement). */
  majore: Date | null;
}

export interface TVAStatusMulti {
  status: TVAStatus;
  /** Catégorie dont le seuil est franchi ou, à défaut, la plus proche de l'être. */
  category: 'vente' | 'services';
  /** Seuils de cette catégorie. */
  seuil: TVASeuilPair;
  /** CA comparé à ce seuil : CA total pour la vente, CA services pour les services. */
  ca: number;
  caTotal: number;
  caServices: number;
  /** Dates de franchissement (null sans projections, ou si non franchi). */
  seuilDates: TVAThresholdDates;
}

const STATUS_RANK: Record<TVAStatus, number> = { safe: 0, warning: 1, breach: 2 };

function statusFor(ca: number, seuil: TVASeuilPair): TVAStatus {
  if (ca > seuil.majore) return 'breach';
  if (ca > seuil.basique) return 'warning';
  return 'safe';
}

function servicesCA(caByActivity: Partial<Record<Activity, number>>): number {
  return (Object.keys(caByActivity) as Activity[])
    .filter((a) => activityCategory(a) === 'services')
    .reduce((s, a) => s + Math.max(0, caByActivity[a] ?? 0), 0);
}

function totalCA(caByActivity: Partial<Record<Activity, number>>): number {
  return (Object.keys(caByActivity) as Activity[]).reduce((s, a) => s + Math.max(0, caByActivity[a] ?? 0), 0);
}

/**
 * Règle de la franchise en base pour les activités mixtes (art. 293 B CGI) :
 * la franchise est conservée tant que le CA **total** reste sous le seuil
 * « vente » ET que la part **services** reste sous le seuil « services »
 * (basique puis majoré). La règle couvre aussi les cas mono-activité (services
 * seuls : le seuil services contraint ; vente seule : la part services est nulle).
 */
function evaluate(caTotal: number, caServices: number) {
  const vente = { status: statusFor(caTotal, TVA_FRANCHISE_2026.vente), ratio: caTotal / TVA_FRANCHISE_2026.vente.basique };
  const services = { status: statusFor(caServices, TVA_FRANCHISE_2026.services), ratio: caServices / TVA_FRANCHISE_2026.services.basique };
  return { vente, services };
}

/**
 * Dates de franchissement des seuils mixtes, en cumulant les factures (par date
 * d'émission) de l'année. Un projection sans ventilation par activité est
 * imputée à `primaryActivity` (défaut : services). Dépassement strict.
 */
export function calcTVAThresholdDatesMulti(
  projections: PaymentProjection[],
  options: { year?: number; primaryActivity?: Activity } = {},
): TVAThresholdDates {
  const fallback = options.primaryActivity ?? 'liberalSsi';
  const ordered = [...projections]
    .filter((p) => options.year === undefined || p.invoiceDate.getFullYear() === options.year)
    .sort((a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime());
  let cumulTotal = 0;
  let cumulServices = 0;
  const dates: TVAThresholdDates = { basique: null, majore: null };
  for (const p of ordered) {
    const byActivity = p.amountByActivity ?? { [fallback]: p.amount };
    cumulTotal += totalCA(byActivity);
    cumulServices += servicesCA(byActivity);
    const { vente, services } = evaluate(cumulTotal, cumulServices);
    const worst = Math.max(STATUS_RANK[vente.status], STATUS_RANK[services.status]);
    if (worst >= STATUS_RANK.warning && !dates.basique) dates.basique = p.invoiceDate;
    if (worst >= STATUS_RANK.breach && !dates.majore) {
      dates.majore = p.invoiceDate;
      break;
    }
  }
  return dates;
}

/**
 * Statut TVA multi-activité et seuil pertinent pour un CA ventilé par activité
 * (CA projeté de l'année en général). Avec `projections`, renseigne aussi les
 * dates de franchissement (`calcTVAThresholdDatesMulti`).
 */
export function calcTVAStatusMulti(
  caByActivity: Partial<Record<Activity, number>>,
  options: {
    profile?: Pick<UserProfile, 'activities'>;
    projections?: PaymentProjection[];
    year?: number;
  } = {},
): TVAStatusMulti {
  const caTotal = totalCA(caByActivity);
  const caServices = servicesCA(caByActivity);
  const { vente, services } = evaluate(caTotal, caServices);

  let category: 'vente' | 'services';
  if (STATUS_RANK[vente.status] !== STATUS_RANK[services.status]) {
    category = STATUS_RANK[vente.status] > STATUS_RANK[services.status] ? 'vente' : 'services';
  } else if (caTotal > 0) {
    category = services.ratio >= vente.ratio && caServices > 0 ? 'services' : 'vente';
  } else {
    const acts = options.profile?.activities ?? [];
    const hasServices = acts.length === 0 || acts.some((a) => activityCategory(a.type) === 'services');
    category = hasServices ? 'services' : 'vente';
  }

  const primary = options.profile?.activities?.find((a) => a.isPrimary) ?? options.profile?.activities?.[0];
  const seuilDates = options.projections
    ? calcTVAThresholdDatesMulti(options.projections, { year: options.year, primaryActivity: primary?.type })
    : { basique: null, majore: null };

  return {
    status: category === 'vente' ? vente.status : services.status,
    category,
    seuil: { ...TVA_FRANCHISE_2026[category] },
    ca: category === 'vente' ? caTotal : caServices,
    caTotal,
    caServices,
    seuilDates,
  };
}
