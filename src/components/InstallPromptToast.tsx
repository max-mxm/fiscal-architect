import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Share, X } from 'lucide-react';
import { BrandMark } from '~/shell/BrandMark';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';

interface InstallPromptToastProps {
  open: boolean;
  mode: 'native' | 'ios';
  onInstall: () => void;
  onDismiss: () => void;
}

/** Proposition d'installation, au-dessus de la barre d'onglets. */
export const InstallPromptToast: React.FC<InstallPromptToastProps> = ({ open, mode, onInstall, onDismiss }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-labelledby="pwa-install-title"
          aria-describedby="pwa-install-desc"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduced ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-md rounded-[var(--radius-card)] bg-ink p-4 text-card shadow-[var(--shadow-overlay)] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0"
        >
          <div className="flex items-start gap-3">
            <BrandMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p id="pwa-install-title" className="text-[17px] font-bold">
                Installer Fiscal Architect
              </p>
              <p id="pwa-install-desc" className="mt-0.5 text-[14px] leading-snug text-card/75">
                Une icône sur l’écran d’accueil, utilisable hors connexion. Vos données restent sur l’appareil.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fermer"
              className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-ctl)] text-card/75 hover:bg-white/10 hover:text-card"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {mode === 'native' ? (
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onDismiss} className="min-h-11 rounded-[var(--radius-ctl)] px-3 text-[14px] text-card/75 hover:bg-white/10 hover:text-card">
                Plus tard
              </button>
              <button type="button" onClick={onInstall} className="min-h-11 rounded-[var(--radius-ctl)] bg-primary px-4 text-[14px] font-bold text-white hover:bg-primary-hover">
                Installer
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-center gap-1.5 text-[14px] text-card/75">
                Touchez <Share className="h-4 w-4 text-card" strokeWidth={1.75} aria-label="Partager" /> puis{' '}
                <Plus className="h-4 w-4 text-card" strokeWidth={1.75} aria-hidden="true" /> « Sur l’écran d’accueil ».
              </p>
              <button type="button" onClick={onDismiss} className="min-h-11 rounded-[var(--radius-ctl)] bg-primary px-4 text-[14px] font-bold text-white">
                Compris
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
