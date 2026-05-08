import type { Activity, UserProfile, FiscalResult, MonthlyBreakdown, MonthlyChartData, CalendarMonth, TVAStatus } from '~/types';

// --- Paramètres fiscaux par activité (2026) ---

export interface ActivityParams {
  label: string;
  hint: string;
  urssafRate: number;          // %
  abattement: number;          // 0..1, abattement IR au barème
  plafond: number;             // €, plafond annuel CA pour rester en micro
  tauxVL: number;              // 0..1, taux versement libératoire
  /** Taux CFP (Contribution Formation Pro), 0..1. Source : urssaf.fr. */
  cfpRate: number;
  /** Taux taxe consulaire (CCI/CMA), 0..1. Libéraux : exonérés. */
  taxeConsulaireRate: number;
}

export const ACTIVITY_PARAMS: Record<Activity, ActivityParams> = {
  vente:        { label: 'Vente / hébergement (BIC)',      hint: 'Marchandises, e-commerce, gîte',     urssafRate: 12.3, abattement: 0.71, plafond: 203_100, tauxVL: 0.010, cfpRate: 0.001, taxeConsulaireRate: 0.00015 },
  serviceBic:   { label: 'Services commerciaux / artisan', hint: 'Artisan, prestation BIC',            urssafRate: 21.2, abattement: 0.50, plafond:  83_600, tauxVL: 0.017, cfpRate: 0.003, taxeConsulaireRate: 0.00044 },
  liberalSsi:   { label: 'Libéral non réglementé (SSI)',   hint: 'BNC SSI : conseil, dev, design',     urssafRate: 26.1, abattement: 0.34, plafond:  83_600, tauxVL: 0.022, cfpRate: 0.002, taxeConsulaireRate: 0 },
  liberalCipav: { label: 'Libéral réglementé (CIPAV)',     hint: 'Architecte, ostéo, psy, etc.',       urssafRate: 23.2, abattement: 0.34, plafond:  83_600, tauxVL: 0.022, cfpRate: 0.002, taxeConsulaireRate: 0 },
};

// --- TVA — franchise en base (seuils 2026, inchangés depuis 2023) ---

export const TVA_FRANCHISE_2026 = {
  /** Vente de marchandises et hébergement. */
  vente:    { basique: 91_900, majore: 101_000 },
  /** Prestations de services et BNC (s'applique à serviceBic, liberalSsi, liberalCipav). */
  services: { basique: 36_800, majore:  39_100 },
} as const;

// --- ACRE — réduction d'URSSAF pendant 12 mois post-création ---

/** Date de bascule du taux ACRE : 50 % avant cette date, 25 % à partir. */
export const ACRE_TRANSITION_DATE = new Date('2024-05-01');
export const ACRE_RATE_BEFORE = 0.50;
export const ACRE_RATE_AFTER = 0.25;
export const ACRE_DURATION_MONTHS = 12;

// Alias rétro-compat (avant introduction de l'activité, l'app était figée sur BNC libéral SSI).
// Conservés pour ne pas casser les imports tiers et les tests historiques.
export const SEUIL_MICRO = ACTIVITY_PARAMS.liberalSsi.plafond;
export const ABATTEMENT_BNC = ACTIVITY_PARAMS.liberalSsi.abattement;
export const TAUX_VL_BNC = ACTIVITY_PARAMS.liberalSsi.tauxVL;

/**
 * Combine les paramètres par défaut de l'activité avec les overrides du profil
 * (slider URSSAF, seuil custom). Le profil a toujours la priorité.
 */
export function getFiscalParams(profile: UserProfile): ActivityParams {
  const base = ACTIVITY_PARAMS[profile.activity] ?? ACTIVITY_PARAMS.liberalSsi;
  return {
    ...base,
    urssafRate: profile.urssafRate ?? base.urssafRate,
    plafond: profile.seuilMicro ?? base.plafond,
  };
}

export const TRANCHES_IR = [
  { min: 0, max: 11_600, taux: 0 },
  { min: 11_601, max: 29_579, taux: 0.11 },
  { min: 29_580, max: 84_577, taux: 0.30 },
  { min: 84_578, max: 181_917, taux: 0.41 },
  { min: 181_918, max: Infinity, taux: 0.45 },
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// --- Fonctions de base ---

export function calcCAMensuel(tjm: number, jours: number): number {
  return tjm * jours;
}

export function calcCAannuel(tjm: number, joursMensuels: number, mois: number = 12): number {
  return tjm * joursMensuels * mois;
}

export function calcChargesURSSAF(ca: number, taux: number): number {
  return ca * (taux / 100);
}

export function calcTotalChargesFixes(costs: UserProfile['fixedCosts']): number {
  return costs.reduce((acc, c) => acc + c.amount, 0);
}

// --- Impôt sur le revenu (barème progressif) ---

export function calcIR(revenuImposable: number, parts: number = 1): number {
  const revenuParPart = revenuImposable / parts;
  let impotParPart = 0;

  for (const tranche of TRANCHES_IR) {
    if (revenuParPart <= tranche.min) break;
    const base = Math.min(revenuParPart, tranche.max) - tranche.min;
    impotParPart += Math.max(0, base) * tranche.taux;
  }

  return Math.round(impotParPart * parts);
}

// --- CFP, taxe consulaire, ACRE, TVA ---

/**
 * Contribution Formation Professionnelle, prélevée mensuellement avec l'URSSAF.
 * Taux selon activité (commerçants 0,1 %, prestataires BIC 0,3 %, libéraux 0,2 %).
 */
export function calcCFP(ca: number, activity: Activity): number {
  if (ca <= 0) return 0;
  return ca * ACTIVITY_PARAMS[activity].cfpRate;
}

/**
 * Taxe pour frais de chambre consulaire (CCI/CMA). Libéraux exonérés.
 */
export function calcTaxeConsulaire(ca: number, activity: Activity): number {
  if (ca <= 0) return 0;
  return ca * ACTIVITY_PARAMS[activity].taxeConsulaireRate;
}

export interface ACREResult {
  reduction: number;     // montant absolu déduit de l'URSSAF brut
  applicable: boolean;
  rate: number;          // 0, 0.25 ou 0.50
}

/**
 * Réduction ACRE : 50 % d'URSSAF si création avant 01/05/2024, 25 % sinon,
 * pendant 12 mois à compter de la date de création.
 */
export function calcACRE(
  urssafBrut: number,
  creationDate: Date | null | undefined,
  periodDate: Date,
  enabled: boolean = true,
): ACREResult {
  if (!enabled || !creationDate) return { reduction: 0, applicable: false, rate: 0 };

  // Fin de la fenêtre 12 mois post-création
  const expiry = new Date(creationDate);
  expiry.setMonth(expiry.getMonth() + ACRE_DURATION_MONTHS);

  if (periodDate < creationDate || periodDate >= expiry) {
    return { reduction: 0, applicable: false, rate: 0 };
  }

  const rate = creationDate < ACRE_TRANSITION_DATE ? ACRE_RATE_BEFORE : ACRE_RATE_AFTER;
  return { reduction: urssafBrut * rate, applicable: true, rate };
}

/** Renvoie les seuils de franchise en base TVA pour une activité. */
export function getTVASeuils(activity: Activity): { basique: number; majore: number } {
  return activity === 'vente' ? TVA_FRANCHISE_2026.vente : TVA_FRANCHISE_2026.services;
}

/**
 * Statut TVA selon CA cumulé : `safe` (sous le seuil basique),
 * `warning` (entre basique et majoré, dépassement toléré 1 an),
 * `breach` (au-dessus du seuil majoré, bascule TVA obligatoire).
 */
export function calcTVAStatus(caCumule: number, activity: Activity): TVAStatus {
  const { basique, majore } = getTVASeuils(activity);
  if (caCumule >= majore) return 'breach';
  if (caCumule >= basique) return 'warning';
  return 'safe';
}

/**
 * Date projetée de bascule TVA (franchise → assujetti) en cumulant les jours travaillés.
 * Renvoie la date à laquelle le seuil basique est dépassé, ou null si non dépassé.
 */
export function calcTVASeuilDate(
  months: { month: number; year: number; workedDays: number[]; halfDays?: number[] }[],
  tjm: number,
  activity: Activity,
): Date | null {
  const { basique } = getTVASeuils(activity);
  return calcSeuilDate(months, tjm, basique);
}

// --- Net par statut ---

export interface FiscalCalcOptions {
  abattement?: number;             // défaut : ABATTEMENT_BNC (libéral SSI)
  tauxVL?: number;                 // défaut : TAUX_VL_BNC (libéral SSI)
  cfpRate?: number;                // défaut : 0
  taxeConsulaireRate?: number;     // défaut : 0
  /** Réduction ACRE absolue à déduire de l'URSSAF. Défaut : 0. */
  acreReduction?: number;
  tvaStatus?: TVAStatus;           // défaut : 'safe'
  tvaSeuilDate?: Date | null;      // défaut : null
}

export function calcNetMicro(
  ca: number,
  tauxURSSAF: number,
  chargesFixes: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): FiscalResult {
  const abattement = opts.abattement ?? ABATTEMENT_BNC;
  const tauxVL = opts.tauxVL ?? TAUX_VL_BNC;
  const cfpRate = opts.cfpRate ?? 0;
  const taxeConsulaireRate = opts.taxeConsulaireRate ?? 0;
  const acreReduction = Math.max(0, Math.min(opts.acreReduction ?? 0, ca * (tauxURSSAF / 100)));
  const tvaStatus: TVAStatus = opts.tvaStatus ?? 'safe';
  const tvaSeuilDate = opts.tvaSeuilDate ?? null;

  const chargesURSSAFBrutes = calcChargesURSSAF(ca, tauxURSSAF);
  const chargesURSSAF = chargesURSSAFBrutes - acreReduction;
  const cfpAnnuel = ca * cfpRate;
  const taxeConsulaireAnnuelle = ca * taxeConsulaireRate;
  const totalChargesObligatoires = chargesURSSAF + cfpAnnuel + taxeConsulaireAnnuelle;

  if (versementLiberatoire) {
    const ir = ca * tauxVL;
    const netApresIR = ca - totalChargesObligatoires - chargesFixes - ir;
    return {
      caAnnuel: ca,
      chargesURSSAF,
      chargesFixes,
      revenuImposable: ca, // base = CA brut pour le VL
      ir,
      netApresIR,
      cfpAnnuel,
      taxeConsulaireAnnuelle,
      acreReductionAnnuelle: acreReduction,
      tvaStatus,
      tvaSeuilDate,
    };
  }

  const revenuImposable = ca * (1 - abattement);
  const ir = calcIR(revenuImposable);
  const netApresIR = ca - totalChargesObligatoires - chargesFixes - ir;

  return {
    caAnnuel: ca,
    chargesURSSAF,
    chargesFixes,
    revenuImposable,
    ir,
    netApresIR,
    cfpAnnuel,
    taxeConsulaireAnnuelle,
    acreReductionAnnuelle: acreReduction,
    tvaStatus,
    tvaSeuilDate,
  };
}

// --- Ventilation mensuelle ---

export function calcMonthlyBreakdown(
  caMensuel: number,
  tauxURSSAF: number,
  chargesFixesMensuelles: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): MonthlyBreakdown {
  const cfpRate = opts.cfpRate ?? 0;
  const taxeConsulaireRate = opts.taxeConsulaireRate ?? 0;

  const urssafBrut = calcChargesURSSAF(caMensuel, tauxURSSAF);
  const acreReduction = Math.max(0, Math.min(opts.acreReduction ?? 0, urssafBrut));
  const urssaf = urssafBrut - acreReduction;
  const cfp = caMensuel * cfpRate;
  const taxeConsulaire = caMensuel * taxeConsulaireRate;

  // Projection annualisée (×12) pour estimer l'IR au barème progressif.
  // L'ACRE est passée en valeur annualisée pour rester cohérente sur l'année.
  const caAnnuelProjection = caMensuel * 12;
  const optsAnnuel: FiscalCalcOptions = {
    ...opts,
    acreReduction: acreReduction * 12,
  };
  const annualResult = calcNetMicro(caAnnuelProjection, tauxURSSAF, chargesFixesMensuelles * 12, versementLiberatoire, optsAnnuel);
  const ir = annualResult.ir / 12;

  const net = caMensuel - urssaf - cfp - taxeConsulaire - chargesFixesMensuelles - ir;
  const tauxNet = caMensuel > 0 ? net / caMensuel : 0;
  return {
    ca: caMensuel,
    urssaf,
    ir,
    chargesFixes: chargesFixesMensuelles,
    net,
    tauxNet,
    cfp,
    taxeConsulaire,
    acreReduction,
  };
}

export function calcReserveVacances(netMensuel: number, joursParMois: number): number {
  if (joursParMois <= 0) return 0;
  return Math.round((netMensuel / joursParMois) * 25 / 12);
}

/** Nombre de jours équivalents (plein + demi × 0.5) pour un mois. */
export function calcEquivDays(m: { workedDays: number[]; halfDays?: number[] }): number {
  return m.workedDays.length + (m.halfDays?.length ?? 0) * 0.5;
}

/**
 * Net cumulé estimé : applique URSSAF + IR (barème ou VL) au CA cumulé,
 * puis déduit `monthsWithActivity × chargesFixesMensuelles`.
 *
 * Le compte « mois avec activité » sert à pondérer les charges fixes
 * (un freelance qui n'a coché que 3 mois ne paye pas 12 mois de charges).
 */
export function calcNetCumule(
  caCumule: number,
  tauxURSSAF: number,
  chargesFixesMensuelles: number,
  monthsWithActivity: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): number {
  if (caCumule <= 0) return 0;
  const chargesFixesTotal = chargesFixesMensuelles * Math.max(0, monthsWithActivity);
  const result = calcNetMicro(caCumule, tauxURSSAF, chargesFixesTotal, versementLiberatoire, opts);
  return Math.round(result.netApresIR);
}

/** Nombre de mois ayant au moins un jour plein ou demi saisi. */
export function countMonthsWithActivity(months: CalendarMonth[]): number {
  return months.reduce(
    (acc, m) => acc + (m.workedDays.length > 0 || (m.halfDays?.length ?? 0) > 0 ? 1 : 0),
    0,
  );
}

export function calcCaRealise(
  months: CalendarMonth[],
  tjm: number,
  currentMonthIndex: number,
  todayDate: number,
): { caRealise: number; joursRealises: number } {
  let jours = 0;
  for (const m of months) {
    const halfDays = m.halfDays ?? [];
    if (m.month < currentMonthIndex) {
      jours += m.workedDays.length + halfDays.length * 0.5;
    } else if (m.month === currentMonthIndex) {
      jours += m.workedDays.filter((d) => d <= todayDate).length;
      jours += halfDays.filter((d) => d <= todayDate).length * 0.5;
    }
  }
  return { caRealise: jours * tjm, joursRealises: jours };
}

// --- Utilitaires ---

/**
 * Calcule la date de franchissement du seuil en cumulant les jours travaillés mois par mois.
 * Retourne la date exacte du jour où le cumul dépasse le seuil, ou null si pas de dépassement.
 */
export function calcSeuilDate(
  months: { month: number; year: number; workedDays: number[]; halfDays?: number[] }[],
  tjm: number,
  seuil: number = SEUIL_MICRO,
): Date | null {
  if (tjm <= 0) return null;

  let cumul = 0;
  for (const m of months) {
    const halfSet = new Set(m.halfDays ?? []);
    const allDays = [...new Set([...m.workedDays, ...(m.halfDays ?? [])])].sort((a, b) => a - b);
    for (const day of allDays) {
      const fraction = halfSet.has(day) ? 0.5 : 1;
      cumul += tjm * fraction;
      if (cumul >= seuil) {
        return new Date(m.year, m.month, day);
      }
    }
  }
  return null;
}

export function generateChartData(profile: UserProfile): MonthlyChartData[] {
  const chargesFixesMensuelles = calcTotalChargesFixes(profile.fixedCosts);
  const params = getFiscalParams(profile);
  const brut = calcCAMensuel(profile.tjm, profile.workingDays);
  const breakdown = calcMonthlyBreakdown(
    brut,
    params.urssafRate,
    chargesFixesMensuelles,
    profile.versementLiberatoire,
    { abattement: params.abattement, tauxVL: params.tauxVL },
  );

  return MONTHS.map((month) => ({
    month, brut: Math.round(brut), net: Math.round(breakdown.net),
  }));
}
