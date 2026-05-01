import type { UserProfile, FiscalResult, MonthlyBreakdown, MonthlyChartData, CalendarMonth } from '~/types';

// --- Constantes fiscales ---

export const SEUIL_MICRO = 83_600;
export const ABATTEMENT_BNC = 0.34;
export const TAUX_VL_BNC = 0.022; // Versement libératoire BNC (prestations de services)

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

export function calcNetMicro(ca: number, tauxURSSAF: number, chargesFixes: number, versementLiberatoire: boolean = false): FiscalResult {
  const chargesURSSAF = calcChargesURSSAF(ca, tauxURSSAF);

  if (versementLiberatoire) {
    // VL : 2.2% du CA remplace l'IR au barème progressif
    const ir = ca * TAUX_VL_BNC;
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

  const revenuImposable = ca * (1 - ABATTEMENT_BNC);
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
): MonthlyBreakdown {
  const urssaf = calcChargesURSSAF(caMensuel, tauxURSSAF);

  // Projection annualisée (×12) pour estimer l'IR au barème progressif
  const caAnnuelProjection = caMensuel * 12;
  const annualResult = calcNetMicro(caAnnuelProjection, tauxURSSAF, chargesFixesMensuelles * 12, versementLiberatoire);
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
  const brut = calcCAMensuel(profile.tjm, profile.workingDays);
  const breakdown = calcMonthlyBreakdown(brut, profile.urssafRate, chargesFixesMensuelles, profile.versementLiberatoire);

  return MONTHS.map((month) => ({
    month, brut: Math.round(brut), net: Math.round(breakdown.net),
  }));
}
