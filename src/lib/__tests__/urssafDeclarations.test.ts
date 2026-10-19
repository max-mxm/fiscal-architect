import { describe, expect, it } from 'vitest';
import { buildPaymentProjections } from '~/lib/cashflow';
import { ACTIVITY_PARAMS, IJ_RATE_LIBERAL } from '~/lib/fiscal';
import { buildUrssafDeclarations } from '~/lib/urssafDeclarations';
import { flatMonths, makeProfile } from './testUtils';

const months = flatMonths(2026, Array(12).fill(10_000));

describe('buildUrssafDeclarations — mensuel', () => {
  const profile = makeProfile({ revenueModel: 'flat', declarationPeriod: 'monthly' });
  const projections = buildPaymentProjections(months, profile);
  const decls = buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 2, 10));

  it('12 périodes, CA encaissé et cotisations estimées', () => {
    expect(decls).toHaveLength(12);
    expect(decls[0]).toMatchObject({ periodicity: 'monthly', index: 0, label: 'Janvier 2026', caEncaisse: 10_000 });
    expect(decls[0].urssaf).toBeCloseTo(2_560, 6);
    expect(decls[0].total).toBeCloseTo(2_560, 6);
  });

  it('date limite : dernier jour du mois suivant', () => {
    expect(decls[0].dueDate).toEqual(new Date(2026, 1, 28, 12));
    expect(decls[1].dueDate).toEqual(new Date(2026, 2, 31, 12));
    expect(decls[11].dueDate).toEqual(new Date(2027, 0, 31, 12));
  });

  it('statut passé / en cours / à venir selon la date de référence', () => {
    expect(decls[0].status).toBe('past'); // échéance 28/02 dépassée
    expect(decls[1].status).toBe('current'); // période close, échéance 31/03 à venir
    expect(decls[2].status).toBe('upcoming'); // mars pas terminé
    const onDueDate = buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 1, 28, 20));
    expect(onDueDate[0].status).toBe('current');
  });
});

describe('buildUrssafDeclarations — encaissements décalés', () => {
  it('rattache le CA à la date d’encaissement, pas de facturation', () => {
    const profile = makeProfile({ revenueModel: 'flat', paymentDelayDays: 45, paymentDelayMode: 'net' });
    const projections = buildPaymentProjections(months, profile);
    const decls = buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 0, 1));
    expect(decls[0].caEncaisse).toBe(0);
    expect(decls[1].caEncaisse).toBe(0);
    expect(decls[2].caEncaisse).toBe(10_000); // facture du 31/01 payée le 17/03
    // Les factures de novembre et décembre sont encaissées en 2027 : hors année.
    const total = decls.reduce((s, d) => s + d.caEncaisse, 0);
    expect(total).toBe(100_000);
  });
});

describe('buildUrssafDeclarations — trimestriel', () => {
  const profile = makeProfile({ revenueModel: 'flat', declarationPeriod: 'quarterly' });
  const projections = buildPaymentProjections(months, profile);

  it('4 périodes, échéances 30/04, 31/07, 31/10 et 31/01 N+1', () => {
    const decls = buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 3, 15));
    expect(decls.map((d) => d.label)).toEqual(['T1 2026', 'T2 2026', 'T3 2026', 'T4 2026']);
    expect(decls.map((d) => d.dueDate)).toEqual([
      new Date(2026, 3, 30, 12),
      new Date(2026, 6, 31, 12),
      new Date(2026, 9, 31, 12),
      new Date(2027, 0, 31, 12),
    ]);
    expect(decls[0].caEncaisse).toBe(30_000);
    expect(decls[0].periodStart).toEqual(new Date(2026, 0, 1, 12));
    expect(decls[0].periodEnd).toEqual(new Date(2026, 2, 31, 12));
    expect(decls[0].status).toBe('current');
    expect(decls[1].status).toBe('upcoming');
    expect(buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 4, 1))[0].status).toBe('past');
  });
});

describe('buildUrssafDeclarations — cotisations', () => {
  it('URSSAF + CFP + taxe consulaire + IJ + VL − ACRE, par activité', () => {
    const profile = makeProfile({
      revenueModel: 'flat',
      cfpEnabled: true,
      taxeConsulaireEnabled: true,
      ijOption: true,
      versementLiberatoire: true,
      acreEnabled: true,
      creationDate: '2026-02-10',
      activities: [
        { id: 'svc', type: 'liberalSsi', isPrimary: true },
        { id: 'shop', type: 'vente', isPrimary: false },
      ],
    });
    const mixed = flatMonths(2026, [6_000, 6_000]).map((m, i) => (i < 2
      ? { ...m, entries: [...m.entries, { kind: 'flat' as const, id: `v${i}`, amount: 4_000, activityId: 'shop' }] }
      : m));
    // Deux montants mensuels par mois : on garde les deux (le moteur somme toutes les entries).
    const projections = buildPaymentProjections(mixed, profile);
    const [jan, feb] = buildUrssafDeclarations(projections, profile, 2026, new Date(2026, 5, 1));
    const ssi = ACTIVITY_PARAMS.liberalSsi;
    const vente = ACTIVITY_PARAMS.vente;
    const brut = 6_000 * 0.256 + 4_000 * 0.123;
    const others = 6_000 * ssi.cfpRate + 4_000 * vente.cfpRate
      + 4_000 * vente.taxeConsulaireRate
      + 6_000 * IJ_RATE_LIBERAL
      + 6_000 * ssi.tauxVL + 4_000 * vente.tauxVL;
    expect(jan.caByActivity).toMatchObject({ liberalSsi: 6_000, vente: 4_000 });
    expect(jan.acreReduction).toBe(0); // janvier : avant la création
    expect(jan.total).toBeCloseTo(brut + others, 6);
    expect(feb.acreReduction).toBeCloseTo(brut * 0.25, 6);
    expect(feb.total).toBeCloseTo(brut * 0.75 + others, 6);
    expect(feb.vl).toBeCloseTo(6_000 * ssi.tauxVL + 4_000 * vente.tauxVL, 6);
  });

  it('projections sans ventilation : imputées à l’activité primaire', () => {
    const profile = makeProfile({ activities: [{ id: 'v', type: 'vente', isPrimary: true }], urssafRate: 12.3 });
    const decls = buildUrssafDeclarations([{
      serviceMonth: 0,
      serviceYear: 2026,
      invoiceDate: new Date(2026, 0, 31, 12),
      dueDate: new Date(2026, 0, 31, 12),
      amount: 1_000,
      taxAmount: 0,
      amountTtc: 1_000,
      tvaApplies: false,
    }], profile, 2026, new Date(2026, 0, 1));
    expect(decls[0].urssaf).toBeCloseTo(123, 6);
  });
});
