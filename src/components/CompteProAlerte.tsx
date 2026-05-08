import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, AlertTriangle, X } from 'lucide-react';
import type { Notification } from '~/types';
import { cn } from '~/utils';

interface DismissableBannerProps {
  notification: Notification | null;
  onDismiss: () => void;
}

const ICONS: Record<Notification['icon'], React.ComponentType<{ className?: string }>> = {
  'compte-pro': Building2,
  seuil: AlertTriangle,
};

const TONE: Record<Notification['level'], { wrap: string; iconBg: string; title: string; body: string; close: string }> = {
  info: {
    wrap: 'bg-secondary/5 border-secondary/20',
    iconBg: 'bg-secondary/10 text-secondary',
    title: 'text-secondary',
    body: 'text-secondary/80',
    close: 'text-secondary/70 hover:text-secondary',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    title: 'text-amber-900',
    body: 'text-amber-800',
    close: 'text-amber-700/70 hover:text-amber-900',
  },
  critical: {
    wrap: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100 text-red-700',
    title: 'text-red-900',
    body: 'text-red-800',
    close: 'text-red-700/70 hover:text-red-900',
  },
};

/**
 * Banderole d'alerte dismissable pour le tableau de bord. Anime la sortie
 * via AnimatePresence quand `notification` devient null (dismiss).
 *
 * Conserve l'export historique `CompteProAlerte` pour ne pas casser les imports
 * — c'est désormais un alias de `DismissableBanner`.
 */
export const DismissableBanner: React.FC<DismissableBannerProps> = ({ notification, onDismiss }) => {
  return (
    <AnimatePresence initial={false}>
      {notification && (
        <motion.div
          key={notification.id}
          role="status"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div className={cn('rounded-2xl border px-4 py-3 flex items-start gap-3', TONE[notification.level].wrap)}>
            <span
              aria-hidden="true"
              className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', TONE[notification.level].iconBg)}
            >
              {React.createElement(ICONS[notification.icon], { className: 'w-4 h-4' })}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-bold', TONE[notification.level].title)}>{notification.title}</p>
              <p className={cn('text-[11px] mt-0.5 leading-relaxed', TONE[notification.level].body)}>
                {notification.body}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={`Masquer ${notification.title}`}
              title="Masquer du tableau de bord (visible dans le centre de notifications)"
              className={cn(
                'shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
                TONE[notification.level].close,
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Alias rétro-compat — `<CompteProAlerte caCumule={...} />` n'est plus utilisé directement. */
export const CompteProAlerte = DismissableBanner;
