import { useMemo } from 'react';
import type { Notification, NotificationKind } from '~/types';
import { computeNotifications, type NotificationsInput } from '~/lib/notifications';
import { useNotificationsState } from '~/hooks/useNotificationsState';

export interface UseNotificationsResult {
  /** Notifications calculées et NON dismissed — affichables sur le Home. */
  active: Notification[];
  /** Notifications calculées ET dismissed — listées dans le centre. */
  dismissedList: Notification[];
  /** active.length + dismissedList.length — pilote le badge cloche. */
  total: number;
  dismiss: (id: NotificationKind) => void;
  restore: (id: NotificationKind) => void;
  restoreAll: () => void;
}

/**
 * Combine la logique pure de `computeNotifications` avec l'état persistant
 * des dismissed. Renvoie deux listes séparées pour piloter Home vs centre.
 */
export function useNotifications(input: NotificationsInput): UseNotificationsResult {
  const { dismissed, dismiss, restore, restoreAll } = useNotificationsState();

  const computed = useMemo(() => computeNotifications(input), [input]);

  const { active, dismissedList } = useMemo(() => {
    const active: Notification[] = [];
    const dismissedList: Notification[] = [];
    for (const n of computed) {
      if (dismissed[n.id]) dismissedList.push(n);
      else active.push(n);
    }
    return { active, dismissedList };
  }, [computed, dismissed]);

  return {
    active,
    dismissedList,
    total: active.length + dismissedList.length,
    dismiss,
    restore,
    restoreAll,
  };
}
