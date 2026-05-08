import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useNotificationsCtx } from '~/context/NotificationsContext';
import { NotificationItem } from '~/components/notifications/NotificationItem';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const { active, dismissedList, total, dismiss, restore, restoreAll } = useNotificationsCtx();
  const ref = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    // Focus initial sur le premier élément focusable (souvent le bouton du premier item)
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (ref.current?.contains(target)) return;
      // Ne ferme pas si le clic est sur le bouton cloche (qui toggle déjà l'état)
      const bell = document.getElementById('notification-bell');
      if (bell?.contains(target)) return;
      onCloseRef.current();
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="false"
          aria-label="Centre de notifications"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] z-[85] bg-white rounded-2xl shadow-2xl border border-outline-variant/15 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/15">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-headline text-sm font-bold text-slate-900">Alertes</h2>
              {total > 0 && (
                <span className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-surface-highest/60 text-on-surface-variant">
                  {total}
                </span>
              )}
            </div>
            {dismissedList.length > 0 && (
              <button
                type="button"
                onClick={restoreAll}
                className="text-[11px] font-bold text-secondary hover:opacity-70 transition-opacity min-h-[32px] px-2"
              >
                Tout réafficher
              </button>
            )}
          </div>

          <div className="max-h-[60dvh] overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
            {total === 0 ? (
              <div className="flex flex-col items-center text-center py-6 px-4 gap-2">
                <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <p className="text-sm font-bold text-slate-900">Aucune alerte</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Tout est sous contrôle.
                </p>
              </div>
            ) : (
              <>
                {active.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant px-1">
                      Actives ({active.length})
                    </h3>
                    <ul className="space-y-2">
                      {active.map((n) => (
                        <li key={n.id}>
                          <NotificationItem
                            notification={n}
                            isDismissed={false}
                            onToggle={() => dismiss(n.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {dismissedList.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant px-1">
                      Masquées ({dismissedList.length})
                    </h3>
                    <ul className="space-y-2">
                      {dismissedList.map((n) => (
                        <li key={n.id}>
                          <NotificationItem
                            notification={n}
                            isDismissed
                            onToggle={() => restore(n.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
