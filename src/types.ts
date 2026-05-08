export type Activity = 'vente' | 'serviceBic' | 'liberalSsi' | 'liberalCipav';

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
}

// --- Types enrichis (FOUND-03) ---

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  workedDays: number[]; // jours pleins (1-31)
  halfDays?: number[]; // demi-journées (1-31), optionnel pour rétro-compat localStorage
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
