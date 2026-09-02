import React from 'react';
import { Building2, AlertTriangle, EyeOff, Eye, Landmark } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { Notification } from '~/types';
import { cn } from '~/utils';

interface NotificationItemProps {
  notification: Notification;
  /** True quand la notif est dans la section « Masquées » du centre. */
  isDismissed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

const ICONS: Record<Notification['icon'], React.ComponentType<{ className?: string }>> = {
  'compte-pro': Building2,
  seuil: AlertTriangle,
  vl: Landmark,
};

const TONE: Record<Notification['level'], string> = {
  info: 'bg-secondary/10 text-secondary',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, isDismissed, onToggle, onNavigate }) => {
  const Icon = ICONS[notification.icon];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl bg-surface-lowest border border-outline-variant/20 p-3 transition-opacity',
        isDismissed && 'opacity-60',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', TONE[notification.level])}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface">{notification.title}</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{notification.body}</p>
        {notification.action && !isDismissed && (
          <Link
            to={notification.action.to}
            onClick={onNavigate}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-xl px-3 py-2 text-[11px] font-bold text-secondary bg-secondary/10 hover:bg-secondary/15 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
          >
            {notification.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDismissed ? `Réafficher ${notification.title}` : `Masquer ${notification.title}`}
        title={isDismissed ? 'Réafficher sur le tableau de bord' : 'Masquer du tableau de bord'}
        className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
      >
        {isDismissed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
};
