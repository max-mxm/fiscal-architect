import React, { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '~/utils';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** `alertdialog` pour les confirmations et les blocages. */
  role?: 'dialog' | 'alertdialog';
  /** false : ni Échap, ni clic sur le fond, ni bouton fermer. */
  dismissable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Masque le bouton fermer de l'en-tête (le pied porte déjà « Annuler »). */
  hideClose?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-xl',
};

/**
 * Seul overlay de l'app : feuille ancrée en bas sur mobile, modale centrée à
 * partir de md. Piège le focus, ferme sur Échap, restaure le focus, bloque le
 * défilement du document.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  role = 'dialog',
  dismissable = true,
  initialFocusRef,
  hideClose,
  className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ??
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panelRef.current;
      target?.focus();
    });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!dismissable) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
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
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, dismissable, initialFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            onClick={dismissable ? () => onCloseRef.current() : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-card text-ink shadow-[var(--shadow-overlay)] outline-none',
              'rounded-t-[18px] md:rounded-[14px]',
              'max-h-[92dvh] flex flex-col',
              SIZE[size],
              className,
            )}
          >
            <div className="md:hidden flex justify-center pt-2" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-line-2" />
            </div>
            <header className="flex items-start gap-3 px-5 pt-4 md:pt-5 pb-3">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-[22px] leading-tight font-bold text-ink text-balance">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-[14px] text-ink-2 text-pretty">
                    {description}
                  </p>
                )}
              </div>
              {dismissable && !hideClose && (
                <button
                  type="button"
                  onClick={() => onCloseRef.current()}
                  aria-label="Fermer"
                  className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-card-2 hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
            </header>
            {children !== undefined && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            )}
            {footer && (
              <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end safe-bottom">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
