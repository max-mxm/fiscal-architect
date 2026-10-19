import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_PARAMS,
  calcIR,
  calcMonthlyBreakdown,
  calcNetCumuleMulti,
  calcNetMicro,
  calcNetMicroMulti,
  generateChartData,
} from '~/lib/fiscal';
import { makeProfile } from './testUtils';

const ssi = ACTIVITY_PARAMS.liberalSsi;
const caSsi = (ca: number) => ({ vente: 0, serviceBic: 0, liberalSsi: ca, liberalCipav: 0 });

describe('IR au quotient familial (parts fiscales)', () => {
  it('calcNetMicro applique opts.parts au barème', () => {
    const result = calcNetMicro(100_000, 25.6, 0, false, { abattement: ssi.abattement, parts: 2 });
    expect(result.ir).toBe(calcIR(100_000 * (1 - ssi.abattement), 2));
  });

  it('calcNetMicro reste à 1 part par défaut (rétrocompatible)', () => {
    const result = calcNetMicro(100_000, 25.6, 0, false, { abattement: ssi.abattement });
    expect(result.ir).toBe(calcIR(100_000 * (1 - ssi.abattement)));
  });

  it('calcMonthlyBreakdown annualise puis applique les parts', () => {
    const monthly = calcMonthlyBreakdown(10_000, 25.6, 0, false, { abattement: ssi.abattement, parts: 2.5 });
    expect(monthly.ir).toBeCloseTo(calcIR(120_000 * (1 - ssi.abattement), 2.5) / 12, 6);
  });

  it('calcNetMicroMulti lit profile.partsFiscales', () => {
    const profile = makeProfile({ partsFiscales: 2 });
    const result = calcNetMicroMulti(profile, caSsi(100_000), 0, false);
    expect(result.ir).toBe(calcIR(100_000 * (1 - ssi.abattement), 2));
  });

  it('calcNetMicroMulti : opts.parts prime sur le profil', () => {
    const profile = makeProfile({ partsFiscales: 2 });
    const result = calcNetMicroMulti(profile, caSsi(100_000), 0, false, { parts: 3 });
    expect(result.ir).toBe(calcIR(100_000 * (1 - ssi.abattement), 3));
  });

  it('calcNetMicroMulti : parts invalides → 1 part', () => {
    const profile = makeProfile({ partsFiscales: 0 });
    const result = calcNetMicroMulti(profile, caSsi(100_000), 0, false);
    expect(result.ir).toBe(calcIR(100_000 * (1 - ssi.abattement), 1));
  });

  it('le VL ne dépend pas des parts', () => {
    const one = calcNetMicroMulti(makeProfile({ partsFiscales: 1 }), caSsi(60_000), 0, true);
    const three = calcNetMicroMulti(makeProfile({ partsFiscales: 3 }), caSsi(60_000), 0, true);
    expect(three.ir).toBeCloseTo(one.ir, 6);
  });

  it('calcNetCumuleMulti : un mois à 2 parts = sa fiche mensuelle à 2 parts', () => {
    const profile = makeProfile({ partsFiscales: 2 });
    const monthly = calcMonthlyBreakdown(11_000, profile.urssafRate, 0, false, { abattement: ssi.abattement, parts: 2 });
    const cumulative = calcNetCumuleMulti(profile, caSsi(11_000), 0, 1, false);
    expect(cumulative).toBe(Math.round(monthly.net));
  });

  it('calcNetCumuleMulti : 2 parts donnent un net supérieur à 1 part', () => {
    const one = calcNetCumuleMulti(makeProfile({ partsFiscales: 1 }), caSsi(66_000), 0, 6, false);
    const two = calcNetCumuleMulti(makeProfile({ partsFiscales: 2 }), caSsi(66_000), 0, 6, false);
    expect(two).toBeGreaterThan(one);
  });

  it('generateChartData utilise les parts du profil', () => {
    const one = generateChartData(makeProfile({ tjm: 800, workingDays: 20, partsFiscales: 1 }));
    const two = generateChartData(makeProfile({ tjm: 800, workingDays: 20, partsFiscales: 2 }));
    expect(two[0].net).toBeGreaterThan(one[0].net);
    const expectedIR = calcIR(800 * 20 * 12 * (1 - ssi.abattement), 2) / 12;
    const expectedNet = 800 * 20 - 800 * 20 * 0.256 - expectedIR;
    expect(two[0].net).toBe(Math.round(expectedNet));
  });
});
