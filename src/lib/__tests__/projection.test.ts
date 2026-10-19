import { describe, expect, it } from 'vitest';
import { getJoursFeries } from '~/lib/calendar';
import { calcCAYearFromEntries } from '~/lib/fiscal';
import { calcCAProjected, projectMonths, projectedMonthIndexes } from '~/lib/projection';
import { makeProfile, monthsOf } from './testUtils';

const feries2026 = getJoursFeries(2026).set;
const isJourFerie = (m: number, d: number) => feries2026.has(m * 100 + d);
const today = new Date(2026, 5, 10, 12); // 10 juin 2026

describe('projectMonths', () => {
  const profile = makeProfile({ workingDays: 19, tjm: 500 });

  it('projette les N premiers jours ouvrés (hors week-ends et fériés) des mois futurs sans saisie', () => {
    const months = monthsOf(2026, [{ workedDays: [5, 6] }]);
    const projected = projectMonths(months, profile, { year: 2026, currentMonthIndex: 5, isJourFerie, today });
    // Juillet 2026 : le 14 (mardi) est férié.
    expect(projected[6].workedDays).toEqual([1, 2, 3, 6, 7, 8, 9, 10, 13, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28]);
    expect(projected[6].halfDays).toEqual([]);
    expect(projected[5].workedDays).toHaveLength(19); // mois courant inclus
    expect(projected[0]).toBe(months[0]);
    expect(projected[2]).toBe(months[2]); // mois passé vide : pas de projection
  });

  it('ne touche pas aux mois futurs déjà saisis (jours ou forfaits)', () => {
    const months = monthsOf(2026, [
      {}, {}, {}, {}, {}, {},
      { workedDays: [1] },
      { entries: [{ kind: 'forfait', id: 'f', date: '2026-08-10', amount: 1_000 }] },
    ]);
    const projected = projectMonths(months, makeProfile({ revenueModel: 'mixed' }), { year: 2026, currentMonthIndex: 5, isJourFerie, today });
    expect(projected[6]).toBe(months[6]);
    expect(projected[7]).toBe(months[7]);
    expect(projected[8].workedDays.length).toBeGreaterThan(0);
  });

  it('ne projette rien en mode forfait ou flat', () => {
    const months = monthsOf(2026);
    for (const revenueModel of ['forfait', 'flat'] as const) {
      const projected = projectMonths(months, makeProfile({ revenueModel }), { year: 2026, currentMonthIndex: 5, isJourFerie, today });
      expect(projected.every((m, i) => m === months[i])).toBe(true);
    }
  });

  it('ne projette rien pour une année passée (même si currentMonthIndex = 11)', () => {
    const months = monthsOf(2025);
    const projected = projectMonths(months, profile, { year: 2025, currentMonthIndex: 11, today });
    expect(projected.every((m, i) => m === months[i])).toBe(true);
  });

  it('projette toute une année future', () => {
    const projected = projectMonths(monthsOf(2027), profile, { year: 2027, currentMonthIndex: 0, today });
    expect(projected.every((m) => m.workedDays.length === 19)).toBe(true);
  });

  it('utilise les fériés de l’année par défaut et ne mute pas l’entrée', () => {
    const months = monthsOf(2026);
    const projected = projectMonths(months, profile, { year: 2026, currentMonthIndex: 11, today: new Date(2026, 11, 1) });
    // Décembre 2026 : le 25 (vendredi) est férié.
    expect(projected[11].workedDays).toEqual([1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 28]);
    expect(months[11].workedDays).toEqual([]);
  });

  it('borne au nombre de jours ouvrés du mois', () => {
    const projected = projectMonths(monthsOf(2026), makeProfile({ workingDays: 40 }), { year: 2026, currentMonthIndex: 11, isJourFerie, today: new Date(2026, 11, 1) });
    expect(projected[11].workedDays).toHaveLength(22);
  });

  it('projectedMonthIndexes liste les mois extrapolés', () => {
    const months = monthsOf(2026, [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { workedDays: [2] }]);
    expect(projectedMonthIndexes(months, profile, { year: 2026, currentMonthIndex: 9, isJourFerie, today })).toEqual([9, 11]);
  });
});

describe('calcCAProjected', () => {
  it('CA saisi + extrapolation des mois futurs', () => {
    const profile = makeProfile({ workingDays: 19, tjm: 500 });
    const months = monthsOf(2026, [{ workedDays: [5, 6, 7, 8, 9, 12, 13, 14, 15, 16] }]);
    const ca = calcCAProjected(months, profile, { year: 2026, currentMonthIndex: 11, isJourFerie, today: new Date(2026, 11, 1) });
    expect(ca).toBe(10 * 500 + 19 * 500);
    expect(calcCAYearFromEntries(months, profile)).toBe(5_000);
  });
});
