import { describe, expect, it } from 'vitest';
import { calcInvoiceTotals, isTVAApplicableOn } from '~/lib/fiscal';

describe('calcInvoiceTotals', () => {
  it('laisse une facture en HT lorsque la TVA est inactive', () => {
    expect(calcInvoiceTotals(650, false, 0.2)).toEqual({ ht: 650, tva: 0, ttc: 650 });
  });

  it('ventile une facture HT, TVA et TTC au taux configuré', () => {
    expect(calcInvoiceTotals(650, true, 0.2)).toEqual({ ht: 650, tva: 130, ttc: 780 });
  });

  it('arrondit la TVA au centime et borne un taux invalide', () => {
    expect(calcInvoiceTotals(99.99, true, 0.055)).toEqual({ ht: 99.99, tva: 5.5, ttc: 105.49 });
    expect(calcInvoiceTotals(100, true, 2)).toEqual({ ht: 100, tva: 100, ttc: 200 });
  });
});

describe('isTVAApplicableOn', () => {
  const profile = { tvaAssujetti: true, tvaEffectiveDate: '2026-05-01' };

  it('n’applique la TVA qu’à partir de la date d’effet, incluse', () => {
    expect(isTVAApplicableOn(profile, new Date(2026, 3, 30, 12))).toBe(false);
    expect(isTVAApplicableOn(profile, new Date(2026, 4, 1, 12))).toBe(true);
  });

  it('ne l’applique jamais lorsque la franchise est active', () => {
    expect(isTVAApplicableOn({ tvaAssujetti: false, tvaEffectiveDate: '2026-01-01' }, new Date(2026, 11, 31, 12))).toBe(false);
  });
});
