import type { UserProfile, FiscalResult, MonthlyChartData } from '~/types';

// --- Constantes fiscales ---

export const SEUIL_MICRO = 77_700;
export const ABATTEMENT_BNC = 0.34;
export const TAUX_VL_BNC = 0.022; // Versement libératoire BNC (prestations de services)
export const FLAT_TAX = 0.30;
export const TAUX_IS = { reduit: 0.15, plafond: 42_500, normal: 0.25 };
export const CHARGES_PATRONALES_SASU = 0.45;
export const CHARGES_SALARIALES_SASU = 0.22;
export const COTISATIONS_TNS = 0.45;

export const TRANCHES_IR = [
  { min: 0, max: 11_294, taux: 0 },
  { min: 11_295, max: 28_797, taux: 0.11 },
  { min: 28_798, max: 82_341, taux: 0.30 },
  { min: 82_342, max: 177_106, taux: 0.41 },
  { min: 177_107, max: Infinity, taux: 0.45 },
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

export function calcNetSASU(ca: number, chargesFixes: number): FiscalResult {
  // Stratégie : 70% salaire, 30% dividendes
  const partSalaire = ca * 0.70;
  const partDividendes = ca * 0.30;

  // Salaire : charges patronales puis salariales
  const coutPatronal = partSalaire / (1 + CHARGES_PATRONALES_SASU);
  const salaireNet = coutPatronal * (1 - CHARGES_SALARIALES_SASU);
  const chargesSocialesSASU = partSalaire - salaireNet;

  // IS sur le résultat (dividendes)
  const resultatAvantIS = partDividendes - chargesFixes;
  const is = resultatAvantIS <= TAUX_IS.plafond
    ? resultatAvantIS * TAUX_IS.reduit
    : TAUX_IS.plafond * TAUX_IS.reduit + (resultatAvantIS - TAUX_IS.plafond) * TAUX_IS.normal;
  const dividendesApresIS = Math.max(0, resultatAvantIS - is);

  // Flat tax sur dividendes
  const dividendesNet = dividendesApresIS * (1 - FLAT_TAX);

  // IR sur le salaire net
  const ir = calcIR(salaireNet);
  const netApresIR = salaireNet - ir + dividendesNet;

  return {
    caAnnuel: ca,
    chargesURSSAF: chargesSocialesSASU,
    chargesFixes,
    revenuImposable: salaireNet,
    ir: ir + Math.round(dividendesApresIS * FLAT_TAX),
    netApresIR,
  };
}

export function calcNetEURL(ca: number, chargesFixes: number): FiscalResult {
  // TNS : cotisations sur rémunération
  const remuneration = ca * 0.70;
  const cotisationsTNS = remuneration * COTISATIONS_TNS;
  const remunerationNette = remuneration - cotisationsTNS;

  // IS sur le résultat
  const resultatAvantIS = ca * 0.30 - chargesFixes;
  const is = resultatAvantIS <= TAUX_IS.plafond
    ? resultatAvantIS * TAUX_IS.reduit
    : TAUX_IS.plafond * TAUX_IS.reduit + (resultatAvantIS - TAUX_IS.plafond) * TAUX_IS.normal;
  const dividendesApresIS = Math.max(0, resultatAvantIS - is);

  // Dividendes > 10% capital → cotisations TNS (on simplifie : tout en cotisations)
  const cotisationsDividendes = dividendesApresIS * COTISATIONS_TNS;
  const dividendesNet = dividendesApresIS - cotisationsDividendes;

  const ir = calcIR(remunerationNette);
  const netApresIR = remunerationNette - ir + dividendesNet;

  return {
    caAnnuel: ca,
    chargesURSSAF: cotisationsTNS + cotisationsDividendes,
    chargesFixes,
    revenuImposable: remunerationNette,
    ir: ir + Math.round(is),
    netApresIR,
  };
}

// --- Utilitaires ---

export function calcSeuilDate(caCumule: number, caMensuelMoyen: number, seuil: number = SEUIL_MICRO): Date | null {
  if (caMensuelMoyen <= 0) return null;
  if (caCumule >= seuil) return new Date();

  const moisRestants = (seuil - caCumule) / caMensuelMoyen;
  const date = new Date();
  date.setMonth(date.getMonth() + Math.ceil(moisRestants));
  return date;
}

export function generateChartData(profile: UserProfile): MonthlyChartData[] {
  const chargesFixesMensuelles = calcTotalChargesFixes(profile.fixedCosts);

  return MONTHS.map((month) => {
    const brut = calcCAMensuel(profile.tjm, profile.workingDays);
    const urssaf = calcChargesURSSAF(brut, profile.urssafRate);
    const net = brut - urssaf - chargesFixesMensuelles;

    return { month, brut: Math.round(brut), net: Math.round(net) };
  });
}
