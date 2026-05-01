import { describe, expect, it } from 'vitest';
import {
  createEmptyFiscalYear,
  formatDateFR,
  formatDaysFR,
  getDaysInMonth,
  getFirstDayOffset,
  getJoursFeries,
  isWeekend,
  MONTH_NAMES,
} from '~/lib/calendar';

describe('createEmptyFiscalYear', () => {
  it('crée 12 mois vides', () => {
    const fy = createEmptyFiscalYear(2025);
    expect(fy.year).toBe(2025);
    expect(fy.months).toHaveLength(12);
    expect(fy.months.every((m) => m.workedDays.length === 0 && m.halfDays?.length === 0)).toBe(true);
  });

  it('indexe les mois de 0 à 11', () => {
    const fy = createEmptyFiscalYear(2025);
    expect(fy.months.map((m) => m.month)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('propage l\'année sur chaque mois', () => {
    const fy = createEmptyFiscalYear(2030);
    expect(fy.months.every((m) => m.year === 2030)).toBe(true);
  });
});

describe('getDaysInMonth', () => {
  it('janvier a 31 jours', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31);
  });

  it('avril a 30 jours', () => {
    expect(getDaysInMonth(2025, 3)).toBe(30);
  });

  it('février a 28 jours en année non bissextile', () => {
    expect(getDaysInMonth(2025, 1)).toBe(28);
  });

  it('février a 29 jours en année bissextile', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getDaysInMonth(2000, 1)).toBe(29); // règle des 400
  });

  it('année séculaire non multiple de 400 : 28 jours', () => {
    expect(getDaysInMonth(1900, 1)).toBe(28);
  });
});

describe('getFirstDayOffset', () => {
  it('retourne un offset entre 0 (lundi) et 6 (dimanche)', () => {
    for (let m = 0; m < 12; m++) {
      const offset = getFirstDayOffset(2025, m);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(6);
    }
  });

  it('1er janvier 2024 est un lundi (offset 0)', () => {
    expect(getFirstDayOffset(2024, 0)).toBe(0);
  });

  it('1er février 2026 est un dimanche (offset 6)', () => {
    expect(getFirstDayOffset(2026, 1)).toBe(6);
  });
});

describe('isWeekend', () => {
  it('samedi est weekend', () => {
    // 4 janvier 2025 = samedi
    expect(isWeekend(2025, 0, 4)).toBe(true);
  });

  it('dimanche est weekend', () => {
    // 5 janvier 2025 = dimanche
    expect(isWeekend(2025, 0, 5)).toBe(true);
  });

  it('lundi n\'est pas weekend', () => {
    // 6 janvier 2025 = lundi
    expect(isWeekend(2025, 0, 6)).toBe(false);
  });

  it('vendredi n\'est pas weekend', () => {
    // 3 janvier 2025 = vendredi
    expect(isWeekend(2025, 0, 3)).toBe(false);
  });
});

describe('getJoursFeries', () => {
  it('inclut les fériés fixes français', () => {
    const { names } = getJoursFeries(2025);
    const allNames = Array.from(names.values());
    expect(allNames).toContain('Jour de l\'An');
    expect(allNames).toContain('Fête du Travail');
    expect(allNames).toContain('Victoire 1945');
    expect(allNames).toContain('Fête nationale');
    expect(allNames).toContain('Assomption');
    expect(allNames).toContain('Toussaint');
    expect(allNames).toContain('Armistice');
    expect(allNames).toContain('Noël');
  });

  it('place le 1er janvier, le 14 juillet et le 25 décembre aux bonnes dates', () => {
    const { set, names } = getJoursFeries(2025);
    expect(set.has(0 * 100 + 1)).toBe(true); // Jour de l'An
    expect(names.get(0 * 100 + 1)).toBe('Jour de l\'An');

    expect(set.has(6 * 100 + 14)).toBe(true); // Fête nationale
    expect(set.has(11 * 100 + 25)).toBe(true); // Noël
  });

  it('calcule Pâques 2025 (Lundi de Pâques = 21 avril)', () => {
    const { set } = getJoursFeries(2025);
    expect(set.has(3 * 100 + 21)).toBe(true);
  });

  it('calcule Pâques 2024 (Lundi de Pâques = 1er avril)', () => {
    const { set } = getJoursFeries(2024);
    expect(set.has(3 * 100 + 1)).toBe(true);
  });

  it('calcule Lundi de Pentecôte 2025 = 9 juin', () => {
    const { set, names } = getJoursFeries(2025);
    expect(set.has(5 * 100 + 9)).toBe(true);
    expect(names.get(5 * 100 + 9)).toBe('Lundi de Pentecôte');
  });

  it('contient 11 entrées par an', () => {
    const { names } = getJoursFeries(2025);
    expect(names.size).toBe(11);
  });
});

describe('formatDaysFR', () => {
  it('formate un entier sans décimale', () => {
    expect(formatDaysFR(12)).toBe('12');
  });

  it('formate un demi avec virgule (locale fr-FR)', () => {
    expect(formatDaysFR(12.5)).toBe('12,5');
  });

  it('limite à 1 décimale', () => {
    // 12.55 → arrondi à 12,6 ou 12,5 selon banker's rounding
    const result = formatDaysFR(12.55);
    expect(result).toMatch(/^12,[56]$/);
  });
});

describe('formatDateFR', () => {
  it('décompose une date en day/monthName/year', () => {
    const result = formatDateFR(new Date(2025, 5, 9));
    expect(result.day).toBe(9);
    expect(result.monthName).toBe('Juin');
    expect(result.year).toBe(2025);
  });
});

describe('MONTH_NAMES', () => {
  it('contient 12 entrées en français', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Janvier');
    expect(MONTH_NAMES[11]).toBe('Décembre');
  });
});
