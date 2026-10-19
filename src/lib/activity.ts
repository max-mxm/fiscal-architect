import type { Activity, ActivityEntry, UserProfile } from '~/types';
import { getActivityLegalParams } from '~/lib/fiscal';

export interface PrimaryActivityPatch {
  activities: ActivityEntry[];
  urssafRate: number;
  seuilMicro: number;
  taxeConsulaireEnabled: boolean;
}

/**
 * Patch cohérent à appliquer au profil quand l'activité primaire change
 * (réglages, onboarding par persona) : type de l'activité primaire, taux URSSAF
 * et plafond micro **légaux de l'année du profil** pour cette activité, et
 * taxe consulaire (due pour la vente et les services BIC, pas pour les libéraux).
 *
 * Les autres activités sont conservées telles quelles ; si aucune activité
 * n'est marquée primaire, la première le devient ; si le profil n'en a aucune,
 * une activité primaire est créée. Le profil passé n'est pas muté.
 *
 * Usage : `setProfile((p) => ({ ...p, ...applyPrimaryActivity(p, 'vente') }))`.
 */
export function applyPrimaryActivity(
  profile: Pick<UserProfile, 'activities' | 'year'>,
  activityType: Activity,
): PrimaryActivityPatch {
  const current = profile.activities ?? [];
  const primaryIndex = Math.max(0, current.findIndex((a) => a.isPrimary));
  const activities: ActivityEntry[] = current.length === 0
    ? [{ id: 'act-default', type: activityType, isPrimary: true }]
    : current.map((a, i) => (i === primaryIndex
      ? { ...a, type: activityType, isPrimary: true }
      : { ...a }));
  const legal = getActivityLegalParams(activityType, profile.year);
  return {
    activities,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    taxeConsulaireEnabled: legal.taxeConsulaireEnabled,
  };
}

/**
 * Patch fiscal (taux, plafond, taxe consulaire) correspondant à une liste
 * d'activités déjà éditée — équivalent de la logique des réglages, mais juste
 * pour chaque année. Les activités ne sont pas modifiées.
 */
export function primaryActivityParamsPatch(
  activities: ActivityEntry[],
  year: number,
): Omit<PrimaryActivityPatch, 'activities'> {
  const primary = activities.find((a) => a.isPrimary) ?? activities[0];
  const legal = getActivityLegalParams(primary?.type ?? 'liberalSsi', year);
  return {
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    taxeConsulaireEnabled: legal.taxeConsulaireEnabled,
  };
}
