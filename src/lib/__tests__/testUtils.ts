import type { CalendarMonth, RevenueEntry, UserProfile } from '~/types';

/** Profil complet pour les tests, surchargé via `overrides`. */
export const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  name: 'T',
  role: 'T',
  creationDate: '2020-01-01',
  partsFiscales: 1,
  declarationPeriod: 'monthly',
  onboardingDone: true,
  year: 2026,
  tjm: 500,
  workingDays: 19,
  paymentDelayDays: 0,
  paymentDelayMode: 'net',
  endOfMonthCalculation: 'delayThenMonthEnd',
  urssafRate: 25.6,
  fixedCosts: [],
  seuilMicro: 83_600,
  versementLiberatoire: false,
  acreEnabled: false,
  tvaAssujetti: false,
  tvaRate: 0.2,
  tvaEffectiveDate: null,
  cfpEnabled: false,
  taxeConsulaireEnabled: false,
  revenueModel: 'days',
  activities: [{ id: 'act-default', type: 'liberalSsi', isPrimary: true }],
  ijOption: false,
  rfrN2: null,
  missionStart: '2026-01-01',
  ...overrides,
});

/** 12 mois vides d'une année, surchargés mois par mois. */
export const monthsOf = (year: number, fill: Partial<CalendarMonth>[] = []): CalendarMonth[] =>
  Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    workedDays: [],
    halfDays: [],
    entries: [],
    ...fill[i],
  }));

/** 12 mois portant chacun un montant mensuel (`flat`) — 0 = mois vide. */
export const flatMonths = (year: number, amounts: number[], activityId?: string): CalendarMonth[] =>
  monthsOf(year, amounts.map((amount, i) => ({
    entries: amount > 0
      ? [{ kind: 'flat', id: `flat-${i}`, amount, ...(activityId ? { activityId } : {}) } as RevenueEntry]
      : [],
  })));

export const fixedCost = (id: string, amount: number): UserProfile['fixedCosts'][number] => ({
  id,
  name: id,
  description: '',
  amount,
  icon: '',
  color: '',
});
