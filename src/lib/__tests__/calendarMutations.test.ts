import { describe, expect, it } from 'vitest';
import type { CalendarMonth } from '~/types';
import {
  clearMonthInMonths,
  cycleDayInMonths,
  dragSetDayInMonths,
  fillAllInMonths,
  fillMonthInMonths,
} from '~/lib/calendarMutations';
import { getJoursFeries, isWeekend } from '~/lib/calendar';

const YEAR = 2025;
const { set: feriesSet } = getJoursFeries(YEAR);
const isFerie = (monthIndex: number, day: number) => feriesSet.has(monthIndex * 100 + day);
const noFerie = () => false;

const emptyMonths = (year: number = YEAR): CalendarMonth[] =>
  Array.from({ length: 12 }, (_, i) => ({ month: i, year, workedDays: [], halfDays: [] }));

describe('cycleDayInMonths', () => {
  it('vide → plein', () => {
    // 6 janvier 2025 = lundi, non férié
    const result = cycleDayInMonths(emptyMonths(), YEAR, 0, 6, false, noFerie);
    expect(result[0].workedDays).toEqual([6]);
    expect(result[0].halfDays).toEqual([]);
  });

  it('plein → demi', () => {
    const start = emptyMonths();
    start[0].workedDays = [6];
    const result = cycleDayInMonths(start, YEAR, 0, 6, false, noFerie);
    expect(result[0].workedDays).toEqual([]);
    expect(result[0].halfDays).toEqual([6]);
  });

  it('demi → vide', () => {
    const start = emptyMonths();
    start[0].halfDays = [6];
    const result = cycleDayInMonths(start, YEAR, 0, 6, false, noFerie);
    expect(result[0].workedDays).toEqual([]);
    expect(result[0].halfDays).toEqual([]);
  });

  it('cycle complet vide → plein → demi → vide', () => {
    let m = emptyMonths();
    m = cycleDayInMonths(m, YEAR, 0, 6, false, noFerie);
    m = cycleDayInMonths(m, YEAR, 0, 6, false, noFerie);
    m = cycleDayInMonths(m, YEAR, 0, 6, false, noFerie);
    expect(m[0].workedDays).toEqual([]);
    expect(m[0].halfDays).toEqual([]);
  });

  it('ignore un jour de weekend', () => {
    // 4 janvier 2025 = samedi
    const result = cycleDayInMonths(emptyMonths(), YEAR, 0, 4, false, noFerie);
    expect(result[0].workedDays).toEqual([]);
  });

  it('ignore un jour férié sans force', () => {
    // 1er janvier 2025 = férié
    const result = cycleDayInMonths(emptyMonths(), YEAR, 0, 1, false, isFerie);
    expect(result[0].workedDays).toEqual([]);
  });

  it('applique sur un férié avec force=true', () => {
    const result = cycleDayInMonths(emptyMonths(), YEAR, 0, 1, true, isFerie);
    expect(result[0].workedDays).toEqual([1]);
  });

  it('garde les workedDays triés', () => {
    let m = emptyMonths();
    m = cycleDayInMonths(m, YEAR, 0, 10, false, noFerie);
    m = cycleDayInMonths(m, YEAR, 0, 3, false, noFerie);
    m = cycleDayInMonths(m, YEAR, 0, 7, false, noFerie);
    expect(m[0].workedDays).toEqual([3, 7, 10]);
  });

  it('ne touche pas les autres mois', () => {
    let m = emptyMonths();
    m = cycleDayInMonths(m, YEAR, 0, 6, false, noFerie);
    expect(m[1].workedDays).toEqual([]);
    expect(m[5].workedDays).toEqual([]);
  });
});

describe('dragSetDayInMonths', () => {
  it('add depuis vide → plein', () => {
    const result = dragSetDayInMonths(emptyMonths(), YEAR, 0, 6, true, noFerie);
    expect(result[0].workedDays).toEqual([6]);
  });

  it('add depuis demi → plein (et nettoie halfDays)', () => {
    const start = emptyMonths();
    start[0].halfDays = [6];
    const result = dragSetDayInMonths(start, YEAR, 0, 6, true, noFerie);
    expect(result[0].workedDays).toEqual([6]);
    expect(result[0].halfDays).toEqual([]);
  });

  it('add est idempotent depuis plein', () => {
    const start = emptyMonths();
    start[0].workedDays = [6];
    const result = dragSetDayInMonths(start, YEAR, 0, 6, true, noFerie);
    expect(result[0].workedDays).toEqual([6]);
  });

  it('remove depuis plein → vide', () => {
    const start = emptyMonths();
    start[0].workedDays = [6];
    const result = dragSetDayInMonths(start, YEAR, 0, 6, false, noFerie);
    expect(result[0].workedDays).toEqual([]);
  });

  it('remove depuis demi → vide', () => {
    const start = emptyMonths();
    start[0].halfDays = [6];
    const result = dragSetDayInMonths(start, YEAR, 0, 6, false, noFerie);
    expect(result[0].halfDays).toEqual([]);
  });

  it('remove est no-op depuis vide', () => {
    const start = emptyMonths();
    const result = dragSetDayInMonths(start, YEAR, 0, 6, false, noFerie);
    expect(result[0]).toEqual(start[0]);
  });

  it('ignore weekend', () => {
    const result = dragSetDayInMonths(emptyMonths(), YEAR, 0, 4, true, noFerie);
    expect(result[0].workedDays).toEqual([]);
  });

  it('ignore un férié même avec add=true', () => {
    const result = dragSetDayInMonths(emptyMonths(), YEAR, 0, 1, true, isFerie);
    expect(result[0].workedDays).toEqual([]);
  });
});

describe('fillMonthInMonths', () => {
  it('remplit tous les jours ouvrés du mois', () => {
    const result = fillMonthInMonths(emptyMonths(), YEAR, 0, isFerie);
    const days = result[0].workedDays;
    // Janvier 2025 : 31 jours, weekends + jour de l'An (1) + ?
    // Comptons à la main : 1er janvier (mer) férié, sam/dim weekends.
    // Vérifions que les samedis/dimanches/fériés sont exclus
    for (const d of days) {
      expect(isWeekend(YEAR, 0, d)).toBe(false);
      expect(isFerie(0, d)).toBe(false);
    }
    // Et vérifions qu'aucun jour ouvré n'est manquant
    for (let d = 1; d <= 31; d++) {
      const ouvre = !isWeekend(YEAR, 0, d) && !isFerie(0, d);
      if (ouvre) expect(days).toContain(d);
    }
  });

  it('vide les halfDays', () => {
    const start = emptyMonths();
    start[0].halfDays = [10, 20];
    const result = fillMonthInMonths(start, YEAR, 0, isFerie);
    expect(result[0].halfDays).toEqual([]);
  });

  it('ne modifie que le mois ciblé', () => {
    const result = fillMonthInMonths(emptyMonths(), YEAR, 5, isFerie);
    expect(result[0].workedDays).toEqual([]);
    expect(result[5].workedDays.length).toBeGreaterThan(0);
  });
});

describe('fillAllInMonths', () => {
  it('remplit les 12 mois', () => {
    const result = fillAllInMonths(emptyMonths(), YEAR, isFerie);
    expect(result.every((m) => m.workedDays.length > 0)).toBe(true);
  });

  it('exclut les fériés et weekends partout', () => {
    const result = fillAllInMonths(emptyMonths(), YEAR, isFerie);
    for (const m of result) {
      for (const d of m.workedDays) {
        expect(isWeekend(YEAR, m.month, d)).toBe(false);
        expect(isFerie(m.month, d)).toBe(false);
      }
    }
  });
});

describe('clearMonthInMonths', () => {
  it('vide workedDays et halfDays du mois ciblé', () => {
    const start = emptyMonths();
    start[3].workedDays = [1, 2, 3];
    start[3].halfDays = [10];
    const result = clearMonthInMonths(start, 3);
    expect(result[3].workedDays).toEqual([]);
    expect(result[3].halfDays).toEqual([]);
  });

  it('ne touche pas les autres mois', () => {
    const start = emptyMonths();
    start[3].workedDays = [1, 2];
    start[5].workedDays = [10, 11];
    const result = clearMonthInMonths(start, 3);
    expect(result[5].workedDays).toEqual([10, 11]);
  });
});
