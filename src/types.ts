export type Activity = 'vente' | 'serviceBic' | 'liberalSsi' | 'liberalCipav';

/** Mode de saisie du chiffre d'affaires par défaut au niveau de l'année. */
export type RevenueModel = 'days' | 'forfait' | 'flat' | 'mixed';

/**
 * Une déclaration d'activité dans la config annuelle. Le micro-entrepreneur peut
 * en cumuler plusieurs (ex. dev BNC + vente de templates) — chaque entry de revenu
 * pointe alors vers son `activityId`.
 */
export interface ActivityEntry {
  id: string;
  type: Activity;
  /** Libellé libre (ex. "Conseil dev", "Vente templates"). */
  label?: string;
  /** L'activité par défaut pour les revenue entries sans activityId. Une seule par année. */
  isPrimary: boolean;
}

export interface FixedCost {
  id: string;
  name: string;
  description: string;
  amount: number;
  icon: string;
  color: string;
}

/**
 * Profil d'identité — stable, ne change quasiment jamais. Stocké dans la clé
 * `fiscal-profile` (un seul, global). Tout ce qui est temporel (TJM, taux URSSAF,
 * options déclaratives, charges fixes…) vit dans `YearConfig`.
 */
export interface IdentityProfile {
  schemaVersion: 1;
  name: string;
  role: string;
  /** Date de création de l'activité (ISO 'YYYY-MM-DD'). Utilisée pour ACRE. */
  creationDate: string;
  /** Nombre de parts fiscales du foyer. Évolue rarement. */
  partsFiscales: number;
  /** Périodicité de déclaration URSSAF (info uniquement). */
  declarationPeriod: 'monthly' | 'quarterly';
  /** Marque que l'utilisateur a passé l'onboarding. */
  onboardingDone: boolean;
}

/**
 * Configuration fiscale applicable à UNE année. Tout ce qui peut varier d'une
 * année à l'autre vit ici : paramètres légaux (loi), paramètres perso (TJM,
 * jours, charges fixes), options déclaratives (ACRE, VL, IJ, TVA).
 *
 * Stocké dans la clé `fiscal-year-config-${year}`.
 */
export interface YearConfig {
  schemaVersion: 1;
  year: number;

  // Paramètres légaux (fixés par la loi pour cette année)
  urssafRate: number;
  seuilMicro: number;

  // Paramètres perso fiscaux
  tjm: number;
  workingDays: number;
  revenueModel: RevenueModel;
  activities: ActivityEntry[];
  fixedCosts: FixedCost[];

  // Options déclaratives (potentiellement annuelles)
  versementLiberatoire: boolean;
  acreEnabled: boolean;
  tvaAssujetti: boolean;
  cfpEnabled: boolean;
  taxeConsulaireEnabled: boolean;
  ijOption: boolean;
  /** Revenu Fiscal Référence N-2 du foyer (€) — éligibilité VL. null si non saisi. */
  rfrN2: number | null;
  /** Date de démarrage effective de l'activité dans l'année (ISO). */
  missionStart: string;
}

/** Index des années connues + année active dans l'UI. */
export interface YearsIndex {
  schemaVersion: 1;
  years: number[];
  activeYear: number;
}

/**
 * Vue unifiée pour les composants : projection à plat de `IdentityProfile` +
 * `YearConfig` de l'année active. Stocké en deux clés séparées (cf. types
 * ci-dessus), mais exposé fusionné aux composants via `useProfile()`.
 *
 * Les setters savent router vers la bonne clé selon les champs modifiés.
 */
export type UserProfile = Omit<IdentityProfile, 'schemaVersion'> & Omit<YearConfig, 'schemaVersion'>;

/** Liste des clés du `UserProfile` qui appartiennent à l'identité (stables). */
export const IDENTITY_KEYS: ReadonlyArray<keyof UserProfile> = [
  'name',
  'role',
  'creationDate',
  'partsFiscales',
  'declarationPeriod',
  'onboardingDone',
] as const;

// --- Calendrier ---

/**
 * Ligne de revenu d'un mois, polymorphe selon le mode de saisie.
 * - `days` : agrégation depuis le calendrier (jours pleins + demi × 0.5) × TJM
 * - `forfait` : prestation ponctuelle à montant fixe et date
 * - `flat` : montant unique « CA du mois » saisi directement
 */
export type RevenueEntry =
  | { kind: 'days'; id: string; days: number[]; halfDays: number[]; tjmOverride?: number; activityId?: string }
  | { kind: 'forfait'; id: string; date: string; amount: number; label?: string; activityId?: string }
  | { kind: 'flat'; id: string; amount: number; label?: string; activityId?: string };

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  workedDays: number[]; // jours pleins (1-31)
  halfDays: number[]; // demi-journées (1-31)
  entries: RevenueEntry[];
}

export interface FiscalYear {
  schemaVersion: 1;
  year: number;
  months: CalendarMonth[];
}

// --- Résultats fiscaux ---

export type TVAStatus = 'safe' | 'warning' | 'breach';

export interface FiscalResult {
  caAnnuel: number;
  chargesURSSAF: number;
  chargesFixes: number;
  revenuImposable: number;
  ir: number;
  netApresIR: number;
  cfpAnnuel: number;
  taxeConsulaireAnnuelle: number;
  acreReductionAnnuelle: number;
  tvaStatus: TVAStatus;
  tvaSeuilDate: Date | null;
}

export interface MonthlyBreakdown {
  ca: number;
  urssaf: number;
  ir: number;
  chargesFixes: number;
  net: number;
  tauxNet: number;
  cfp: number;
  taxeConsulaire: number;
  /** Montant déduit de l'URSSAF par l'ACRE ce mois-ci (positif). */
  acreReduction: number;
}

export interface MonthlyChartData {
  month: string;
  brut: number;
  net: number;
}

// --- Notifications (centre de notifs) ---

export type NotificationLevel = 'info' | 'warning' | 'critical';

/** Identifiants stables. Changer d'ID = nouvelle notification (pas de propagation du dismiss). */
export type NotificationKind =
  | 'compte-pro'
  | 'seuil-micro-projected'
  | 'seuil-micro-breach';

export interface Notification {
  id: NotificationKind;
  level: NotificationLevel;
  title: string;
  body: string;
  icon: 'compte-pro' | 'seuil';
}
