import { describe, expect, it } from 'vitest';
import { getActivityLegalParams, getUrssafRateForActivity } from '~/lib/fiscal';
import { applyPrimaryActivity } from '~/lib/activity';
import { makeProfile } from './testUtils';

describe('getActivityLegalParams (activité × année)', () => {
  it('libéral SSI suit LEGAL_PARAMS_BY_YEAR', () => {
    expect(getActivityLegalParams('liberalSsi', 2025)).toEqual({ urssafRate: 24.6, seuilMicro: 77_700, taxeConsulaireEnabled: false });
    expect(getActivityLegalParams('liberalSsi', 2026)).toEqual({ urssafRate: 25.6, seuilMicro: 83_600, taxeConsulaireEnabled: false });
  });

  it('vente : taux 12,3 %, plafond vente de l’année, taxe consulaire', () => {
    expect(getActivityLegalParams('vente', 2025)).toEqual({ urssafRate: 12.3, seuilMicro: 188_700, taxeConsulaireEnabled: true });
    expect(getActivityLegalParams('vente', 2026)).toEqual({ urssafRate: 12.3, seuilMicro: 203_100, taxeConsulaireEnabled: true });
  });

  it('services BIC : taux 21,2 %, plafond services de l’année (pas le taux SSI)', () => {
    expect(getActivityLegalParams('serviceBic', 2025)).toEqual({ urssafRate: 21.2, seuilMicro: 77_700, taxeConsulaireEnabled: true });
    expect(getActivityLegalParams('serviceBic', 2026)).toEqual({ urssafRate: 21.2, seuilMicro: 83_600, taxeConsulaireEnabled: true });
  });

  it('CIPAV : 21,2 % jusqu’en 2024, 23,2 % ensuite', () => {
    expect(getActivityLegalParams('liberalCipav', 2024).urssafRate).toBe(21.2);
    expect(getActivityLegalParams('liberalCipav', 2025).urssafRate).toBe(23.2);
    expect(getActivityLegalParams('liberalCipav', 2026)).toEqual({ urssafRate: 23.2, seuilMicro: 83_600, taxeConsulaireEnabled: false });
  });

  it('année inconnue : repli sur la dernière année connue', () => {
    expect(getActivityLegalParams('vente', 2031).seuilMicro).toBe(203_100);
    expect(getActivityLegalParams('liberalSsi', 2031).urssafRate).toBe(25.6);
  });

  it('getUrssafRateForActivity : taux du profil pour la primaire, légal de l’année pour les autres', () => {
    const profile = makeProfile({
      year: 2025,
      urssafRate: 22,
      activities: [
        { id: 'a', type: 'vente', isPrimary: true },
        { id: 'b', type: 'liberalSsi', isPrimary: false },
      ],
    });
    expect(getUrssafRateForActivity(profile, 'vente')).toBe(22);
    expect(getUrssafRateForActivity(profile, 'liberalSsi')).toBe(24.6);
  });
});

describe('applyPrimaryActivity', () => {
  it('renvoie un patch cohérent pour une activité de vente (année 2025)', () => {
    const profile = makeProfile({ year: 2025, urssafRate: 24.6, seuilMicro: 77_700 });
    const patch = applyPrimaryActivity(profile, 'vente');
    expect(patch.urssafRate).toBe(12.3);
    expect(patch.seuilMicro).toBe(188_700);
    expect(patch.taxeConsulaireEnabled).toBe(true);
    expect(patch.activities).toEqual([{ id: 'act-default', type: 'vente', isPrimary: true }]);
  });

  it('libéral SSI sur 2025 : taux 2025 (pas le 25,6 % de 2026)', () => {
    const profile = makeProfile({
      year: 2025,
      activities: [{ id: 'x', type: 'vente', isPrimary: true }],
      urssafRate: 12.3,
      seuilMicro: 188_700,
      taxeConsulaireEnabled: true,
    });
    const patch = applyPrimaryActivity(profile, 'liberalSsi');
    expect(patch).toMatchObject({ urssafRate: 24.6, seuilMicro: 77_700, taxeConsulaireEnabled: false });
  });

  it('ne modifie que l’activité primaire en multi-activité', () => {
    const profile = makeProfile({
      activities: [
        { id: 'a', type: 'liberalSsi', isPrimary: false, label: 'Conseil' },
        { id: 'b', type: 'vente', isPrimary: true, label: 'Boutique' },
      ],
    });
    const patch = applyPrimaryActivity(profile, 'serviceBic');
    expect(patch.activities).toEqual([
      { id: 'a', type: 'liberalSsi', isPrimary: false, label: 'Conseil' },
      { id: 'b', type: 'serviceBic', isPrimary: true, label: 'Boutique' },
    ]);
    expect(patch.urssafRate).toBe(21.2);
    expect(profile.activities[1].type).toBe('vente'); // pas de mutation
  });

  it('crée une activité primaire si le profil n’en a aucune', () => {
    const patch = applyPrimaryActivity(makeProfile({ activities: [] }), 'liberalCipav');
    expect(patch.activities).toHaveLength(1);
    expect(patch.activities[0]).toMatchObject({ type: 'liberalCipav', isPrimary: true });
    expect(patch.urssafRate).toBe(23.2);
  });

  it('marque la première activité primaire si aucune ne l’est', () => {
    const patch = applyPrimaryActivity(
      makeProfile({ activities: [{ id: 'a', type: 'vente', isPrimary: false }, { id: 'b', type: 'vente', isPrimary: false }] }),
      'liberalSsi',
    );
    expect(patch.activities[0]).toEqual({ id: 'a', type: 'liberalSsi', isPrimary: true });
    expect(patch.activities[1].isPrimary).toBe(false);
  });

  it('s’applique au profil fusionné avec un patch persona', () => {
    const base = makeProfile();
    const persona = { activities: [{ id: 'p', type: 'vente' as const, isPrimary: true }] };
    const patch = applyPrimaryActivity({ ...base, ...persona }, 'vente');
    expect(patch).toMatchObject({ urssafRate: 12.3, seuilMicro: 203_100, taxeConsulaireEnabled: true });
  });
});
