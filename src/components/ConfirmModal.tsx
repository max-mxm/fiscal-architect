import React, { useEffect, useRef, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '~/utils';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  /** Si true, picto rouge + bouton confirmer rouge. */
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  destructive = true,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap + ESC + restore focus
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    cancelBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  const handleBackdrop = useCallback(() => onCancel(), [onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleBackdrop}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'h-11 w-11 rounded-2xl flex items-center justify-center shrink-0',
                  destructive ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600',
                )}
              >
                {destructive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 id={titleId} className="font-headline text-base font-bold text-slate-900">
                  {title}
                </h3>
                <div id={descId} className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  {message}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onCancel}
                className="px-4 min-h-[44px] rounded-xl text-sm font-bold text-on-surface-variant hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'px-4 min-h-[44px] rounded-xl text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2',
                  destructive
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500/30'
                    : 'bg-secondary hover:opacity-90 focus:ring-secondary/30',
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
