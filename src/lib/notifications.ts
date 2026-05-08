import type { Notification } from '~/types';
import { COMPTE_PRO_THRESHOLD } from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';

/** Pourcentage à partir duquel on alerte sur la projection annuelle du seuil micro. */
export const SEUIL_MICRO_WARNING_PCT = 0.80;

export interface NotificationsInput {
  /** CA annuel projeté (cumul des entries du calendrier sans extrapolation). */
  caCumule: number;
  /** CA déjà encaissé à date. */
  caRealise: number;
  /** Plafond annuel micro applicable. */
  seuilMicro: number;
}

/**
 * Calcule la liste des notifications actives pour l'état actuel. Fonction pure
 * — ne lit pas de localStorage, ne mute rien. Le filtrage des dismissed se fait
 * en aval dans le hook `useNotifications`.
 */
export function computeNotifications(input: NotificationsInput): Notification[] {
  const out: Notification[] = [];
  const { caCumule, caRealise, seuilMicro } = input;

  if (caCumule > COMPTE_PRO_THRESHOLD) {
    out.push({
      id: 'compte-pro',
      level: 'warning',
      icon: 'compte-pro',
      title: 'Compte bancaire dédié obligatoire',
      body: `Votre CA cumulé (${formatEuro(caCumule)}€) dépasse ${formatEuro(COMPTE_PRO_THRESHOLD)}€. Au-delà sur 2 années consécutives, un compte bancaire dédié est requis.`,
    });
  }

  if (seuilMicro > 0) {
    if (caRealise >= seuilMicro) {
      out.push({
        id: 'seuil-micro-breach',
        level: 'critical',
        icon: 'seuil',
        title: 'Seuil micro dépassé',
        body: `CA réalisé ${formatEuro(caRealise)}€ ≥ plafond ${formatEuro(seuilMicro)}€. Vous risquez la sortie du régime micro-entreprise.`,
      });
    } else if (caCumule / seuilMicro >= SEUIL_MICRO_WARNING_PCT) {
      const pct = Math.round((caCumule / seuilMicro) * 100);
      out.push({
        id: 'seuil-micro-projected',
        level: 'warning',
        icon: 'seuil',
        title: 'Seuil micro proche',
        body: `${pct} % du plafond ${formatEuro(seuilMicro)}€ projeté. Anticipez une éventuelle bascule de régime.`,
      });
    }
  }

  return out;
}
