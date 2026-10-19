import type { Activity, ActivityEntry, TVAStatus } from '~/types';
import type { PaymentProjection, CashflowMonth } from '~/lib/cashflow';

/** Tout ce qu'affiche l'écran Mois pour le mois sélectionné. */
export interface MonthVM {
  index: number;
  name: string;
  /** Jours équivalents (pleins + demi × 0,5). */
  days: number;
  tjm: number;
  tjmCustom: boolean;
  defaultTjm: number;
  ca: number;
  tva: number;
  ttc: number;
  tvaApplies: boolean;
  /** Assujetti mais la TVA ne démarre qu'après ce mois : libellé du mois de départ. */
  tvaStartsLabel: string | null;
  urssaf: number;
  urssafRate: number;
  acre: number;
  acreRate: number;
  cfp: number;
  taxeConsulaire: number;
  ij: number;
  /** URSSAF − ACRE + CFP + taxe consulaire + IJ. */
  cotisations: number;
  impot: number;
  impotMode: 'vl' | 'bareme';
  vlRate: number;
  charges: number;
  net: number;
  /** Cotisations + impôt + TVA : ce qui n'est pas à vous sur l'encaissement. */
  aMettreDeCote: number;
  hasRevenue: boolean;
}

export interface YearMonthVM {
  index: number;
  short: string;
  name: string;
  ca: number;
  net: number;
  cotisations: number;
  impot: number;
  charges: number;
  days: number;
  hasData: boolean;
  /** Mois futur sans saisie, rempli au rythme nominal. */
  projected: boolean;
}

export type SeuilStatus = 'ok' | 'near' | 'projected' | 'crossed';

export interface YearVM {
  year: number;
  caSaisi: number;
  caRealise: number;
  caProjete: number;
  netCumule: number;
  netProjete: number;
  monthsWithActivity: number;
  seuilMicro: number;
  seuil: { status: SeuilStatus; date: Date | null; marge: number };
  tva: {
    assujetti: boolean;
    status: TVAStatus;
    seuil: number;
    seuilMajore: number;
    date: Date | null;
    realise: number;
    projete: number;
    effectiveDate: string | null;
    rate: number;
    invoice: { ht: number; tva: number; ttc: number };
  };
  months: YearMonthVM[];
  /** Cumul mensuel du CA : réalisé (null après aujourd'hui) et projeté. */
  cumul: Array<{ index: number; realise: number | null; projete: number }>;
  activities: ActivityEntry[];
  caByActivity: Record<Activity, number>;
  comptePro: { threshold: number; exceeded: boolean };
}

export interface DeclarationVM {
  key: string;
  label: string;
  due: Date;
  caEncaisse: number;
  cotisations: number;
  status: 'past' | 'current' | 'upcoming';
}

export interface TreasuryVM {
  hasData: boolean;
  termsLabel: string;
  taxed: boolean;
  projections: PaymentProjection[];
  timeline: CashflowMonth[];
  invoiced: number;
  invoicedHt: number;
  collectedToDate: number;
  toCollect: number;
  toCollectHt: number;
  collectedInYear: number;
  deferred: number;
  nextIndex: number;
  tvaTotal: number;
  tvaFrom: string | null;
  declarations: DeclarationVM[];
  provisions: {
    cotisations: { toDate: number; year: number };
    impot: { toDate: number; year: number; mode: 'vl' | 'bareme' };
    tva: { toDate: number; year: number };
    regularisationVL: number | null;
    /** RFR au-dessus du plafond mais VL inactif : vérifier un éventuel rattrapage. */
    vlCheck: boolean;
  };
}

/** Une échéance datée à voir venir (écran Mois). */
export interface UpcomingVM {
  key: string;
  date: Date;
  title: string;
  detail: string;
  amount?: number;
  /** Montant TTC : affiché dans la couleur de la TVA. */
  amountTtc?: boolean;
  tone: 'neutral' | 'warn' | 'alert';
  to?: '/tresorerie' | '/annee' | '/regularisation-vl';
}
