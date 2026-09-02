import { describe, expect, it } from 'vitest';
import {
  buildCashflowTimeline,
  calcInvoiceThresholdDate,
  calcReceiptThresholdDate,
  calculateDueDate,
  getNextPaymentProjectionIndex,
  type PaymentProjection,
} from '~/lib/cashflow';

describe('calculateDueDate', () => {
  const invoice = new Date(2026, 0, 31, 12);

  it('applique un délai net en jours calendaires', () => {
    expect(calculateDueDate(invoice, {
      days: 60,
      mode: 'net',
      endOfMonthCalculation: 'delayThenMonthEnd',
    })).toEqual(new Date(2026, 3, 1, 12));
  });

  it('calcule 45 jours puis la fin du mois', () => {
    expect(calculateDueDate(invoice, {
      days: 45,
      mode: 'endOfMonth',
      endOfMonthCalculation: 'delayThenMonthEnd',
    })).toEqual(new Date(2026, 2, 31, 12));
  });

  it('calcule fin du mois puis 45 jours', () => {
    expect(calculateDueDate(invoice, {
      days: 45,
      mode: 'endOfMonth',
      endOfMonthCalculation: 'monthEndThenDelay',
    })).toEqual(new Date(2026, 2, 17, 12));
  });
});

describe('projection des encaissements', () => {
  const projections: PaymentProjection[] = [
    {
      serviceMonth: 10,
      serviceYear: 2026,
      invoiceDate: new Date(2026, 10, 30, 12),
      dueDate: new Date(2027, 0, 29, 12),
      amount: 10_000,
    },
    {
      serviceMonth: 11,
      serviceYear: 2026,
      invoiceDate: new Date(2026, 11, 31, 12),
      dueDate: new Date(2027, 2, 1, 12),
      amount: 12_000,
    },
  ];

  it('conserve les encaissements reportés sur N+1 dans la timeline', () => {
    const timeline = buildCashflowTimeline(projections);
    expect(timeline.at(-1)).toMatchObject({ year: 2027, month: 2, cumulativeReceived: 22_000 });
  });

  it('retourne la date limite qui franchit le seuil encaissé', () => {
    expect(calcReceiptThresholdDate(projections, 15_000, 2027))
      .toEqual(new Date(2027, 2, 1, 12));
  });

  it('date la bascule TVA sur la facture qui dépasse strictement le seuil', () => {
    expect(calcInvoiceThresholdDate(projections, 10_000, 2026))
      .toEqual(new Date(2026, 11, 31, 12));
    expect(calcInvoiceThresholdDate(projections, 22_000, 2026)).toBeNull();
  });

  it('identifie la prochaine échéance, même si les projections ne sont pas triées', () => {
    const unordered = [projections[1], projections[0]];

    expect(getNextPaymentProjectionIndex(unordered, new Date(2026, 11, 15)))
      .toBe(1);
  });

  it('considère une échéance prévue aujourd’hui comme le prochain paiement', () => {
    expect(getNextPaymentProjectionIndex(projections, new Date(2027, 0, 29, 18)))
      .toBe(0);
  });

  it('ne retourne aucune échéance lorsque tous les paiements sont passés', () => {
    expect(getNextPaymentProjectionIndex(projections, new Date(2027, 3, 1)))
      .toBe(-1);
  });
});
