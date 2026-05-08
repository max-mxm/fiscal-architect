import { useCallback } from 'react';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import type { NotificationKind } from '~/types';

interface NotificationsState {
  /** Map d'IDs masqués → true. Les IDs orphelins (alerte plus calculée) sont ignorés. */
  dismissed: Partial<Record<NotificationKind, true>>;
}

const DEFAULT_STATE: NotificationsState = { dismissed: {} };

/**
 * État persistant des notifications masquées, stocké dans localStorage.
 * Les IDs sont stables — un dismiss survit aux reload, mais une alerte qui
 * n'apparaît plus dans `computeNotifications` est silencieusement absente.
 */
export function useNotificationsState() {
  const [state, setState] = useLocalStorage<NotificationsState>(
    'fiscal-notifications-state',
    DEFAULT_STATE,
  );

  const dismiss = useCallback(
    (id: NotificationKind) => {
      setState((prev) => ({ ...prev, dismissed: { ...prev.dismissed, [id]: true } }));
    },
    [setState],
  );

  const restore = useCallback(
    (id: NotificationKind) => {
      setState((prev) => {
        if (!prev.dismissed[id]) return prev;
        const nextDismissed = { ...prev.dismissed };
        delete nextDismissed[id];
        return { ...prev, dismissed: nextDismissed };
      });
    },
    [setState],
  );

  const restoreAll = useCallback(() => {
    setState({ dismissed: {} });
  }, [setState]);

  return { dismissed: state.dismissed, dismiss, restore, restoreAll };
}
