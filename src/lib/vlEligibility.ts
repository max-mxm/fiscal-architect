/** Page officielle maintenue par la DGFiP sur les conditions du versement libératoire. */
export const VL_OFFICIAL_GUIDE_URL = 'https://www.impots.gouv.fr/professionnel/questions/en-tant-que-micro-entrepreneur-sous-quelles-conditions-puis-je-opter-pour-l';

/** Plafond du revenu fiscal de référence par part selon l'année d'application du VL. */
export const VL_RFR_THRESHOLD_BY_YEAR: Record<number, number> = {
  2024: 27_478,
  2025: 28_797,
  2026: 29_315,
  2027: 29_579,
};

export interface VLEligibility {
  eligible: boolean;
  threshold: number;
  motif: 'rfr-too-high' | 'unknown' | null;
  /** Année des revenus à lire sur l'avis d'impôt : année d'application − 2. */
  rfrYear: number;
  /** Année au cours de laquelle l'avis correspondant est normalement reçu. */
  taxNoticeYear: number;
  /** Faux si l'année demandée utilise le dernier seuil officiel connu. */
  thresholdIsKnown: boolean;
}

export function getVLRfrThresholdPerPart(year: number): { amount: number; known: boolean } {
  const direct = VL_RFR_THRESHOLD_BY_YEAR[year];
  if (direct !== undefined) return { amount: direct, known: true };

  const knownYears = Object.keys(VL_RFR_THRESHOLD_BY_YEAR).map(Number).sort((a, b) => b - a);
  const fallbackYear = knownYears.find((candidate) => candidate <= year) ?? knownYears[knownYears.length - 1];
  return { amount: VL_RFR_THRESHOLD_BY_YEAR[fallbackYear], known: false };
}

/** Vérifie l'éligibilité au VL et explicite l'année de revenu à consulter. */
export function calcVLEligibilityForYear(
  rfrN2: number | null,
  partsFiscales: number = 1,
  year: number,
): VLEligibility {
  const parts = partsFiscales > 0 ? partsFiscales : 1;
  const thresholdPerPart = getVLRfrThresholdPerPart(year);
  const threshold = thresholdPerPart.amount * parts;
  const common = {
    threshold,
    rfrYear: year - 2,
    taxNoticeYear: year - 1,
    thresholdIsKnown: thresholdPerPart.known,
  };

  if (rfrN2 === null || rfrN2 < 0) {
    return { ...common, eligible: false, motif: 'unknown' };
  }
  if (rfrN2 > threshold) {
    return { ...common, eligible: false, motif: 'rfr-too-high' };
  }
  return { ...common, eligible: true, motif: null };
}
