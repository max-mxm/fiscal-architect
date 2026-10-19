import { describe, expect, it } from 'vitest';
import { buildAnnualCsv, buildAnnualRows, formatCsvNumber } from '~/lib/csvExport';
import { calcNetCumuleFromMonths } from '~/lib/monthlyNet';
import type { CalendarMonth } from '~/types';
import { fixedCost, makeProfile, monthsOf } from './testUtils';

const profile = makeProfile({
  revenueModel: 'mixed',
  tjm: 500,
  tjmByMonth: { 1: 600 },
  fixedCosts: [fixedCost('a', 300)],
  tvaAssujetti: true,
  tvaEffectiveDate: '2026-02-15',
  tvaRate: 0.2,
  activities: [
    { id: 'svc', type: 'liberalSsi', isPrimary: true },
    { id: 'shop', type: 'vente', isPrimary: false },
  ],
});

const months: CalendarMonth[] = monthsOf(2026, [
  { workedDays: [5, 6] }, // 2 j × 500
  {
    workedDays: [2],
    halfDays: [3], // 1,5 j × 600 (TJM de février)
    entries: [{ kind: 'forfait', id: 'f', date: '2026-02-20', amount: 1_000 }],
  },
  { entries: [{ kind: 'flat', id: 'fl', amount: 2_500 }] },
]);

const lines = (csv: string) => csv.split('\n');

describe('formatCsvNumber', () => {
  it('virgule décimale, sans séparateur de milliers, sans -0', () => {
    expect(formatCsvNumber(1234.5)).toBe('1234,50');
    expect(formatCsvNumber(-0.001)).toBe('0,00');
    expect(formatCsvNumber(-12.346)).toBe('-12,35');
    expect(formatCsvNumber(18, 'days')).toBe('18');
    expect(formatCsvNumber(18.5, 'days')).toBe('18,5');
  });
});

describe('buildAnnualCsv', () => {
  const csv = buildAnnualCsv(months, profile, 2026);

  it('en-tête, 12 mois puis une ligne Total, séparateur ;', () => {
    const rows = lines(csv);
    expect(rows[0]).toBe('Mois;Jours travaillés;CA HT;TVA collectée;Facturé TTC;URSSAF et contributions;Impôt estimé;Charges fixes;Net');
    expect(rows).toHaveLength(14);
    expect(rows[1].startsWith('Janvier;')).toBe(true);
    expect(rows[12].startsWith('Décembre;')).toBe(true);
    expect(rows[13].startsWith('Total;')).toBe(true);
  });

  it('jours au TJM du mois, forfaits et montants mensuels réels ; TVA à partir de sa date d’effet', () => {
    const rows = lines(csv).map((l) => l.split(';'));
    expect(rows[1].slice(0, 6)).toEqual(['Janvier', '2', '1000,00', '0,00', '1000,00', '256,00']);
    expect(rows[2].slice(0, 6)).toEqual(['Février', '1,5', '1900,00', '380,00', '2280,00', '486,40']);
    expect(rows[3].slice(0, 6)).toEqual(['Mars', '0', '2500,00', '500,00', '3000,00', '640,00']);
    expect(rows[4]).toEqual(['Avril', '0', '0,00', '0,00', '0,00', '0,00', '0,00', '0,00', '0,00']);
  });

  it('la ligne Total somme les colonnes et son net égale le net cumulé', () => {
    const total = lines(csv)[13].split(';');
    expect(total.slice(0, 6)).toEqual(['Total', '3,5', '5400,00', '880,00', '6280,00', '1382,40']);
    expect(total[6]).toBe('73,00'); // IR provisionné au rythme annualisé
    expect(total[7]).toBe('900,00'); // charges fixes des 3 mois avec revenu
    const net = Number(total[8].replace(',', '.'));
    expect(net).toBeCloseTo(3_044.6, 2);
    expect(Math.abs(net - calcNetCumuleFromMonths(months, profile))).toBeLessThanOrEqual(0.5);
  });

  it('URSSAF par activité (taux légal pour la vente secondaire)', () => {
    const withShop = monthsOf(2026, [{ entries: [{ kind: 'flat', id: 'x', amount: 1_000, activityId: 'shop' }] }]);
    const row = lines(buildAnnualCsv(withShop, profile, 2026))[1].split(';');
    expect(row[5]).toBe('123,00');
  });

  it('VL : impôt mensuel = CA × taux VL', () => {
    const row = lines(buildAnnualCsv(months, { ...profile, versementLiberatoire: true }, 2026))[2].split(';');
    expect(row[6]).toBe('41,80'); // 1 900 × 2,2 %
  });

  it('accepte des mois manquants ou dans le désordre', () => {
    const partial = [months[2], months[0]];
    const rows = buildAnnualRows(partial, profile, 2026);
    expect(rows.rows).toHaveLength(12);
    expect(rows.rows[1].caHT).toBe(0);
    expect(rows.total.caHT).toBe(3_500);
  });

  it('résumé optionnel des paramètres, champs texte échappés', () => {
    const out = buildAnnualCsv(months, { ...profile, name: 'Dupont; "Max"' }, 2026, { includeSummary: true });
    expect(out).toContain('\nProfil;"Dupont; ""Max"""');
    expect(out).toContain('\nAnnée;2026');
    expect(out).toContain('\nParts fiscales;1');
    const injected = buildAnnualCsv(months, { ...profile, name: '=HYPERLINK("x")' }, 2026, { includeSummary: true });
    expect(injected).toContain("\nProfil;\"'=HYPERLINK(\"\"x\"\")\"");
  });
});
