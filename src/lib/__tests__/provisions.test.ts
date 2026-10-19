import { describe, expect, it } from 'vitest';
import { calcCaRealiseFromEntries, calcCAYearFromEntries, calcIR } from '~/lib/fiscal';
import { calcCAProjected, monthsThroughDate } from '~/lib/projection';
import { calcProvisions } from '~/lib/provisions';
import { calcVLRegularization } from '~/lib/vlRegularization';
import { flatMonths, makeProfile, monthsOf } from './testUtils';

const ref = new Date(2026, 5, 15, 12); // 15 juin 2026
const months = flatMonths(2026, Array(12).fill(10_000));

describe('monthsThroughDate', () => {
  it('reproduit le CA réalisé de calcCaRealiseFromEntries', () => {
    const profile = makeProfile({ revenueModel: 'mixed' });
    const sample = monthsOf(2026, [
      { workedDays: [5, 6] },
      {}, {}, {}, {},
      {
        workedDays: [1, 2, 16, 17],
        halfDays: [3, 18],
        entries: [
          { kind: 'forfait', id: 'a', date: '2026-06-10', amount: 1_000 },
          { kind: 'forfait', id: 'b', date: '2026-06-20', amount: 2_000 },
          { kind: 'flat', id: 'c', amount: 3_000 },
        ],
      },
      { workedDays: [1, 2] },
    ]);
    const truncated = monthsThroughDate(sample, 5, 15);
    expect(calcCAYearFromEntries(truncated, profile)).toBeCloseTo(
      calcCaRealiseFromEntries(sample, profile, 5, 15).caRealise,
      6,
    );
    expect(truncated[6].workedDays).toEqual([]);
    expect(sample[5].workedDays).toEqual([1, 2, 16, 17]); // pas de mutation
  });
});

describe('calcProvisions', () => {
  it('à date (réalisé) vs fin d’année : CA, URSSAF, impôt au barème avec parts', () => {
    const profile = makeProfile({ revenueModel: 'flat', partsFiscales: 2 });
    const p = calcProvisions(months, profile, { year: 2026, referenceDate: ref });
    expect(p.aDate.caHT).toBeCloseTo(55_000, 6); // 5 mois + 15/30 de juin
    expect(p.finAnnee.caHT).toBe(120_000);
    expect(p.finAnnee.urssafEtContributions).toBeCloseTo(120_000 * 0.256, 6);
    expect(p.aDate.urssafEtContributions).toBeCloseTo(55_000 * 0.256, 6);
    const irAnnuel = calcIR(120_000 * 0.66, 2);
    expect(p.finAnnee.impot).toBe(irAnnuel);
    expect(p.finAnnee.impotMode).toBe('bareme');
    expect(p.aDate.impot).toBeCloseTo(irAnnuel * 55 / 120, 6);
    expect(p.finAnnee.total).toBeCloseTo(p.finAnnee.urssafEtContributions + p.finAnnee.impot, 6);
  });

  it('TVA collectée à reverser : factures soumises (à date = factures émises)', () => {
    const profile = makeProfile({ revenueModel: 'flat', tvaAssujetti: true, tvaEffectiveDate: '2026-04-01', tvaRate: 0.2 });
    const p = calcProvisions(months, profile, { year: 2026, referenceDate: ref });
    expect(p.finAnnee.tvaCollectee).toBeCloseTo(9 * 2_000, 6);
    expect(p.aDate.tvaCollectee).toBeCloseTo(2 * 2_000, 6); // factures d'avril et mai
  });

  it('VL actif et RFR trop élevé : impôt = VL + régularisation estimée', () => {
    const profile = makeProfile({ revenueModel: 'flat', versementLiberatoire: true, rfrN2: 100_000 });
    const p = calcProvisions(months, profile, { year: 2026, referenceDate: ref });
    expect(p.vlRegularizationNeeded).toBe(true);
    expect(p.vlEligibility.motif).toBe('rfr-too-high');
    expect(p.finAnnee.impotMode).toBe('vl');
    expect(p.finAnnee.impot).toBeCloseTo(120_000 * 0.022, 6);
    const expected = calcVLRegularization(months, profile, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).amountToProvision;
    expect(p.finAnnee.regularisationVL).toBeCloseTo(expected, 6);
    expect(p.finAnnee.regularisationVL).toBeGreaterThan(0);
    expect(p.aDate.regularisationVL).toBeGreaterThan(0);
    expect(p.aDate.regularisationVL).toBeLessThan(p.finAnnee.regularisationVL);
  });

  it('VL éligible ou RFR inconnu : pas de régularisation', () => {
    const eligible = calcProvisions(months, makeProfile({ revenueModel: 'flat', versementLiberatoire: true, rfrN2: 20_000 }), { year: 2026, referenceDate: ref });
    expect(eligible.finAnnee.regularisationVL).toBe(0);
    const unknown = calcProvisions(months, makeProfile({ revenueModel: 'flat', versementLiberatoire: true, rfrN2: null }), { year: 2026, referenceDate: ref });
    expect(unknown.vlRegularizationNeeded).toBe(false);
    expect(unknown.finAnnee.regularisationVL).toBe(0);
  });

  it('fin d’année intègre la projection des mois futurs (mode days)', () => {
    const profile = makeProfile({ revenueModel: 'days', workingDays: 19, tjm: 500 });
    const entered = monthsOf(2026, [{ workedDays: [5, 6, 7] }]);
    const p = calcProvisions(entered, profile, { year: 2026, referenceDate: ref });
    expect(p.aDate.caHT).toBe(1_500);
    expect(p.finAnnee.caHT).toBe(calcCAProjected(entered, profile, { year: 2026, currentMonthIndex: 5, today: ref }));
  });

  it('ACRE sommée mois par mois', () => {
    const profile = makeProfile({ revenueModel: 'flat', acreEnabled: true, creationDate: '2026-06-10' });
    const p = calcProvisions(months, profile, { year: 2026, referenceDate: ref });
    expect(p.finAnnee.acreReduction).toBeCloseTo(7 * 10_000 * 0.256 * 0.25, 6);
    expect(p.aDate.acreReduction).toBeCloseTo(5_000 * 0.256 * 0.25, 6); // demi-juin
  });

  it('année passée : tout est réalisé ; année future : rien n’est réalisé', () => {
    const past = calcProvisions(flatMonths(2025, Array(12).fill(10_000)), makeProfile({ revenueModel: 'flat', year: 2025 }), { year: 2025, referenceDate: ref });
    expect(past.aDate.caHT).toBe(120_000);
    expect(past.aDate.total).toBeCloseTo(past.finAnnee.total, 6);
    const future = calcProvisions(flatMonths(2027, Array(12).fill(10_000)), makeProfile({ revenueModel: 'flat', year: 2027 }), { year: 2027, referenceDate: ref });
    expect(future.aDate.caHT).toBe(0);
    expect(future.aDate.total).toBe(0);
    expect(future.finAnnee.caHT).toBe(120_000);
  });
});
