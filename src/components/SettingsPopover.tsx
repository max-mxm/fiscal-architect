import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import type { UserProfile } from '~/types';

interface SettingsPopoverProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onResetAll: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  open,
  onClose,
  profile,
  setProfile,
  onResetAll,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Ref-pattern : on garde `onClose` à jour sans le mettre dans les deps de l'effect,
  // sinon chaque render parent (recréé `closeSettings`) re-trigger l'effect qui vole le focus.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  const update = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[70] md:bg-transparent bg-slate-900/30 backdrop-blur-[2px] md:backdrop-blur-0"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Réglages du profil"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[71] md:top-16 md:right-6 md:w-72 md:rounded-2xl bottom-0 left-0 right-0 md:bottom-auto md:left-auto rounded-t-3xl md:rounded-t-2xl bg-white shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
            </div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-headline text-base font-bold text-slate-900">Réglages</h3>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer les réglages"
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-highest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="settings-name" className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  Nom
                </label>
                <input
                  id="settings-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[40px]"
                />
              </div>
              <div>
                <label htmlFor="settings-role" className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  Rôle
                </label>
                <input
                  id="settings-role"
                  type="text"
                  value={profile.role}
                  onChange={(e) => update({ role: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[40px]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onResetAll}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <RotateCcw className="w-4 h-4" /> Tout réinitialiser
            </button>

            <p className="mt-3 text-[11px] text-on-surface-variant leading-relaxed">
              Les données sont stockées localement dans votre navigateur (localStorage). Aucune information n'est envoyée à un serveur.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
