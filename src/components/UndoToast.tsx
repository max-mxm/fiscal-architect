import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Undo2, X } from 'lucide-react';

interface UndoToastProps {
  open: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** Durée totale en ms avant auto-dismiss. */
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  open,
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(100);
  const startedAtRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!open) {
      cancelAnimationFrame(rafRef.current);
      setProgress(100);
      return;
    }
    startedAtRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        onDismiss();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [open, duration, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[min(440px,calc(100vw-2rem))]"
        >
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl">
            <div className="flex items-center gap-3 p-4">
              <span className="text-sm font-medium flex-1 truncate">{message}</span>
              <button
                type="button"
                onClick={onUndo}
                className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-xl bg-secondary-container/20 text-secondary-container text-sm font-bold hover:bg-secondary-container/30 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-container/50"
              >
                <Undo2 className="w-3.5 h-3.5" /> Annuler
              </button>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Fermer la notification"
                className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-secondary-container transition-[width] motion-reduce:hidden"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
