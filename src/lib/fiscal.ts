import type { Activity, UserProfile, FiscalResult, MonthlyBreakdown, MonthlyChartData, CalendarMonth } from '~/types';

// --- Paramètres fiscaux par activité (2026) ---

export interface ActivityParams {
  label: string;
  hint: string;
  urssafRate: number; // %
  abattement: number; // 0..1, abattement IR au barème
  plafond: number;    // €, plafond annuel CA pour rester en micro
  tauxVL: number;     // 0..1, taux versement libératoire
}

export const ACTIVITY_PARAMS: Record<Activity, ActivityParams> = {
  vente:        { label: 'Vente / hébergement (BIC)',      hint: 'Marchandises, e-commerce, gîte',     urssafRate: 12.3, abattement: 0.71, plafond: 203_100, tauxVL: 0.010 },
  serviceBic:   { label: 'Services commerciaux / artisan', hint: 'Artisan, prestation BIC',            urssafRate: 21.2, abattement: 0.50, plafond:  83_600, tauxVL: 0.017 },
  liberalSsi:   { label: 'Libéral non réglementé (SSI)',   hint: 'BNC SSI : conseil, dev, design',     urssafRate: 26.1, abattement: 0.34, plafond:  83_600, tauxVL: 0.022 },
  liberalCipav: { label: 'Libéral réglementé (CIPAV)',     hint: 'Architecte, ostéo, psy, etc.',       urssafRate: 23.2, abattement: 0.34, plafond:  83_600, tauxVL: 0.022 },
};

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

// --- Net par statut ---

export interface FiscalCalcOptions {
  abattement?: number; // défaut : ABATTEMENT_BNC (libéral SSI)
  tauxVL?: number;     // défaut : TAUX_VL_BNC (libéral SSI)
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
  const chargesURSSAF = calcChargesURSSAF(ca, tauxURSSAF);

  if (versementLiberatoire) {
    const ir = ca * tauxVL;
    const netApresIR = ca - chargesURSSAF - chargesFixes - ir;
    return {
      caAnnuel: ca,
      chargesURSSAF,
      chargesFixes,
      revenuImposable: ca, // base = CA brut pour le VL
      ir,
      netApresIR,
    };
  }

  const revenuImposable = ca * (1 - abattement);
  const ir = calcIR(revenuImposable);
  const netApresIR = ca - chargesURSSAF - chargesFixes - ir;

  return {
    caAnnuel: ca,
    chargesURSSAF,
    chargesFixes,
    revenuImposable,
    ir,
    netApresIR,
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
  const urssaf = calcChargesURSSAF(caMensuel, tauxURSSAF);

  // Projection annualisée (×12) pour estimer l'IR au barème progressif
  const caAnnuelProjection = caMensuel * 12;
  const annualResult = calcNetMicro(caAnnuelProjection, tauxURSSAF, chargesFixesMensuelles * 12, versementLiberatoire, opts);
  const ir = annualResult.ir / 12;

  const net = caMensuel - urssaf - chargesFixesMensuelles - ir;
  const tauxNet = caMensuel > 0 ? net / caMensuel : 0;
  return { ca: caMensuel, urssaf, ir, chargesFixes: chargesFixesMensuelles, net, tauxNet };
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
