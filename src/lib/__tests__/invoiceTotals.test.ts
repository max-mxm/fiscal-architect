import { describe, expect, it } from 'vitest';
import { calcInvoiceTotals } from '~/lib/fiscal';

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
