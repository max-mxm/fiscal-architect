import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Undo2, X } from 'lucide-react';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';

interface UndoToastProps {
  open: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

/** Bandeau d'annulation, au-dessus de la barre d'onglets sur mobile. */
export const UndoToast: React.FC<UndoToastProps> = ({ open, message, onUndo, onDismiss, durationMs = 6000 }) => {
  const reduced = usePrefersReducedMotion();
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => dismissRef.current(), durationMs);
    return () => window.clearTimeout(t);
  }, [open, message, durationMs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduced ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[85] mx-auto max-w-md overflow-hidden rounded-[var(--radius-card)] bg-ink text-card shadow-[var(--shadow-overlay)] lg:bottom-6"
        >
          <div className="flex items-center gap-2 py-1.5 pl-4 pr-1.5">
            <p className="min-w-0 flex-1 text-[14px] leading-snug">{message}</p>
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-ctl)] px-3 text-[14px] font-bold text-ca-light hover:bg-white/10"
            >
              <Undo2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Annuler
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fermer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-ctl)] text-card/70 hover:bg-white/10 hover:text-card"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {!reduced && (
            <motion.span
              aria-hidden="true"
              className="block h-[3px] origin-left bg-ca"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: durationMs / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
