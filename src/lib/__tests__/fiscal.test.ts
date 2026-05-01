import { describe, expect, it } from 'vitest';
import type { CalendarMonth, UserProfile } from '~/types';
import {
  ABATTEMENT_BNC,
  SEUIL_MICRO,
  TAUX_VL_BNC,
  calcCAMensuel,
  calcCAannuel,
  calcCaRealise,
  calcChargesURSSAF,
  calcEquivDays,
  calcIR,
  calcMonthlyBreakdown,
  calcNetMicro,
  calcReserveVacances,
  calcSeuilDate,
  calcTotalChargesFixes,
  generateChartData,
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

describe('generateChartData', () => {
  it('retourne 12 entrées', () => {
    const profile: UserProfile = {
      name: 'Test',
      role: 'Dev',
      status: 'micro',
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
      status: 'micro',
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
