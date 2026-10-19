import { describe, expect, it } from 'vitest';
import { buildPaymentProjections, type PaymentProjection } from '~/lib/cashflow';
import { calcTVAStatusMulti, calcTVAThresholdDatesMulti } from '~/lib/tvaMulti';
import type { Activity } from '~/types';
import { makeProfile, monthsOf } from './testUtils';

const ca = (v: number, services: number, activity: Activity = 'liberalSsi') => ({
  vente: v,
  serviceBic: 0,
  liberalSsi: 0,
  liberalCipav: 0,
  [activity]: services,
});

const multiProfile = makeProfile({
  activities: [
    { id: 'svc', type: 'liberalSsi', isPrimary: true },
    { id: 'shop', type: 'vente', isPrimary: false },
  ],
});

describe('calcTVAStatusMulti', () => {
  it('services seuls : seuil services', () => {
    expect(calcTVAStatusMulti(ca(0, 30_000))).toMatchObject({
      status: 'safe',
      category: 'services',
      seuil: { basique: 37_500, majore: 41_250 },
      ca: 30_000,
    });
    expect(calcTVAStatusMulti(ca(0, 40_000)).status).toBe('warning');
    expect(calcTVAStatusMulti(ca(0, 42_000, 'serviceBic')).status).toBe('breach');
  });

  it('vente seule : seuil vente sur le CA total', () => {
    expect(calcTVAStatusMulti(ca(90_000, 0))).toMatchObject({ status: 'warning', category: 'vente', ca: 90_000 });
    expect(calcTVAStatusMulti(ca(94_000, 0)).status).toBe('breach');
  });

  it('mixte : CA total au-dessus du seuil vente → warning même si les services restent sous leur seuil', () => {
    const r = calcTVAStatusMulti(ca(60_000, 30_000));
    expect(r).toMatchObject({ status: 'warning', category: 'vente', ca: 90_000, caTotal: 90_000, caServices: 30_000 });
  });

  it('mixte : part services au-dessus de son seuil → warning services', () => {
    expect(calcTVAStatusMulti(ca(20_000, 38_000))).toMatchObject({ status: 'warning', category: 'services', ca: 38_000 });
  });

  it('mixte : le pire des deux critères l’emporte', () => {
    const r = calcTVAStatusMulti(ca(50_000, 42_000));
    expect(r.status).toBe('breach');
    expect(r.category).toBe('services');
  });

  it('sans CA, choisit la catégorie selon les activités du profil', () => {
    expect(calcTVAStatusMulti(ca(0, 0), { profile: makeProfile() }).category).toBe('services');
    expect(calcTVAStatusMulti(ca(0, 0), {
      profile: makeProfile({ activities: [{ id: 'v', type: 'vente', isPrimary: true }] }),
    }).category).toBe('vente');
  });

  it('renseigne les dates de franchissement à partir des projections de factures', () => {
    const months = monthsOf(2026, Array.from({ length: 12 }, (_, i) => ({
      entries: [
        { kind: 'flat' as const, id: `s${i}`, amount: 3_000, activityId: 'svc' },
        { kind: 'forfait' as const, id: `v${i}`, date: `2026-${String(i + 1).padStart(2, '0')}-05`, amount: 6_000, activityId: 'shop' },
      ],
    })));
    const projections = buildPaymentProjections(months, { ...multiProfile, revenueModel: 'mixed' });
    const r = calcTVAStatusMulti(ca(72_000, 36_000), { profile: multiProfile, projections, year: 2026 });
    // 9 000 €/mois : > 85 000 fin octobre, > 93 500 fin novembre.
    expect(r.seuilDates.basique).toEqual(new Date(2026, 9, 31, 12));
    expect(r.seuilDates.majore).toEqual(new Date(2026, 10, 30, 12));
  });
});

describe('calcTVAThresholdDatesMulti', () => {
  it('franchissement par la part services', () => {
    const months = monthsOf(2026, Array.from({ length: 12 }, (_, i) => ({
      entries: [{ kind: 'flat' as const, id: `s${i}`, amount: 4_000 }],
    })));
    const projections = buildPaymentProjections(months, makeProfile({ revenueModel: 'flat' }));
    expect(projections[0].amountByActivity).toEqual({ vente: 0, serviceBic: 0, liberalSsi: 4_000, liberalCipav: 0 });
    const dates = calcTVAThresholdDatesMulti(projections, { year: 2026 });
    expect(dates.basique).toEqual(new Date(2026, 9, 31, 12)); // 40 000 > 37 500
    expect(dates.majore).toEqual(new Date(2026, 10, 30, 12)); // 44 000 > 41 250
  });

  it('projection sans ventilation : imputée à l’activité primaire fournie', () => {
    const projections: PaymentProjection[] = [{
      serviceMonth: 0,
      serviceYear: 2026,
      invoiceDate: new Date(2026, 0, 31, 12),
      dueDate: new Date(2026, 0, 31, 12),
      amount: 90_000,
      taxAmount: 0,
      amountTtc: 90_000,
      tvaApplies: false,
    }];
    expect(calcTVAThresholdDatesMulti(projections, { primaryActivity: 'vente' }).basique).toEqual(new Date(2026, 0, 31, 12));
    expect(calcTVAThresholdDatesMulti(projections, { primaryActivity: 'vente' }).majore).toBeNull();
    expect(calcTVAThresholdDatesMulti(projections).majore).toEqual(new Date(2026, 0, 31, 12));
  });

  it('filtre sur l’année de facturation', () => {
    const months = monthsOf(2025, Array.from({ length: 12 }, (_, i) => ({
      entries: [{ kind: 'flat' as const, id: `s${i}`, amount: 5_000 }],
    })));
    const projections = buildPaymentProjections(months, makeProfile({ revenueModel: 'flat', year: 2025 }));
    expect(calcTVAThresholdDatesMulti(projections, { year: 2026 })).toEqual({ basique: null, majore: null });
  });
});
