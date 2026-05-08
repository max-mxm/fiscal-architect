import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildDefaultYearConfig, getLegalParamsForYear } from '~/constants';
import { createEmptyFiscalYear } from '~/lib/calendar';
import {
  createYearFresh,
  createYearInherited,
  isYearEmpty,
  previewInheritedConfig,
} from '~/lib/yearLifecycle';

const yearConfigKey = (year: number) => `fiscal-year-config-${year}`;
const yearCalendarKey = (year: number) => `fiscal-calendar-${year}`;

// localStorage shim pour l'environnement de test 'node' (pas de DOM).
function createLocalStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('yearLifecycle', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      Object.defineProperty(globalThis, 'localStorage', {
        value: createLocalStorageStub(),
        configurable: true,
      });
    }
  });
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  describe('isYearEmpty', () => {
    it('returns true when no config exists in localStorage', () => {
      expect(isYearEmpty(2027)).toBe(true);
    });

    it('returns true when config equals defaults and calendar is empty', () => {
      localStorage.setItem(yearConfigKey(2027), JSON.stringify(buildDefaultYearConfig(2027)));
      localStorage.setItem(yearCalendarKey(2027), JSON.stringify(createEmptyFiscalYear(2027)));
      expect(isYearEmpty(2027)).toBe(true);
    });

    it('returns false when config has a custom TJM', () => {
      const config = { ...buildDefaultYearConfig(2027), tjm: 800 };
      localStorage.setItem(yearConfigKey(2027), JSON.stringify(config));
      expect(isYearEmpty(2027)).toBe(false);
    });

    it('returns false when calendar has a worked day', () => {
      localStorage.setItem(yearConfigKey(2027), JSON.stringify(buildDefaultYearConfig(2027)));
      const calendar = createEmptyFiscalYear(2027);
      calendar.months[0].workedDays = [1, 2, 3];
      localStorage.setItem(yearCalendarKey(2027), JSON.stringify(calendar));
      expect(isYearEmpty(2027)).toBe(false);
    });

    it('returns false when calendar has a revenue entry', () => {
      localStorage.setItem(yearConfigKey(2027), JSON.stringify(buildDefaultYearConfig(2027)));
      const calendar = createEmptyFiscalYear(2027);
      calendar.months[0].entries = [
        { kind: 'flat', id: 'e1', amount: 1000 },
      ];
      localStorage.setItem(yearCalendarKey(2027), JSON.stringify(calendar));
      expect(isYearEmpty(2027)).toBe(false);
    });
  });

  describe('createYearFresh', () => {
    it('writes a default config and an empty calendar', () => {
      const { config, calendar } = createYearFresh(2027);
      expect(config).toEqual(buildDefaultYearConfig(2027));
      expect(calendar.months).toHaveLength(12);
      expect(calendar.months.every((m) => m.workedDays.length === 0)).toBe(true);
      expect(localStorage.getItem(yearConfigKey(2027))).not.toBeNull();
      expect(localStorage.getItem(yearCalendarKey(2027))).not.toBeNull();
    });

    it('overwrites any pre-existing data', () => {
      const tampered = { ...buildDefaultYearConfig(2027), tjm: 999 };
      localStorage.setItem(yearConfigKey(2027), JSON.stringify(tampered));
      const { config } = createYearFresh(2027);
      expect(config.tjm).toBe(650);
    });
  });

  describe('createYearInherited', () => {
    beforeEach(() => {
      const source = {
        ...buildDefaultYearConfig(2026),
        tjm: 750,
        workingDays: 18,
        rfrN2: 42_000,
        acreEnabled: true,
        missionStart: '2026-03-15',
      };
      localStorage.setItem(yearConfigKey(2026), JSON.stringify(source));
    });

    it('clones perso fields from source year', () => {
      const { config } = createYearInherited(2027, 2026);
      expect(config.tjm).toBe(750);
      expect(config.workingDays).toBe(18);
      expect(config.acreEnabled).toBe(true);
    });

    it('patches legal params to target year', () => {
      const { config } = createYearInherited(2027, 2026);
      const legal = getLegalParamsForYear(2027);
      expect(config.urssafRate).toBe(legal.urssafRate);
      expect(config.seuilMicro).toBe(legal.seuilMicro);
    });

    it('resets rfrN2 and missionStart to target year', () => {
      const { config } = createYearInherited(2027, 2026);
      expect(config.rfrN2).toBeNull();
      expect(config.missionStart).toBe('2027-01-01');
    });

    it('always creates an empty calendar for target year', () => {
      const { calendar } = createYearInherited(2027, 2026);
      expect(calendar.months.every((m) => m.workedDays.length === 0 && m.entries.length === 0)).toBe(true);
    });

    it('falls back to fresh when source year does not exist', () => {
      const { config } = createYearInherited(2030, 2029);
      expect(config).toEqual(buildDefaultYearConfig(2030));
    });

    it('does not share array references with source', () => {
      const { config } = createYearInherited(2027, 2026);
      const sourceRaw = JSON.parse(localStorage.getItem(yearConfigKey(2026)) ?? '{}');
      config.fixedCosts.push({ id: 'x', name: 'X', description: 'X', amount: 0, icon: '', color: '' });
      expect(sourceRaw.fixedCosts).toHaveLength(3);
    });
  });

  describe('previewInheritedConfig', () => {
    it('returns a preview without persisting', () => {
      localStorage.setItem(yearConfigKey(2026), JSON.stringify({ ...buildDefaultYearConfig(2026), tjm: 800 }));
      const preview = previewInheritedConfig(2027, 2026);
      expect(preview?.tjm).toBe(800);
      expect(preview?.year).toBe(2027);
      expect(localStorage.getItem(yearConfigKey(2027))).toBeNull();
    });

    it('returns null when source year does not exist', () => {
      const preview = previewInheritedConfig(2027, 2026);
      expect(preview).toBeNull();
    });
  });
});
