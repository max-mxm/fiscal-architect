import React, { useEffect, useRef, useState, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '~/utils';

interface QuickEditModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Action principale (bouton plein) — sinon le child gère sa propre persistance. */
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Overlay d'édition rapide. Adaptatif :
 * - Desktop (≥ md) : modale centrée, opacity + scale
 * - Mobile (< md) : bottom sheet, slide y: 100% → 0
 *
 * Focus trap, Esc, backdrop click — patterns alignés sur ConfirmModal et SettingsDrawer.
 */
export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Portal côté client uniquement — TanStack Start fait du SSR, document n'existe pas au server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
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
  }, [open]);

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm flex md:items-center md:justify-center items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            // Mobile : bottom sheet (slide), Desktop : modale (scale)
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative bg-white shadow-2xl flex flex-col',
              // Mobile : pleine largeur, bord supérieur arrondi, max-h
              'w-full max-w-full rounded-t-3xl max-h-[90dvh]',
              // Desktop : modale centrée, bords arrondis partout, largeur fixe
              'md:max-w-md md:rounded-3xl md:max-h-[80dvh]',
            )}
          >
            {/* Drag handle visuel mobile uniquement (pas de drag réel) */}
            <div className="md:hidden pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-4 md:pt-6 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 id={titleId} className="font-headline text-lg font-bold text-slate-900">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
              {children}
            </div>

            {/* Footer optionnel */}
            {primaryAction && (
              <div className="px-6 pb-6 pt-2 border-t border-outline-variant/15 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 min-h-[44px] rounded-xl text-sm font-bold text-on-surface-variant hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  className={cn(
                    'px-4 min-h-[44px] rounded-xl text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
                    primaryAction.disabled
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-secondary hover:opacity-90',
                  )}
                >
                  {primaryAction.label}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
};
