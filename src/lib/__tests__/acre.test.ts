import { describe, expect, it } from 'vitest';
import { calcCAByActivity, calcIJ, calcNetCumuleMulti, calcTotalChargesFixes } from '~/lib/fiscal';
import { calcAcreByMonth, calcAcreForMonth, calcNetCumuleFromMonths } from '~/lib/monthlyNet';
import { fixedCost, flatMonths, makeProfile } from './testUtils';

describe('calcAcreForMonth', () => {
  it('25 % pour une création à partir du 1er mai 2024', () => {
    const r = calcAcreForMonth(1_000, '2025-03-10', 2025, 5, true);
    expect(r).toEqual({ reduction: 250, applicable: true, rate: 0.25 });
  });

  it('50 % pour une création avant le 1er mai 2024', () => {
    const r = calcAcreForMonth(1_000, '2024-03-01', 2024, 5, true);
    expect(r.rate).toBe(0.5);
    expect(r.reduction).toBe(500);
  });

  it('création le 30 avril 2024 → 50 %, le 1er mai 2024 → 25 %', () => {
    expect(calcAcreForMonth(1_000, '2024-04-30', 2024, 6, true).rate).toBe(0.5);
    expect(calcAcreForMonth(1_000, '2024-05-01', 2024, 6, true).rate).toBe(0.25);
  });

  it('désactivée ou sans date de création → 0', () => {
    expect(calcAcreForMonth(1_000, '2025-03-10', 2025, 5, false).reduction).toBe(0);
    expect(calcAcreForMonth(1_000, null, 2025, 5, true).reduction).toBe(0);
    expect(calcAcreForMonth(1_000, '', 2025, 5, true).reduction).toBe(0);
  });

  it('couvre exactement 12 mois (référence : le 15 du mois)', () => {
    const applicable = (year: number, month: number) =>
      calcAcreForMonth(1_000, '2026-03-20', year, month, true).applicable;
    expect(applicable(2026, 2)).toBe(false); // 15 mars < 20 mars
    expect(applicable(2026, 3)).toBe(true);
    expect(applicable(2027, 2)).toBe(true); // 15 mars 2027 < 20 mars 2027
    expect(applicable(2027, 3)).toBe(false);
    let count = 0;
    for (let y = 2026; y <= 2027; y++) for (let m = 0; m < 12; m++) if (applicable(y, m)) count++;
    expect(count).toBe(12);
  });

  it('part de l’URSSAF réelle : 0 € d’URSSAF → 0 € de réduction', () => {
    expect(calcAcreForMonth(0, '2026-01-10', 2026, 4, true).reduction).toBe(0);
  });
});

describe('calcAcreByMonth', () => {
  it('calcule chaque mois sur son URSSAF brute réelle', () => {
    const profile = makeProfile({ acreEnabled: true, creationDate: '2026-06-10' });
    const months = flatMonths(2026, [5_000, 5_000, 5_000, 5_000, 5_000, 20_000, 5_000, 0, 5_000, 5_000, 5_000, 5_000]);
    const rows = calcAcreByMonth(months, profile, 2026);
    expect(rows).toHaveLength(12);
    expect(rows[4].reduction).toBe(0); // mai : avant création
    expect(rows[5].urssafBrut).toBeCloseTo(20_000 * 0.256, 6);
    expect(rows[5].reduction).toBeCloseTo(20_000 * 0.256 * 0.25, 6);
    expect(rows[7].reduction).toBe(0); // août : pas de CA
    expect(rows[8].reduction).toBeCloseTo(5_000 * 0.256 * 0.25, 6);
  });

  it('applique le taux légal aux activités secondaires', () => {
    const profile = makeProfile({
      acreEnabled: true,
      creationDate: '2026-01-05',
      activities: [
        { id: 'svc', type: 'liberalSsi', isPrimary: true },
        { id: 'shop', type: 'vente', isPrimary: false },
      ],
    });
    const months = flatMonths(2026, [10_000], 'shop');
    const rows = calcAcreByMonth(months, profile, 2026);
    expect(rows[0].urssafBrut).toBeCloseTo(10_000 * 0.123, 6);
    expect(rows[0].reduction).toBeCloseTo(10_000 * 0.123 * 0.25, 6);
  });
});

describe('calcNetCumuleFromMonths', () => {
  it('somme les réductions ACRE mois par mois (pas réduction mensuelle × mois actifs)', () => {
    const profile = makeProfile({
      acreEnabled: true,
      creationDate: '2026-06-10',
      fixedCosts: [fixedCost('a', 300)],
    });
    const months = flatMonths(2026, Array(12).fill(10_000));
    const caByActivity = calcCAByActivity(months, profile);
    // ACRE de juin à décembre seulement : 7 mois × 10 000 × 25,6 % × 25 %
    const expectedAcre = 7 * 10_000 * 0.256 * 0.25;
    const expected = calcNetCumuleMulti(profile, caByActivity, 300, 12, false, {
      acreReduction: expectedAcre,
      ijAnnuel: 0,
    });
    expect(calcNetCumuleFromMonths(months, profile)).toBe(expected);
  });

  it('intègre les parts fiscales et les IJ', () => {
    const profile = makeProfile({ partsFiscales: 2, ijOption: true });
    const months = flatMonths(2026, [12_000, 12_000, 12_000]);
    const caByActivity = calcCAByActivity(months, profile);
    const expected = calcNetCumuleMulti(profile, caByActivity, calcTotalChargesFixes(profile.fixedCosts), 3, false, {
      acreReduction: 0,
      ijAnnuel: calcIJ(caByActivity, true),
    });
    expect(calcNetCumuleFromMonths(months, profile)).toBe(expected);
    const onePart = calcNetCumuleFromMonths(months, { ...profile, partsFiscales: 1 });
    expect(calcNetCumuleFromMonths(months, profile)).toBeGreaterThan(onePart);
  });

  it('retourne 0 sans CA', () => {
    expect(calcNetCumuleFromMonths(flatMonths(2026, []), makeProfile())).toBe(0);
  });
});
