import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell, Eye, EyeOff } from 'lucide-react';
import { Dialog } from '~/ui/Dialog';
import { IconButton } from '~/ui/Button';
import { useNotificationsCtx } from '~/context/NotificationsContext';
import type { Notification } from '~/types';
import { cn } from '~/utils';

const LEVEL_LABEL: Record<Notification['level'], string> = {
  info: 'Info',
  warning: 'À surveiller',
  critical: 'Urgent',
};

const LEVEL_TONE: Record<Notification['level'], string> = {
  info: 'bg-card-2 text-ink-2',
  warning: 'bg-warn text-warn-on',
  critical: 'bg-alert text-alert-on',
};

function Item({
  n,
  dismissed,
  onToggle,
  onNavigate,
}: {
  n: Notification;
  dismissed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <li className={cn('flex items-start gap-3 py-3', dismissed && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-[12px] font-bold', LEVEL_TONE[n.level])}>
            {LEVEL_LABEL[n.level]}
          </span>
          <p className="text-[15px] font-semibold text-ink">{n.title}</p>
        </div>
        <p className="mt-1 text-[14px] leading-snug text-ink-2 text-pretty">{n.body}</p>
        {n.action && !dismissed && (
          <Link
            to={n.action.to}
            onClick={onNavigate}
            className="mt-2 inline-flex min-h-9 pointer-coarse:min-h-11 items-center text-[14px] font-semibold text-ca-ink hover:underline"
          >
            {n.action.label}
          </Link>
        )}
      </div>
      <IconButton
        label={dismissed ? `Réafficher « ${n.title} »` : `Masquer « ${n.title} »`}
        onClick={onToggle}
        size="sm"
      >
        {dismissed ? (
          <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        )}
      </IconButton>
    </li>
  );
}

/** Cloche (sur le tirage) et liste des alertes. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { active, dismissedList, dismiss, restore, restoreAll } = useNotificationsCtx();
  const close = () => setOpen(false);

  return (
    <>
      <IconButton
        label="Alertes"
        badge={active.length || undefined}
        badgeTone={active.some((n) => n.level === 'critical') ? 'alert' : 'warn'}
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </IconButton>
      <Dialog
        open={open}
        onClose={close}
        title="Alertes"
        description={
          active.length === 0 && dismissedList.length === 0
            ? 'Aucune alerte : rien à surveiller pour l’instant.'
            : 'Les alertes masquées ne s’affichent plus sur l’écran du mois.'
        }
        size="md"
      >
        {active.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {active.map((n) => (
              <Item key={n.id} n={n} dismissed={false} onToggle={() => dismiss(n.id)} onNavigate={close} />
            ))}
          </ul>
        )}
        {dismissedList.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-[14px] font-semibold text-ink-2">Masquées ({dismissedList.length})</h3>
              <button
                type="button"
                onClick={restoreAll}
                className="min-h-9 pointer-coarse:min-h-11 text-[14px] font-semibold text-ca-ink hover:underline"
              >
                Tout réafficher
              </button>
            </div>
            <ul className="divide-y divide-line">
              {dismissedList.map((n) => (
                <Item key={n.id} n={n} dismissed onToggle={() => restore(n.id)} onNavigate={close} />
              ))}
            </ul>
          </div>
        )}
      </Dialog>
    </>
  );
}
