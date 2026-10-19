import { describe, expect, it } from 'vitest';
import { ACTIVITY_PARAMS, IJ_RATE_LIBERAL, calcIR, calcMonthlyBreakdown } from '~/lib/fiscal';
import { calcCalendarMonthBreakdown, calcMonthlyBreakdownMulti } from '~/lib/monthlyNet';
import type { UserProfile } from '~/types';
import { fixedCost, makeProfile } from './testUtils';

const ssi = ACTIVITY_PARAMS.liberalSsi;
const vente = ACTIVITY_PARAMS.vente;
const ca = (liberalSsi: number, v = 0) => ({ vente: v, serviceBic: 0, liberalSsi, liberalCipav: 0 });

const multi = (overrides: Partial<UserProfile> = {}) => makeProfile({
  activities: [
    { id: 'svc', type: 'liberalSsi', isPrimary: true },
    { id: 'shop', type: 'vente', isPrimary: false },
  ],
  ...overrides,
});

describe('calcMonthlyBreakdownMulti', () => {
  it('mono-activité : identique à calcMonthlyBreakdown', () => {
    const profile = makeProfile({ fixedCosts: [fixedCost('a', 400)] });
    const legacy = calcMonthlyBreakdown(8_000, profile.urssafRate, 400, false, {
      abattement: ssi.abattement,
      tauxVL: ssi.tauxVL,
    });
    const result = calcMonthlyBreakdownMulti(ca(8_000), profile);
    expect(result.ca).toBe(8_000);
    expect(result.urssaf).toBeCloseTo(legacy.urssaf, 6);
    expect(result.ir).toBeCloseTo(legacy.ir, 6);
    expect(result.chargesFixes).toBe(400);
    expect(result.net).toBeCloseTo(legacy.net, 6);
    expect(result.ij).toBe(0);
  });

  it('URSSAF par activité : taux du profil pour la primaire, taux légal pour les autres', () => {
    const profile = multi({ urssafRate: 24 });
    const result = calcMonthlyBreakdownMulti(ca(6_000, 4_000), profile);
    expect(result.urssaf).toBeCloseTo(6_000 * 0.24 + 4_000 * 0.123, 6);
    expect(result.byActivity).toHaveLength(2);
    const shop = result.byActivity.find((b) => b.activity === 'vente');
    expect(shop?.urssafRate).toBe(12.3);
    expect(shop?.urssaf).toBeCloseTo(4_000 * 0.123, 6);
  });

  it('IR au barème annualisé (×12 puis ÷12) sur le revenu imposable global', () => {
    const result = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi());
    const ri = 6_000 * (1 - ssi.abattement) + 4_000 * (1 - vente.abattement);
    expect(result.revenuImposable).toBeCloseTo(ri, 6);
    expect(result.ir).toBeCloseTo(calcIR(ri * 12) / 12, 6);
    expect(result.irMode).toBe('bareme');
  });

  it('applique les parts fiscales du profil', () => {
    const result = calcMonthlyBreakdownMulti(ca(10_000), makeProfile({ partsFiscales: 2 }));
    expect(result.ir).toBeCloseTo(calcIR(10_000 * 12 * (1 - ssi.abattement), 2) / 12, 6);
  });

  it('VL ventilé par activité', () => {
    const result = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi({ versementLiberatoire: true }));
    expect(result.ir).toBeCloseTo(6_000 * ssi.tauxVL + 4_000 * vente.tauxVL, 6);
    expect(result.irMode).toBe('vl');
  });

  it('CFP et taxe consulaire seulement si activées', () => {
    const off = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi());
    expect(off.cfp).toBe(0);
    expect(off.taxeConsulaire).toBe(0);
    const on = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi({ cfpEnabled: true, taxeConsulaireEnabled: true }));
    expect(on.cfp).toBeCloseTo(6_000 * ssi.cfpRate + 4_000 * vente.cfpRate, 6);
    expect(on.taxeConsulaire).toBeCloseTo(4_000 * vente.taxeConsulaireRate, 6);
  });

  it('IJ libérales si ijOption (pas sur la vente)', () => {
    const result = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi({ ijOption: true }));
    expect(result.ij).toBeCloseTo(6_000 * IJ_RATE_LIBERAL, 6);
    const noIJ = calcMonthlyBreakdownMulti(ca(6_000, 4_000), multi());
    expect(noIJ.net - result.net).toBeCloseTo(result.ij, 6);
  });

  it('ACRE calculée sur l’URSSAF réelle du mois quand la période est fournie', () => {
    const profile = multi({ acreEnabled: true, creationDate: '2026-03-10' });
    const june = calcMonthlyBreakdownMulti(ca(6_000, 4_000), profile, { year: 2026, month: 5 });
    const brut = 6_000 * 0.256 + 4_000 * 0.123;
    expect(june.urssafBrut).toBeCloseTo(brut, 6);
    expect(june.acreReduction).toBeCloseTo(brut * 0.25, 6);
    expect(june.acreRate).toBe(0.25);
    expect(june.urssaf).toBeCloseTo(brut * 0.75, 6);
    const feb = calcMonthlyBreakdownMulti(ca(6_000, 4_000), profile, { year: 2026, month: 1 });
    expect(feb.acreReduction).toBe(0);
    const noPeriod = calcMonthlyBreakdownMulti(ca(6_000, 4_000), profile);
    expect(noPeriod.acreReduction).toBe(0);
  });

  it('acreReduction explicite prioritaire et bornée par l’URSSAF brute', () => {
    const r = calcMonthlyBreakdownMulti(ca(1_000), makeProfile(), { acreReduction: 10_000 });
    expect(r.acreReduction).toBeCloseTo(256, 6);
    expect(r.urssaf).toBeCloseTo(0, 6);
  });

  it('charges fixes surchargeables, net et taux net', () => {
    const r = calcMonthlyBreakdownMulti(ca(0), makeProfile({ fixedCosts: [fixedCost('a', 300)] }));
    expect(r.net).toBe(-300);
    expect(r.tauxNet).toBe(0);
    const zero = calcMonthlyBreakdownMulti(ca(5_000), makeProfile({ fixedCosts: [fixedCost('a', 300)] }), { chargesFixes: 0 });
    expect(zero.chargesFixes).toBe(0);
    expect(zero.contributions).toBeCloseTo(zero.urssaf + zero.cfp + zero.taxeConsulaire + zero.ij, 6);
    expect(zero.net).toBeCloseTo(5_000 - zero.contributions - zero.ir, 6);
  });
});

describe('calcCalendarMonthBreakdown', () => {
  it('ventile le CA réel du mois (jours au TJM du mois + forfaits par activité)', () => {
    const profile = multi({
      revenueModel: 'mixed',
      tjm: 500,
      tjmByMonth: { 5: 600 },
      acreEnabled: true,
      creationDate: '2026-01-02',
    });
    const month = {
      month: 5,
      year: 2026,
      workedDays: [1, 2, 3],
      halfDays: [4],
      entries: [{ kind: 'forfait' as const, id: 'f', date: '2026-06-10', amount: 2_000, activityId: 'shop' }],
    };
    const r = calcCalendarMonthBreakdown(month, profile, 2026);
    expect(r.ca).toBeCloseTo(3.5 * 600 + 2_000, 6);
    expect(r.byActivity.find((b) => b.activity === 'liberalSsi')?.ca).toBeCloseTo(3.5 * 600, 6);
    expect(r.byActivity.find((b) => b.activity === 'vente')?.ca).toBe(2_000);
    expect(r.acreReduction).toBeCloseTo(r.urssafBrut * 0.25, 6);
  });
});
