import type { ActivityEntry, UserProfile } from '~/types';
import { primaryActivityParamsPatch } from '~/lib/activity';

/**
 * Patch cohérent quand la liste d'activités change : si l'activité principale
 * change de type, elle fixe le taux de cotisations, le plafond micro et la
 * taxe consulaire (valeurs légales de l'année).
 */
export function primaryActivityPatch(profile: UserProfile, next: ActivityEntry[]): Partial<UserProfile> {
  const before = profile.activities.find((a) => a.isPrimary) ?? profile.activities[0];
  const primary = next.find((a) => a.isPrimary) ?? next[0];
  if (!primary || (before && before.type === primary.type)) return { activities: next };
  return { activities: next, ...primaryActivityParamsPatch(next, profile.year) };
}
