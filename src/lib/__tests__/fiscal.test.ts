import { describe, expect, it } from 'vitest';
import type { CalendarMonth, UserProfile } from '~/types';
import {
  ABATTEMENT_BNC,
  ACRE_DURATION_MONTHS,
  ACRE_RATE_AFTER,
  ACRE_RATE_BEFORE,
  ACRE_TRANSITION_DATE,
  ACTIVITY_PARAMS,
  SEUIL_MICRO,
  TAUX_VL_BNC,
  TVA_FRANCHISE_2026,
  calcACRE,
  calcCAFromEntries,
  calcCAMensuel,
  calcCAYearFromEntries,
  calcCAannuel,
  calcCFP,
  calcCaRealise,
  calcCaRealiseFromEntries,
  calcChargesURSSAF,
  calcEquivDays,
  calcIR,
  calcMonthlyBreakdown,
  calcNetCumule,
  calcNetMicro,
  calcReserveVacances,
  calcSeuilDate,
  calcSeuilDateFromEntries,
  calcTaxeConsulaire,
  monthHasRevenue,
  getActivities,
  getMixedTVASeuils,
  getPrimaryActivity,
  resolveActivityType,
  calcCAByActivity,
  calcNetMicroMulti,
  activityCategory,
  calcVLEligibility,
  calcIJ,
  isCompteProAlerte,
  VL_RFR_PLAFOND_PER_PART,
  calcTotalChargesFixes,
  calcTVAStatus,
  calcTVASeuilDate,
  countMonthsWithActivity,
  generateChartData,
  getFiscalParams,
  getTVASeuils,
} from '~/lib/fiscal';

const fixedCost = (id: string, amount: number): UserProfile['fixedCosts'][number] => ({
  id,
  name: id,
  description: '',
  amount,
  icon: '',
  color: '',
});

const monthsOf = (year: number, fill: Partial<CalendarMonth>[] = []): CalendarMonth[] =>
  Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    workedDays: [],
    halfDays: [],
    ...fill[i],
  }));

describe('calcCAMensuel', () => {
  it('multiplie TJM par jours', () => {
    expect(calcCAMensuel(500, 18)).toBe(9000);
  });

  it('retourne 0 si jours = 0', () => {
    expect(calcCAMensuel(500, 0)).toBe(0);
  });

  it('gère les TJM décimaux', () => {
    expect(calcCAMensuel(450.5, 10)).toBe(4505);
  });
});

describe('calcCAannuel', () => {
  it('projette sur 12 mois par défaut', () => {
    expect(calcCAannuel(500, 18)).toBe(108000);
  });

  it('accepte un nombre de mois custom', () => {
    expect(calcCAannuel(500, 18, 10)).toBe(90000);
  });
});

describe('calcChargesURSSAF', () => {
  it('applique 22% sur le CA', () => {
    expect(calcChargesURSSAF(10000, 22)).toBeCloseTo(2200);
  });

  it('applique 25.8% sur le CA', () => {
    expect(calcChargesURSSAF(10000, 25.8)).toBeCloseTo(2580);
  });

  it('retourne 0 si taux = 0', () => {
    expect(calcChargesURSSAF(10000, 0)).toBe(0);
  });
});

describe('calcTotalChargesFixes', () => {
  it('retourne 0 pour une liste vide', () => {
    expect(calcTotalChargesFixes([])).toBe(0);
  });

  it('somme plusieurs charges', () => {
    expect(
      calcTotalChargesFixes([fixedCost('a', 100), fixedCost('b', 250), fixedCost('c', 50)]),
    ).toBe(400);
  });

  it('inclut les charges à 0', () => {
    expect(calcTotalChargesFixes([fixedCost('a', 0), fixedCost('b', 100)])).toBe(100);
  });
});

describe('calcIR', () => {
  it('retourne 0 pour un revenu nul', () => {
    expect(calcIR(0)).toBe(0);
  });

  it('retourne 0 dans la 1ère tranche (≤ 11 600)', () => {
    expect(calcIR(11_600)).toBe(0);
    expect(calcIR(5000)).toBe(0);
  });

  it('applique 11% au-delà de 11 600', () => {
    // 30 000 → tr2: (29579-11601)*0.11 = 1977.58, tr3: (30000-29580)*0.30 = 126
    expect(calcIR(30_000)).toBe(2104);
  });

  it('cumule les tranches sur un revenu élevé', () => {
    // 100 000 → tr2: 1977.58, tr3: 16499.1, tr4: (100000-84578)*0.41 = 6323.02
    // Total = 24799.7 → arrondi 24800
    expect(calcIR(100_000)).toBe(24800);
  });

  it('atteint la 5e tranche (45%)', () => {
    // 200 000 → tr2 + tr3 + tr4 (all max) + tr5: (200000-181918)*0.45
    const ir = calcIR(200_000);
    expect(ir).toBeGreaterThan(60_000);
  });

  it('divise par parts puis remultiplie (arrondi en fin)', () => {
    // 60 000 sur 2 parts → calc sur 30 000/part = 2103.58/part, ×2 = 4207.16 → 4207
    expect(calcIR(60_000, 2)).toBe(4207);
  });
});

describe('calcNetMicro', () => {
  it('applique URSSAF + IR au barème (sans VL)', () => {
    const result = calcNetMicro(50_000, 22, 0);
    expect(result.caAnnuel).toBe(50_000);
    expect(result.chargesURSSAF).toBeCloseTo(11_000);
    expect(result.revenuImposable).toBeCloseTo(50_000 * (1 - ABATTEMENT_BNC));
    // base imposable = 33 000 → tr2: (29579-11601)*0.11=1977.58, tr3: (33000-29580)*0.30=1026
    // total = 3003.58 → arrondi 3004
    expect(result.ir).toBe(3004);
    expect(result.netApresIR).toBeCloseTo(50_000 - 11_000 - 0 - 3004);
  });

  it('soustrait les charges fixes', () => {
    const result = calcNetMicro(50_000, 22, 5_000);
    expect(result.chargesFixes).toBe(5_000);
    expect(result.netApresIR).toBeCloseTo(50_000 - 11_000 - 5_000 - result.ir);
  });

  it('utilise le versement libératoire (2.2%) au lieu du barème', () => {
    const result = calcNetMicro(50_000, 22, 0, true);
    expect(result.ir).toBeCloseTo(50_000 * TAUX_VL_BNC);
    expect(result.revenuImposable).toBe(50_000); // base = CA brut
    expect(result.netApresIR).toBeCloseTo(50_000 - 11_000 - 1_100);
  });
});

describe('calcMonthlyBreakdown', () => {
  it('annualise puis divise IR par 12', () => {
    const monthly = calcMonthlyBreakdown(5_000, 22, 0); // CA mensuel = 5000 → annuel = 60000
    const annual = calcNetMicro(60_000, 22, 0);
    expect(monthly.ir).toBeCloseTo(annual.ir / 12);
  });

  it('retourne ca, urssaf, chargesFixes mensuels', () => {
    const m = calcMonthlyBreakdown(5_000, 22, 300);
    expect(m.ca).toBe(5_000);
    expect(m.urssaf).toBeCloseTo(1_100);
    expect(m.chargesFixes).toBe(300);
  });

  it('calcule un taux net entre 0 et 1', () => {
    const m = calcMonthlyBreakdown(5_000, 22, 300);
    expect(m.tauxNet).toBeGreaterThan(0);
    expect(m.tauxNet).toBeLessThan(1);
  });

  it('tauxNet = 0 si CA = 0', () => {
    const m = calcMonthlyBreakdown(0, 22, 0);
    expect(m.tauxNet).toBe(0);
  });
});

describe('calcReserveVacances', () => {
  it('retourne 0 si jours = 0', () => {
    expect(calcReserveVacances(3_000, 0)).toBe(0);
  });

  it('retourne 0 si jours négatif', () => {
    expect(calcReserveVacances(3_000, -5)).toBe(0);
  });

  it('applique la formule (net/jours) × 25 / 12 arrondi', () => {
    // 3000/20 * 25 / 12 = 312.5 → 313 (Math.round)
    expect(calcReserveVacances(3_000, 20)).toBe(313);
  });
});

describe('calcEquivDays', () => {
  it('compte les jours pleins', () => {
    expect(calcEquivDays({ workedDays: [1, 2, 3], halfDays: [] })).toBe(3);
  });

  it('compte les demi-jours à 0.5', () => {
    expect(calcEquivDays({ workedDays: [], halfDays: [10, 11] })).toBe(1);
  });

  it('mélange pleins et demi', () => {
    expect(calcEquivDays({ workedDays: [1, 2], halfDays: [10] })).toBe(2.5);
  });

  it('gère halfDays manquant', () => {
    expect(calcEquivDays({ workedDays: [1, 2, 3] })).toBe(3);
  });
});

describe('calcCaRealise', () => {
  it('retourne 0 si aucun jour réalisé', () => {
    const months = monthsOf(2025);
    const r = calcCaRealise(months, 500, 5, 15);
    expect(r.caRealise).toBe(0);
    expect(r.joursRealises).toBe(0);
  });

  it('compte tous les jours des mois passés', () => {
    const months = monthsOf(2025, [
      { workedDays: [1, 2, 3], halfDays: [4] }, // jan : 3.5
      { workedDays: [1, 2], halfDays: [] }, // fev : 2
    ]);
    // currentMonth = mars (2), todayDate = 1 → jan + fev complets, mars filtré
    const r = calcCaRealise(months, 500, 2, 1);
    expect(r.joursRealises).toBe(5.5);
    expect(r.caRealise).toBe(2750);
  });

  it('filtre le mois courant par jour', () => {
    const months = monthsOf(2025, [
      {}, {}, // jan, fev vides
      { workedDays: [5, 10, 15, 20], halfDays: [3, 25] }, // mars
    ]);
    // currentMonth = mars (2), todayDate = 12 → jours 5, 10 pleins (3 demi compte) -> 2 + 0.5 = 2.5
    const r = calcCaRealise(months, 500, 2, 12);
    expect(r.joursRealises).toBe(2.5);
  });

  it('ignore les mois futurs', () => {
    const months = monthsOf(2025, []);
    months[5].workedDays = [1, 2, 3]; // juin
    months[8].workedDays = [10, 20]; // sep, futur si on est en juillet
    // currentMonth = juillet (6), todayDate = 1 → juin compté, sep ignoré
    const r = calcCaRealise(months, 500, 6, 1);
    expect(r.joursRealises).toBe(3);
  });
});

describe('calcSeuilDate', () => {
  it('retourne null si tjm <= 0', () => {
    const months = monthsOf(2025, [{ workedDays: Array.from({ length: 30 }, (_, i) => i + 1) }]);
    expect(calcSeuilDate(months, 0)).toBeNull();
  });

  it('retourne null si seuil non atteint', () => {
    const months = monthsOf(2025, [{ workedDays: [1, 2, 3] }]);
    expect(calcSeuilDate(months, 500)).toBeNull();
  });

  it('retourne la date exacte du dépassement', () => {
    // TJM 1000, seuil 5000 → 5e jour atteint le seuil
    const months = monthsOf(2025, [{ workedDays: [1, 2, 3, 4, 5, 6] }]);
    const date = calcSeuilDate(months, 1000, 5000);
    expect(date).not.toBeNull();
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(5);
  });

  it('compte les demi-jours à 0.5 dans le cumul', () => {
    // TJM 1000, seuil 2500 → 1+1+1 (jours 1,2,3 pleins = 3000) → atteint le 3
    const months = monthsOf(2025, [{ workedDays: [1, 2, 3], halfDays: [4, 5] }]);
    const date = calcSeuilDate(months, 1000, 2500);
    expect(date!.getDate()).toBe(3);
  });

  it('utilise SEUIL_MICRO par défaut', () => {
    // 168 jours pleins × 500 = 84000 > seuil 83600
    const months = monthsOf(2025, [
      { workedDays: Array.from({ length: 31 }, (_, i) => i + 1) }, // jan
      { workedDays: Array.from({ length: 28 }, (_, i) => i + 1) }, // fev
      { workedDays: Array.from({ length: 31 }, (_, i) => i + 1) }, // mar
      { workedDays: Array.from({ length: 30 }, (_, i) => i + 1) }, // avr
      { workedDays: Array.from({ length: 31 }, (_, i) => i + 1) }, // mai
      { workedDays: Array.from({ length: 30 }, (_, i) => i + 1) }, // juin
    ]);
    const date = calcSeuilDate(months, 500);
    expect(date).not.toBeNull();
    expect(SEUIL_MICRO).toBe(83_600);
  });
});

describe('countMonthsWithActivity', () => {
  it('compte les mois avec workedDays non vide', () => {
    const months = monthsOf(2026, [
      { workedDays: [1, 2] },
      {},
      { workedDays: [10] },
      {},
      {},
    ]);
    expect(countMonthsWithActivity(months)).toBe(2);
  });

  it('compte aussi les mois avec uniquement halfDays', () => {
    const months = monthsOf(2026, [
      { halfDays: [3] },
      {},
      { workedDays: [1], halfDays: [2] },
    ]);
    expect(countMonthsWithActivity(months)).toBe(2);
  });

  it('retourne 0 sur un calendrier vide', () => {
    expect(countMonthsWithActivity(monthsOf(2026))).toBe(0);
  });
});

describe('calcNetCumule', () => {
  it('retourne 0 quand caCumule est 0', () => {
    expect(calcNetCumule(0, 26.1, 555, 5, false)).toBe(0);
  });

  it('soustrait URSSAF, charges fixes pondérées par les mois et IR au barème', () => {
    // CA = 30 000 €, URSSAF 22 % = 6 600 €, abattement 34 % → revenu imposable 19 800 €
    // IR sur 19 800 € (parts=1) ≈ tranche 11 % entre 11 600 et 19 800 → ~902 €
    // Charges fixes 555 € × 6 mois = 3 330 €
    // Net ≈ 30 000 − 6 600 − 3 330 − 902 = 19 168 €
    const net = calcNetCumule(30_000, 22, 555, 6, false);
    // Tolérance ±2 € pour les arrondis IR
    expect(net).toBeGreaterThan(19_165);
    expect(net).toBeLessThan(19_172);
  });

  it('utilise le VL 2,2 % au lieu du barème quand activé', () => {
    // CA = 30 000 €, URSSAF 22 % = 6 600 €, IR VL = 30 000 × 2,2 % = 660 €
    // Charges fixes 555 € × 6 = 3 330 €
    // Net = 30 000 − 6 600 − 3 330 − 660 = 19 410 €
    expect(calcNetCumule(30_000, 22, 555, 6, true)).toBe(19_410);
  });

  it('ignore les mois négatifs (clamp à 0)', () => {
    // Charges fixes ne doivent jamais ajouter de revenu
    const net = calcNetCumule(10_000, 22, 200, -3, true);
    // Aucune charge fixe soustraite (clamp 0) → net = 10 000 − 2 200 − 220 = 7 580
    expect(net).toBe(7_580);
  });

  it('multiplie correctement les charges fixes par le nombre de mois', () => {
    const netSansMois = calcNetCumule(20_000, 22, 500, 0, true);
    const netAvec4Mois = calcNetCumule(20_000, 22, 500, 4, true);
    // Différence = 4 × 500 = 2 000
    expect(netSansMois - netAvec4Mois).toBe(2_000);
  });
});

describe('ACTIVITY_PARAMS (chiffres 2026)', () => {
  it('vente : URSSAF 12,3 %, abattement 71 %, plafond 203 100 €, VL 1 %', () => {
    expect(ACTIVITY_PARAMS.vente.urssafRate).toBe(12.3);
    expect(ACTIVITY_PARAMS.vente.abattement).toBeCloseTo(0.71);
    expect(ACTIVITY_PARAMS.vente.plafond).toBe(203_100);
    expect(ACTIVITY_PARAMS.vente.tauxVL).toBeCloseTo(0.010);
  });

  it('serviceBic : URSSAF 21,2 %, abattement 50 %, plafond 83 600 €, VL 1,7 %', () => {
    expect(ACTIVITY_PARAMS.serviceBic.urssafRate).toBe(21.2);
    expect(ACTIVITY_PARAMS.serviceBic.abattement).toBeCloseTo(0.50);
    expect(ACTIVITY_PARAMS.serviceBic.plafond).toBe(83_600);
    expect(ACTIVITY_PARAMS.serviceBic.tauxVL).toBeCloseTo(0.017);
  });

  it('liberalSsi : URSSAF 26,1 %, abattement 34 %, plafond 83 600 €, VL 2,2 %', () => {
    expect(ACTIVITY_PARAMS.liberalSsi.urssafRate).toBe(26.1);
    expect(ACTIVITY_PARAMS.liberalSsi.abattement).toBeCloseTo(0.34);
    expect(ACTIVITY_PARAMS.liberalSsi.plafond).toBe(83_600);
    expect(ACTIVITY_PARAMS.liberalSsi.tauxVL).toBeCloseTo(0.022);
  });

  it('liberalCipav : URSSAF 23,2 %, abattement 34 %, plafond 83 600 €, VL 2,2 %', () => {
    expect(ACTIVITY_PARAMS.liberalCipav.urssafRate).toBe(23.2);
    expect(ACTIVITY_PARAMS.liberalCipav.abattement).toBeCloseTo(0.34);
    expect(ACTIVITY_PARAMS.liberalCipav.plafond).toBe(83_600);
    expect(ACTIVITY_PARAMS.liberalCipav.tauxVL).toBeCloseTo(0.022);
  });

  it('alias rétro-compat alignés sur liberalSsi', () => {
    expect(SEUIL_MICRO).toBe(ACTIVITY_PARAMS.liberalSsi.plafond);
    expect(ABATTEMENT_BNC).toBe(ACTIVITY_PARAMS.liberalSsi.abattement);
    expect(TAUX_VL_BNC).toBe(ACTIVITY_PARAMS.liberalSsi.tauxVL);
  });
});

describe('getFiscalParams', () => {
  const baseProfile: UserProfile = {
    name: 'T',
    role: 'T',
    activity: 'liberalSsi',
    tjm: 500,
    workingDays: 19,
    urssafRate: 26.1,
    fixedCosts: [],
    seuilMicro: 83_600,
    versementLiberatoire: false,
  };

  it('retourne les params de l\'activité du profil', () => {
    const params = getFiscalParams({ ...baseProfile, activity: 'vente', urssafRate: 12.3, seuilMicro: 203_100 });
    expect(params.urssafRate).toBe(12.3);
    expect(params.abattement).toBeCloseTo(0.71);
    expect(params.plafond).toBe(203_100);
    expect(params.tauxVL).toBeCloseTo(0.010);
  });

  it('le profil prime sur la valeur par défaut (slider URSSAF custom)', () => {
    const params = getFiscalParams({ ...baseProfile, activity: 'liberalSsi', urssafRate: 20 });
    expect(params.urssafRate).toBe(20); // override profil
    expect(params.abattement).toBeCloseTo(0.34); // pas d'override → valeur de l'activité
  });

  it('le seuilMicro custom du profil prime sur le plafond de l\'activité', () => {
    const params = getFiscalParams({ ...baseProfile, activity: 'vente', seuilMicro: 150_000 });
    expect(params.plafond).toBe(150_000);
  });
});

describe('calcNetMicro avec opts (par activité)', () => {
  it('vente : 100 000 € → URSSAF 12,3 %, IR sur 29 % du CA', () => {
    const p = ACTIVITY_PARAMS.vente;
    const r = calcNetMicro(100_000, p.urssafRate, 0, false, { abattement: p.abattement, tauxVL: p.tauxVL });
    expect(r.chargesURSSAF).toBeCloseTo(12_300);
    expect(r.revenuImposable).toBeCloseTo(29_000); // 100k × (1-0.71)
    // IR sur 29 000 → tr2: (29000-11600)*0.11 = 1914 → arrondi 1914
    expect(r.ir).toBe(1914);
    // Net = 100 000 - 12 300 - 0 - 1914 = 85 786
    expect(r.netApresIR).toBeCloseTo(85_786);
  });

  it('serviceBic : 60 000 € → URSSAF 21,2 %, IR sur 30 000 € imposable', () => {
    const p = ACTIVITY_PARAMS.serviceBic;
    const r = calcNetMicro(60_000, p.urssafRate, 0, false, { abattement: p.abattement, tauxVL: p.tauxVL });
    expect(r.chargesURSSAF).toBeCloseTo(12_720);
    expect(r.revenuImposable).toBeCloseTo(30_000);
    // IR sur 30 000 → ≈ 2104 (cf test calcIR existant)
    expect(r.ir).toBe(2104);
    expect(r.netApresIR).toBeCloseTo(60_000 - 12_720 - 2104);
  });

  it('liberalSsi : 60 000 € → URSSAF 26,1 %, IR sur 39 600 € imposable', () => {
    const p = ACTIVITY_PARAMS.liberalSsi;
    const r = calcNetMicro(60_000, p.urssafRate, 0, false, { abattement: p.abattement, tauxVL: p.tauxVL });
    expect(r.chargesURSSAF).toBeCloseTo(15_660);
    expect(r.revenuImposable).toBeCloseTo(39_600);
    expect(r.ir).toBeGreaterThan(4_900); // sanity check tranche 30 %
    expect(r.ir).toBeLessThan(5_100);
  });

  it('liberalCipav : 60 000 € → URSSAF 23,2 % (moindre que SSI), même abattement', () => {
    const ssi = ACTIVITY_PARAMS.liberalSsi;
    const cipav = ACTIVITY_PARAMS.liberalCipav;
    const rSsi = calcNetMicro(60_000, ssi.urssafRate, 0, false, { abattement: ssi.abattement, tauxVL: ssi.tauxVL });
    const rCipav = calcNetMicro(60_000, cipav.urssafRate, 0, false, { abattement: cipav.abattement, tauxVL: cipav.tauxVL });
    // CIPAV moins de charges URSSAF que SSI
    expect(rCipav.chargesURSSAF).toBeLessThan(rSsi.chargesURSSAF);
    // Donc net plus élevé
    expect(rCipav.netApresIR).toBeGreaterThan(rSsi.netApresIR);
    // Mais IR identique (même abattement 34 %)
    expect(rCipav.ir).toBe(rSsi.ir);
  });

  it('VL : taux différent par activité (vente 1 % vs SSI 2,2 %)', () => {
    const ca = 50_000;
    const venteVL = calcNetMicro(ca, 12.3, 0, true, {
      abattement: ACTIVITY_PARAMS.vente.abattement,
      tauxVL: ACTIVITY_PARAMS.vente.tauxVL,
    });
    const ssiVL = calcNetMicro(ca, 26.1, 0, true, {
      abattement: ACTIVITY_PARAMS.liberalSsi.abattement,
      tauxVL: ACTIVITY_PARAMS.liberalSsi.tauxVL,
    });
    expect(venteVL.ir).toBeCloseTo(500); // 50k × 1 %
    expect(ssiVL.ir).toBeCloseTo(1_100); // 50k × 2,2 %
  });
});

describe('calcCFP', () => {
  it('vente : 0,1 % du CA', () => {
    expect(calcCFP(50_000, 'vente')).toBeCloseTo(50);
  });

  it('serviceBic : 0,3 % du CA', () => {
    expect(calcCFP(50_000, 'serviceBic')).toBeCloseTo(150);
  });

  it('liberalSsi : 0,2 % du CA', () => {
    expect(calcCFP(50_000, 'liberalSsi')).toBeCloseTo(100);
  });

  it('liberalCipav : 0,2 % du CA', () => {
    expect(calcCFP(50_000, 'liberalCipav')).toBeCloseTo(100);
  });

  it('retourne 0 quand CA <= 0', () => {
    expect(calcCFP(0, 'liberalSsi')).toBe(0);
    expect(calcCFP(-100, 'vente')).toBe(0);
  });
});

describe('calcTaxeConsulaire', () => {
  it('vente : 0,015 % (CCI commerçants)', () => {
    expect(calcTaxeConsulaire(50_000, 'vente')).toBeCloseTo(7.5);
  });

  it('serviceBic : 0,044 % (CCI prestations)', () => {
    expect(calcTaxeConsulaire(50_000, 'serviceBic')).toBeCloseTo(22);
  });

  it('libéraux : exonérés', () => {
    expect(calcTaxeConsulaire(50_000, 'liberalSsi')).toBe(0);
    expect(calcTaxeConsulaire(50_000, 'liberalCipav')).toBe(0);
  });

  it('retourne 0 quand CA <= 0', () => {
    expect(calcTaxeConsulaire(0, 'vente')).toBe(0);
  });
});

describe('calcACRE', () => {
  const urssafBrut = 1000;

  it('non applicable si désactivée', () => {
    const result = calcACRE(urssafBrut, new Date('2025-06-01'), new Date('2025-09-01'), false);
    expect(result.applicable).toBe(false);
    expect(result.reduction).toBe(0);
    expect(result.rate).toBe(0);
  });

  it('non applicable sans date de création', () => {
    const result = calcACRE(urssafBrut, null, new Date('2025-09-01'), true);
    expect(result.applicable).toBe(false);
    expect(result.reduction).toBe(0);
  });

  it('applique 25 % pour création après 01/05/2024', () => {
    const result = calcACRE(urssafBrut, new Date('2025-06-01'), new Date('2025-09-01'), true);
    expect(result.applicable).toBe(true);
    expect(result.rate).toBe(ACRE_RATE_AFTER);
    expect(result.reduction).toBeCloseTo(250);
  });

  it('applique 50 % pour création avant 01/05/2024', () => {
    const result = calcACRE(urssafBrut, new Date('2024-02-15'), new Date('2024-09-01'), true);
    expect(result.applicable).toBe(true);
    expect(result.rate).toBe(ACRE_RATE_BEFORE);
    expect(result.reduction).toBeCloseTo(500);
  });

  it('non applicable au-delà de 12 mois après création', () => {
    const result = calcACRE(urssafBrut, new Date('2024-06-01'), new Date('2025-08-01'), true);
    expect(result.applicable).toBe(false);
    expect(result.reduction).toBe(0);
  });

  it('exactement 12 mois après création = expiré', () => {
    const result = calcACRE(urssafBrut, new Date('2024-06-01'), new Date('2025-06-01'), true);
    expect(result.applicable).toBe(false);
  });

  it('non applicable si periodDate < creationDate', () => {
    const result = calcACRE(urssafBrut, new Date('2025-06-01'), new Date('2025-03-01'), true);
    expect(result.applicable).toBe(false);
  });

  it('transition exactement le 01/05/2024 → taux 25 %', () => {
    const result = calcACRE(urssafBrut, ACRE_TRANSITION_DATE, new Date('2024-08-01'), true);
    expect(result.rate).toBe(ACRE_RATE_AFTER);
  });

  it('durée fenêtre = ACRE_DURATION_MONTHS mois', () => {
    expect(ACRE_DURATION_MONTHS).toBe(12);
  });
});

describe('getTVASeuils', () => {
  it('vente → 91 900 / 101 000 €', () => {
    expect(getTVASeuils('vente')).toEqual(TVA_FRANCHISE_2026.vente);
  });

  it('serviceBic, libéraux → 36 800 / 39 100 €', () => {
    expect(getTVASeuils('serviceBic')).toEqual(TVA_FRANCHISE_2026.services);
    expect(getTVASeuils('liberalSsi')).toEqual(TVA_FRANCHISE_2026.services);
    expect(getTVASeuils('liberalCipav')).toEqual(TVA_FRANCHISE_2026.services);
  });
});

describe('calcTVAStatus', () => {
  it('safe quand CA très en dessous du seuil basique', () => {
    expect(calcTVAStatus(20_000, 'liberalSsi')).toBe('safe');
    expect(calcTVAStatus(50_000, 'vente')).toBe('safe');
  });

  it('warning quand CA entre basique et majoré (services)', () => {
    expect(calcTVAStatus(36_800, 'liberalSsi')).toBe('warning');
    expect(calcTVAStatus(38_000, 'serviceBic')).toBe('warning');
  });

  it('breach quand CA >= seuil majoré (services)', () => {
    expect(calcTVAStatus(39_100, 'liberalSsi')).toBe('breach');
    expect(calcTVAStatus(45_000, 'liberalCipav')).toBe('breach');
  });

  it('warning quand CA entre basique et majoré (vente)', () => {
    expect(calcTVAStatus(95_000, 'vente')).toBe('warning');
  });

  it('breach quand CA >= seuil majoré (vente)', () => {
    expect(calcTVAStatus(101_000, 'vente')).toBe('breach');
    expect(calcTVAStatus(150_000, 'vente')).toBe('breach');
  });
});

describe('calcTVASeuilDate', () => {
  const monthsOf2 = (year: number, fill: Partial<CalendarMonth>[] = []): CalendarMonth[] =>
    Array.from({ length: 12 }, (_, i) => ({
      month: i,
      year,
      workedDays: [],
      halfDays: [],
      ...fill[i],
    }));

  it('renvoie null si seuil non atteint', () => {
    const months = monthsOf2(2026, [{ workedDays: [1, 2, 3] }]);
    expect(calcTVASeuilDate(months, 500, 'liberalSsi')).toBeNull();
  });

  it('renvoie la date de bascule services à 36 800 €', () => {
    // TJM 1000, seuil services 36 800 → 37e jour atteint le seuil
    // Avec 30 jours en jan + 7 jours fév => atteint le 7 fév (cumul 37 000)
    const months = monthsOf2(2026, [
      { workedDays: Array.from({ length: 30 }, (_, i) => i + 1) }, // jan : 30 × 1000 = 30 000
      { workedDays: Array.from({ length: 10 }, (_, i) => i + 1) }, // fev : 10 × 1000
    ]);
    const date = calcTVASeuilDate(months, 1000, 'liberalSsi');
    expect(date).not.toBeNull();
    expect(date!.getMonth()).toBe(1); // février
    expect(date!.getDate()).toBe(7);
  });

  it('utilise le seuil vente 91 900 € pour activité vente', () => {
    // TJM 1000, seuil vente 91 900 → atteint le 92e jour
    const months = monthsOf2(2026, [
      { workedDays: Array.from({ length: 31 }, (_, i) => i + 1) },
      { workedDays: Array.from({ length: 28 }, (_, i) => i + 1) },
      { workedDays: Array.from({ length: 31 }, (_, i) => i + 1) },
      { workedDays: Array.from({ length: 5 }, (_, i) => i + 1) },
    ]);
    const date = calcTVASeuilDate(months, 1000, 'vente');
    expect(date).not.toBeNull();
    expect(date!.getMonth()).toBe(3); // avril
  });
});

describe('calcNetMicro avec ACRE', () => {
  it('réduit l\'URSSAF du montant ACRE passé en options', () => {
    const sansAcre = calcNetMicro(50_000, 22, 0);
    const avecAcre = calcNetMicro(50_000, 22, 0, false, { acreReduction: 5_500 });
    expect(avecAcre.acreReductionAnnuelle).toBe(5_500);
    expect(avecAcre.chargesURSSAF).toBeCloseTo(sansAcre.chargesURSSAF - 5_500);
    expect(avecAcre.netApresIR).toBeCloseTo(sansAcre.netApresIR + 5_500);
  });

  it('clamp l\'ACRE à l\'URSSAF brut maximal', () => {
    // URSSAF brut = 50000 × 0.22 = 11000. Si on passe 50000, on doit clamp à 11000.
    const r = calcNetMicro(50_000, 22, 0, false, { acreReduction: 50_000 });
    expect(r.acreReductionAnnuelle).toBeCloseTo(11_000);
    expect(r.chargesURSSAF).toBe(0);
  });
});

describe('calcNetMicro avec CFP et taxe consulaire', () => {
  it('soustrait CFP et taxe consulaire du net', () => {
    const sans = calcNetMicro(50_000, 22, 0);
    const avec = calcNetMicro(50_000, 22, 0, false, { cfpRate: 0.002, taxeConsulaireRate: 0.00015 });
    expect(avec.cfpAnnuel).toBeCloseTo(100);
    expect(avec.taxeConsulaireAnnuelle).toBeCloseTo(7.5);
    expect(avec.netApresIR).toBeCloseTo(sans.netApresIR - 100 - 7.5);
  });

  it('expose tvaStatus et tvaSeuilDate (défauts safe / null)', () => {
    const r = calcNetMicro(50_000, 22, 0);
    expect(r.tvaStatus).toBe('safe');
    expect(r.tvaSeuilDate).toBeNull();

    const date = new Date('2026-10-12');
    const r2 = calcNetMicro(50_000, 22, 0, false, { tvaStatus: 'warning', tvaSeuilDate: date });
    expect(r2.tvaStatus).toBe('warning');
    expect(r2.tvaSeuilDate).toBe(date);
  });
});

describe('calcMonthlyBreakdown avec CFP, taxe consulaire, ACRE', () => {
  it('expose cfp, taxeConsulaire, acreReduction', () => {
    const m = calcMonthlyBreakdown(5_000, 22, 0, false, {
      cfpRate: 0.002,
      taxeConsulaireRate: 0.00015,
      acreReduction: 550, // 50 % de 1100 (URSSAF brut mensuel)
    });
    expect(m.cfp).toBeCloseTo(10);
    expect(m.taxeConsulaire).toBeCloseTo(0.75);
    expect(m.acreReduction).toBeCloseTo(550);
    expect(m.urssaf).toBeCloseTo(550); // 1100 - 550
  });

  it('le net mensuel intègre CFP et taxe consulaire', () => {
    const sans = calcMonthlyBreakdown(5_000, 22, 0);
    const avec = calcMonthlyBreakdown(5_000, 22, 0, false, {
      cfpRate: 0.002,
      taxeConsulaireRate: 0.00015,
    });
    // avec doit avoir un net inférieur de cfp + taxe
    expect(avec.net).toBeLessThan(sans.net);
    expect(sans.net - avec.net).toBeCloseTo(10 + 0.75);
  });
});

describe('generateChartData', () => {
  it('retourne 12 entrées', () => {
    const profile: UserProfile = {
      name: 'Test',
      role: 'Dev',
      activity: 'liberalSsi',
      tjm: 500,
      workingDays: 18,
      urssafRate: 22,
      fixedCosts: [],
      seuilMicro: SEUIL_MICRO,
      versementLiberatoire: false,
    };
    const data = generateChartData(profile);
    expect(data).toHaveLength(12);
    expect(data[0].month).toBe('Jan');
    expect(data[11].month).toBe('Déc');
  });

  it('brut = TJM × workingDays sur chaque mois', () => {
    const profile: UserProfile = {
      name: 'Test',
      role: 'Dev',
      activity: 'liberalSsi',
      tjm: 500,
      workingDays: 18,
      urssafRate: 22,
      fixedCosts: [],
      seuilMicro: SEUIL_MICRO,
      versementLiberatoire: false,
    };
    const data = generateChartData(profile);
    expect(data[0].brut).toBe(9_000);
    expect(data[11].brut).toBe(9_000);
  });
});

// --- Modèles de revenu pluggables ---

const baseProfile: UserProfile = {
  name: 'Test',
  role: 'Dev',
  activity: 'liberalSsi',
  tjm: 500,
  workingDays: 18,
  urssafRate: 22,
  fixedCosts: [],
  seuilMicro: SEUIL_MICRO,
  versementLiberatoire: false,
};

describe('calcCAFromEntries', () => {
  it('mode legacy (sans entries) reproduit le CA jours × TJM', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [1, 2, 3, 4, 5],
      halfDays: [10],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(5.5 * 500);
  });

  it('mode legacy retourne 0 quand le mois est vide', () => {
    const month: CalendarMonth = { month: 0, year: 2026, workedDays: [], halfDays: [] };
    expect(calcCAFromEntries(month, baseProfile)).toBe(0);
  });

  it('mode forfait somme les montants', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [],
      halfDays: [],
      entries: [
        { kind: 'forfait', id: 'a', date: '2026-05-12', amount: 2_500 },
        { kind: 'forfait', id: 'b', date: '2026-05-20', amount: 1_500, label: 'Site web' },
      ],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(4_000);
  });

  it('mode flat retourne le montant unique', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [],
      halfDays: [],
      entries: [{ kind: 'flat', id: 'f', amount: 8_000 }],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(8_000);
  });

  it('mode mixed somme les 3 sources', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [],
      halfDays: [],
      entries: [
        { kind: 'days', id: 'd', days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, // 10 × 500 = 5 000
        { kind: 'forfait', id: 'f', date: '2026-05-15', amount: 1_500 },
        { kind: 'flat', id: 'a', amount: 200 },
      ],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(6_700);
  });

  it('respecte tjmOverride sur les entries days', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [],
      halfDays: [],
      entries: [{ kind: 'days', id: 'd', days: [1, 2], tjmOverride: 800 }],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(2 * 800);
  });

  it('entries présentes prennent le pas sur workedDays legacy', () => {
    const month: CalendarMonth = {
      month: 4,
      year: 2026,
      workedDays: [1, 2, 3, 4, 5], // ignoré
      halfDays: [],
      entries: [{ kind: 'flat', id: 'f', amount: 10_000 }],
    };
    expect(calcCAFromEntries(month, baseProfile)).toBe(10_000);
  });
});

describe('calcCAYearFromEntries', () => {
  it("somme tous les mois quel que soit leur mode", () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2, 3], halfDays: [] }, // 3 × 500 = 1500
      {
        month: 1,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'forfait', id: 'a', date: '2026-02-10', amount: 2_500 }],
      },
      {
        month: 2,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'b', amount: 8_000 }],
      },
    ];
    expect(calcCAYearFromEntries(months, baseProfile)).toBe(1_500 + 2_500 + 8_000);
  });
});

describe('calcCaRealiseFromEntries', () => {
  it('mode days mois passés intégralement, mois courant tronqué à todayDate', () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2, 3, 4, 5], halfDays: [] }, // 5 × 500 = 2500
      { month: 1, year: 2026, workedDays: [10, 15, 20, 25], halfDays: [] }, // 4 × 500 = 2000
      { month: 2, year: 2026, workedDays: [], halfDays: [] }, // futur
    ];
    // Aujourd'hui = 18 février → on compte uniquement les jours ≤ 18 du mois 1
    const r = calcCaRealiseFromEntries(months, baseProfile, 1, 18);
    expect(r.caRealise).toBe(2_500 + 2 * 500); // janvier complet + 10 et 15 février
  });

  it('mode forfait : seuls les forfaits dont la date ≤ todayDate sont comptés', () => {
    const months: CalendarMonth[] = [
      {
        month: 4,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [
          { kind: 'forfait', id: 'a', date: '2026-05-08', amount: 2_500 },
          { kind: 'forfait', id: 'b', date: '2026-05-25', amount: 4_000 },
        ],
      },
    ];
    const r = calcCaRealiseFromEntries(months, baseProfile, 4, 15);
    expect(r.caRealise).toBe(2_500);
  });

  it('mode flat : prorate sur le mois courant (todayDate / daysInMonth)', () => {
    const months: CalendarMonth[] = [
      {
        month: 4,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'f', amount: 6_200 }],
      },
    ];
    // 15 mai 2026 → 15 / 31
    const r = calcCaRealiseFromEntries(months, baseProfile, 4, 15);
    expect(r.caRealise).toBeCloseTo(6_200 * (15 / 31), 2);
  });

  it('ignore les mois futurs', () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2], halfDays: [] },
      {
        month: 6,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'forfait', id: 'a', date: '2026-07-15', amount: 5_000 }],
      },
    ];
    const r = calcCaRealiseFromEntries(months, baseProfile, 1, 1);
    expect(r.caRealise).toBe(2 * 500);
  });
});

describe('calcSeuilDateFromEntries', () => {
  it('retourne null si seuil non atteint', () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2], halfDays: [] },
    ];
    expect(calcSeuilDateFromEntries(months, baseProfile, 100_000)).toBeNull();
  });

  it('mode days : retourne la date exacte du dépassement', () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], halfDays: [] },
    ];
    // Cumul après 8 jours = 4 000 → seuil 4 000 atteint au jour 8
    const date = calcSeuilDateFromEntries(months, baseProfile, 4_000);
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(8);
    expect(date?.getMonth()).toBe(0);
  });

  it('mode forfait : retourne la date du forfait qui fait franchir', () => {
    const months: CalendarMonth[] = [
      {
        month: 4,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [
          { kind: 'forfait', id: 'a', date: '2026-05-08', amount: 3_000 },
          { kind: 'forfait', id: 'b', date: '2026-05-22', amount: 4_000 },
        ],
      },
    ];
    const date = calcSeuilDateFromEntries(months, baseProfile, 5_000);
    expect(date?.getDate()).toBe(22);
    expect(date?.getMonth()).toBe(4);
  });

  it('mode flat : retourne le 15 du mois où le seuil est franchi', () => {
    const months: CalendarMonth[] = [
      {
        month: 0,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'a', amount: 30_000 }],
      },
      {
        month: 1,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'b', amount: 30_000 }],
      },
    ];
    const date = calcSeuilDateFromEntries(months, baseProfile, 50_000);
    expect(date?.getDate()).toBe(15);
    expect(date?.getMonth()).toBe(1);
  });
});

describe('monthHasRevenue', () => {
  it('retourne false sur un mois vide', () => {
    expect(monthHasRevenue({ month: 0, year: 2026, workedDays: [], halfDays: [] })).toBe(false);
  });

  it('retourne true en mode days legacy avec jours saisis', () => {
    expect(monthHasRevenue({ month: 0, year: 2026, workedDays: [1, 2], halfDays: [] })).toBe(true);
  });

  it('retourne true avec un forfait > 0', () => {
    expect(
      monthHasRevenue({
        month: 0,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'forfait', id: 'a', date: '2026-01-10', amount: 100 }],
      }),
    ).toBe(true);
  });

  it('retourne false avec un flat à 0', () => {
    expect(
      monthHasRevenue({
        month: 0,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'a', amount: 0 }],
      }),
    ).toBe(false);
  });
});

// --- Multi-activité ---

const multiProfile: UserProfile = {
  ...baseProfile,
  activity: 'liberalSsi',
  activities: [
    { id: 'svc', type: 'liberalSsi', isPrimary: true, label: 'Conseil dev' },
    { id: 'shop', type: 'vente', isPrimary: false, label: 'Vente templates' },
  ],
};

describe('getActivities / getPrimaryActivity / resolveActivityType', () => {
  it('retourne les activities du profil si présentes', () => {
    expect(getActivities(multiProfile)).toHaveLength(2);
  });

  it('fallback vers profile.activity si activities absent', () => {
    const acts = getActivities(baseProfile);
    expect(acts).toHaveLength(1);
    expect(acts[0].type).toBe('liberalSsi');
    expect(acts[0].isPrimary).toBe(true);
  });

  it('getPrimaryActivity retourne celle marquée isPrimary', () => {
    expect(getPrimaryActivity(multiProfile).id).toBe('svc');
  });

  it('resolveActivityType fallback vers la primaire si activityId absent', () => {
    const entry: import('~/types').RevenueEntry = { kind: 'flat', id: 'f', amount: 1000 };
    expect(resolveActivityType(entry, multiProfile)).toBe('liberalSsi');
  });

  it('resolveActivityType résout via activityId quand présent', () => {
    const entry: import('~/types').RevenueEntry = { kind: 'flat', id: 'f', amount: 1000, activityId: 'shop' };
    expect(resolveActivityType(entry, multiProfile)).toBe('vente');
  });
});

describe('calcCAByActivity', () => {
  it('ventile correctement les entries entre activités', () => {
    const months: CalendarMonth[] = [
      {
        month: 0,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [
          { kind: 'forfait', id: 'a', date: '2026-01-10', amount: 3_000, activityId: 'svc' },
          { kind: 'forfait', id: 'b', date: '2026-01-20', amount: 1_200, activityId: 'shop' },
        ],
      },
      {
        month: 1,
        year: 2026,
        workedDays: [],
        halfDays: [],
        entries: [{ kind: 'flat', id: 'c', amount: 5_000 }], // pas d'activityId → primaire
      },
    ];
    const result = calcCAByActivity(months, multiProfile);
    expect(result.liberalSsi).toBe(3_000 + 5_000); // svc + flat sans activityId
    expect(result.vente).toBe(1_200);
    expect(result.serviceBic).toBe(0);
    expect(result.liberalCipav).toBe(0);
  });

  it('mode legacy (sans entries) impute tout à la primaire', () => {
    const months: CalendarMonth[] = [
      { month: 0, year: 2026, workedDays: [1, 2, 3, 4, 5], halfDays: [] },
    ];
    const result = calcCAByActivity(months, multiProfile);
    expect(result.liberalSsi).toBe(5 * 500);
    expect(result.vente).toBe(0);
  });
});

describe('getMixedTVASeuils', () => {
  it('mono-activité services → seuil services uniquement', () => {
    const seuils = getMixedTVASeuils(baseProfile);
    expect(seuils.services).toBeDefined();
    expect(seuils.vente).toBeUndefined();
  });

  it('multi-activité services + vente → les deux seuils', () => {
    const seuils = getMixedTVASeuils(multiProfile);
    expect(seuils.services?.basique).toBe(36_800);
    expect(seuils.vente?.basique).toBe(91_900);
  });

  it("activityCategory : seul 'vente' est en catégorie vente", () => {
    expect(activityCategory('vente')).toBe('vente');
    expect(activityCategory('serviceBic')).toBe('services');
    expect(activityCategory('liberalSsi')).toBe('services');
    expect(activityCategory('liberalCipav')).toBe('services');
  });
});

describe('calcNetMicroMulti', () => {
  it('mono-activité produit le même résultat que calcNetMicro pour libéral SSI', () => {
    const ca = 60_000;
    const params = ACTIVITY_PARAMS.liberalSsi;
    const single = calcNetMicro(ca, params.urssafRate, 0, false, {
      abattement: params.abattement,
      tauxVL: params.tauxVL,
    });
    const multi = calcNetMicroMulti(
      {
        ...multiProfile,
        cfpEnabled: false,
        taxeConsulaireEnabled: false,
        activities: [{ id: 'a', type: 'liberalSsi', isPrimary: true }],
      },
      { vente: 0, serviceBic: 0, liberalSsi: ca, liberalCipav: 0 },
      0,
      false,
    );
    expect(multi.netApresIR).toBeCloseTo(single.netApresIR, 0);
    expect(multi.chargesURSSAF).toBeCloseTo(single.chargesURSSAF, 0);
  });

  it('multi-activité ventile URSSAF par branche', () => {
    const result = calcNetMicroMulti(
      multiProfile,
      { vente: 30_000, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
    );
    // URSSAF : 30 000 × 12,3 % + 60 000 × 26,1 %
    const expectedURSSAF = 30_000 * 0.123 + 60_000 * 0.261;
    expect(result.chargesURSSAF).toBeCloseTo(expectedURSSAF, 0);
  });

  it('VL : IR ventilé par taux d\'activité', () => {
    const result = calcNetMicroMulti(
      multiProfile,
      { vente: 30_000, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      true,
    );
    // IR VL : 30 000 × 1 % + 60 000 × 2,2 %
    const expectedIR = 30_000 * 0.01 + 60_000 * 0.022;
    expect(result.ir).toBeCloseTo(expectedIR, 0);
  });

  it('barème progressif : IR sur revenu imposable global ventilé', () => {
    const result = calcNetMicroMulti(
      { ...multiProfile, cfpEnabled: false, taxeConsulaireEnabled: false },
      { vente: 30_000, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
    );
    // RI = 30 000 × (1 - 0,71) + 60 000 × (1 - 0,34) = 8 700 + 39 600 = 48 300
    expect(result.revenuImposable).toBeCloseTo(48_300, 0);
    expect(result.ir).toBe(calcIR(48_300));
  });

  it('CFP désactivé → cfpAnnuel = 0 quel que soit le CA', () => {
    const result = calcNetMicroMulti(
      { ...multiProfile, cfpEnabled: false },
      { vente: 0, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
    );
    expect(result.cfpAnnuel).toBe(0);
  });

  it('ACRE répartie au prorata du CA URSSAF par branche', () => {
    const result = calcNetMicroMulti(
      multiProfile,
      { vente: 30_000, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
      { acreReduction: 1_000 },
    );
    expect(result.acreReductionAnnuelle).toBeCloseTo(1_000, 0);
  });

  it('ijAnnuel ajouté aux charges obligatoires', () => {
    const base = calcNetMicroMulti(
      { ...multiProfile, cfpEnabled: false, taxeConsulaireEnabled: false },
      { vente: 0, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
    );
    const withIJ = calcNetMicroMulti(
      { ...multiProfile, cfpEnabled: false, taxeConsulaireEnabled: false },
      { vente: 0, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 },
      0,
      false,
      { ijAnnuel: 510 },
    );
    expect(base.netApresIR - withIJ.netApresIR).toBeCloseTo(510, 0);
  });
});

// --- Phase C : VL eligibility, IJ, compte pro ---

describe('calcVLEligibility', () => {
  it('rfrN2 absent → unknown (non éligible par défaut)', () => {
    const r = calcVLEligibility(undefined, 1);
    expect(r.eligible).toBe(false);
    expect(r.motif).toBe('unknown');
  });

  it('rfrN2 sous le plafond 1 part → éligible', () => {
    const r = calcVLEligibility(20_000, 1);
    expect(r.eligible).toBe(true);
    expect(r.motif).toBeNull();
    expect(r.threshold).toBe(VL_RFR_PLAFOND_PER_PART);
  });

  it('rfrN2 au-dessus du plafond → inéligible avec motif rfr-too-high', () => {
    const r = calcVLEligibility(40_000, 1);
    expect(r.eligible).toBe(false);
    expect(r.motif).toBe('rfr-too-high');
  });

  it('parts fiscales multiplient le plafond', () => {
    const r = calcVLEligibility(50_000, 2);
    expect(r.threshold).toBe(VL_RFR_PLAFOND_PER_PART * 2);
    expect(r.eligible).toBe(true);
  });

  it('parts fiscales ≤ 0 → fallback à 1 part', () => {
    const r = calcVLEligibility(20_000, 0);
    expect(r.threshold).toBe(VL_RFR_PLAFOND_PER_PART);
  });
});

describe('calcIJ', () => {
  it('option désactivée → 0', () => {
    expect(calcIJ({ vente: 0, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 }, false)).toBe(0);
  });

  it('option activée mais pas de libéral → 0', () => {
    expect(calcIJ({ vente: 30_000, serviceBic: 20_000, liberalSsi: 0, liberalCipav: 0 }, true)).toBe(0);
  });

  it('libéral SSI uniquement', () => {
    const r = calcIJ({ vente: 0, serviceBic: 0, liberalSsi: 60_000, liberalCipav: 0 }, true);
    expect(r).toBeCloseTo(60_000 * 0.0085, 2);
  });

  it('cumul SSI + CIPAV', () => {
    const r = calcIJ({ vente: 0, serviceBic: 0, liberalSsi: 30_000, liberalCipav: 20_000 }, true);
    expect(r).toBeCloseTo(50_000 * 0.0085, 2);
  });
});

describe('isCompteProAlerte', () => {
  it('seuil 10 000 € : false en dessous', () => {
    expect(isCompteProAlerte(9_999)).toBe(false);
  });

  it('seuil 10 000 € : false à exactement 10 000 €', () => {
    expect(isCompteProAlerte(10_000)).toBe(false);
  });

  it('seuil 10 000 € : true au-dessus', () => {
    expect(isCompteProAlerte(10_001)).toBe(true);
  });
});
