import { describe, expect, it } from 'vitest';
import type { CalendarMonth, UserProfile } from '~/types';
import { buildDefaultYearConfig, DEFAULT_IDENTITY } from '~/constants';
import { calcVLRegularization } from '~/lib/vlRegularization';
import { computeNotifications } from '~/lib/notifications';
import { calcVLEligibilityForYear, getVLRfrThresholdPerPart } from '~/lib/vlEligibility';

const { schemaVersion: _identityVersion, ...identity } = DEFAULT_IDENTITY;
const { schemaVersion: _yearVersion, ...yearConfig } = buildDefaultYearConfig(2026);

const profile: UserProfile = {
  ...identity,
  ...yearConfig,
  onboardingDone: true,
  versementLiberatoire: true,
  rfrN2: 40_000,
};

const months: CalendarMonth[] = Array.from({ length: 12 }, (_, month) => ({
  month,
  year: 2026,
  workedDays: [],
  halfDays: [],
  entries: month < 2 ? [{ kind: 'flat' as const, id: `flat-${month}`, amount: 10_000 }] : [],
}));

describe('calcVLRegularization', () => {
  it('calcule le barème annuel puis déduit le VL payé sur les mois choisis', () => {
    const result = calcVLRegularization(months, profile, [0, 1]);

    expect(result.ca).toBe(20_000);
    expect(result.taxableIncome).toBeCloseTo(13_200);
    expect(result.estimatedIncomeTax).toBe(176);
    expect(result.vlPaid).toBeCloseTo(440);
    expect(result.amountToProvision).toBe(0);
    expect(result.rows).toHaveLength(2);
  });

  it('normalise, trie et déduplique les mois', () => {
    const result = calcVLRegularization(months, profile, [1, 0, 1, -1, 12]);
    expect(result.selectedMonths).toEqual([0, 1]);
  });
});

describe('notification VL', () => {
  it('est critique et renvoie vers la page si VL actif + RFR trop élevé', () => {
    const notification = computeNotifications({
      caCumule: 20_000,
      caRealise: 20_000,
      seuilMicro: 83_600,
      rfrN2: 40_000,
      partsFiscales: 1,
      versementLiberatoire: true,
      year: 2026,
    }).find((item) => item.id === 'vl-ineligible');

    expect(notification?.level).toBe('critical');
    expect(notification?.action?.to).toBe('/regularisation-vl');
    expect(notification?.body).toContain('RFR) 2024');
  });

  it('ne se déclenche pas quand le VL est désactivé', () => {
    const notification = computeNotifications({
      caCumule: 20_000,
      caRealise: 20_000,
      seuilMicro: 83_600,
      rfrN2: 40_000,
      partsFiscales: 1,
      versementLiberatoire: false,
    }).find((item) => item.id === 'vl-ineligible');

    expect(notification).toBeUndefined();
  });
});

describe('éligibilité VL par année fiscale', () => {
  it('utilise pour 2026 le RFR 2024 et le plafond officiel 2026', () => {
    const result = calcVLEligibilityForYear(30_000, 1, 2026);
    expect(result.rfrYear).toBe(2024);
    expect(result.taxNoticeYear).toBe(2025);
    expect(result.threshold).toBe(29_315);
    expect(result.motif).toBe('rfr-too-high');
  });

  it('marque comme indicatif un seuil futur encore inconnu', () => {
    expect(getVLRfrThresholdPerPart(2028)).toEqual({ amount: 29_579, known: false });
  });
});
