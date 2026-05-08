import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationsCtx } from '~/context/NotificationsContext';
import { NotificationCenter } from '~/components/notifications/NotificationCenter';

export const NotificationBell: React.FC = () => {
  const { total, active } = useNotificationsCtx();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id="notification-bell"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? `Notifications (${total})` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={total > 0 ? `${total} alerte${total > 1 ? 's' : ''}` : 'Aucune alerte'}
        className="relative w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span
            aria-live="polite"
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums inline-flex items-center justify-center shadow-sm"
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
        {/* Indicateur subtil quand des alertes actives sont présentes même sans badge visible */}
        {total === 0 && active.length === 0 && null}
      </button>

      <NotificationCenter open={open} onClose={() => setOpen(false)} />
    </div>
  );
};
