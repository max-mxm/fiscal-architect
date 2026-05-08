export type Activity = 'vente' | 'serviceBic' | 'liberalSsi' | 'liberalCipav';

/** Mode de saisie du chiffre d'affaires par défaut au niveau du profil. */
export type RevenueModel = 'days' | 'forfait' | 'flat' | 'mixed';

/**
 * Une déclaration d'activité au sein du profil. Le micro-entrepreneur peut en
 * cumuler plusieurs (ex. dev BNC + vente de templates) — chaque entry de revenu
 * pointe alors vers son `activityId`.
 */
export interface ActivityEntry {
  id: string;
  type: Activity;
  /** Libellé libre (ex. "Conseil dev", "Vente templates"). */
  label?: string;
  /** L'activité par défaut pour les revenue entries sans activityId. Une seule par profil. */
  isPrimary: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  activity: Activity;
  tjm: number;
  workingDays: number;
  urssafRate: number;
  fixedCosts: { id: string; name: string; description: string; amount: number; icon: string; color: string }[];
  seuilMicro: number;
  versementLiberatoire: boolean;
  // Champs optionnels — peuvent être absents sur les profils localStorage antérieurs.
  /** Date de création de l'activité (ISO 'YYYY-MM-DD'). Utilisée pour ACRE et exonérations. */
  creationDate?: string;
  /** ACRE activée : réduction d'URSSAF pendant 12 mois après création. */
  acreEnabled?: boolean;
  /** TVA assujettie : l'utilisateur facture la TVA (sortie du régime franchise en base). */
  tvaAssujetti?: boolean;
  /** CFP (Contribution Formation Pro) prise en compte dans les charges. Activé par défaut. */
  cfpEnabled?: boolean;
  /** Taxe pour frais de chambre consulaire (CCI/CMA). Activée par défaut selon activité. */
  taxeConsulaireEnabled?: boolean;
  /** Mode de saisie du CA. Défaut: 'days' (TJM × jours travaillés). */
  revenueModel?: RevenueModel;
  /**
   * Liste d'activités déclarées. Optionnel pour rétro-compat — si absent,
   * dérivé au montage à partir de `activity` (1 seule activité primaire).
   */
  activities?: ActivityEntry[];
  /**
   * Revenu Fiscal de Référence N-2 du foyer (€). Sert à vérifier l'éligibilité
   * au versement libératoire. Plafond ≈ 27 478 € / part fiscale (2026).
   */
  rfrN2?: number;
  /**
   * Nombre de parts fiscales du foyer (défaut 1). Utilisé pour le calcul
   * d'éligibilité VL (RFR / parts < seuil).
   */
  partsFiscales?: number;
  /** Périodicité de déclaration URSSAF (info uniquement, ne change pas les calculs). */
  declarationPeriod?: 'monthly' | 'quarterly';
  /** Option indemnités journalières (libéraux non réglementés / CIPAV). +0,85 % du CA. */
  ijOption?: boolean;
  /**
   * Marque que l'utilisateur a vu/dépassé l'onboarding. Si false ou absent au
   * premier mount, on affiche le PersonaPicker.
   */
  onboardingDone?: boolean;
}

// --- Types enrichis (FOUND-03) ---

/**
 * Ligne de revenu d'un mois, polymorphe selon le mode de saisie.
 * - `days` : agrégation depuis le calendrier (jours pleins + demi × 0.5) × TJM
 * - `forfait` : prestation ponctuelle à montant fixe et date
 * - `flat` : montant unique « CA du mois » saisi directement
 */
export type RevenueEntry =
  | { kind: 'days'; id: string; days: number[]; halfDays?: number[]; tjmOverride?: number; activityId?: string }
  | { kind: 'forfait'; id: string; date: string; amount: number; label?: string; activityId?: string }
  | { kind: 'flat'; id: string; amount: number; label?: string; activityId?: string };

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  workedDays: number[]; // jours pleins (1-31)
  halfDays?: number[]; // demi-journées (1-31), optionnel pour rétro-compat localStorage
  /**
   * Lignes de revenu du mois (mode mixte). Optionnel pour rétro-compat — si absent,
   * on dérive virtuellement une ligne `days` depuis workedDays/halfDays.
   */
  entries?: RevenueEntry[];
}

export interface FiscalYear {
  year: number;
  months: CalendarMonth[];
}

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
