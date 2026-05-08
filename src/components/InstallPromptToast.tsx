import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ShieldCheck, Share, Plus, X } from 'lucide-react';

interface InstallPromptToastProps {
  open: boolean;
  mode: 'native' | 'ios';
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallPromptToast: React.FC<InstallPromptToastProps> = ({
  open,
  mode,
  onInstall,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-labelledby="pwa-install-title"
          aria-describedby="pwa-install-desc"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[min(440px,calc(100vw-2rem))]"
        >
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white dark:bg-surface-lowest dark:text-on-surface dark:border dark:border-outline-variant/30 shadow-2xl">
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Fermer"
              className="absolute top-2 right-2 text-white/60 hover:text-white dark:text-on-surface-variant dark:hover:text-on-surface p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-4 pr-12">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-secondary-container/20 flex items-center justify-center">
                  <Download className="w-5 h-5 text-secondary-container" />
                </div>
                <div className="flex-1 min-w-0">
                  <p id="pwa-install-title" className="text-sm font-semibold">
                    Installer Fiscal Architect
                  </p>
                  <p
                    id="pwa-install-desc"
                    className="mt-1 flex items-center gap-1.5 text-xs text-white/75 dark:text-on-surface-variant"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Vos données restent dans votre navigateur — rien n'est envoyé sur un serveur.
                    </span>
                  </p>
                </div>
              </div>

              {mode === 'native' ? (
                <div className="mt-3 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="px-3 min-h-[36px] rounded-xl text-white/70 text-sm hover:text-white hover:bg-white/5 dark:text-on-surface-variant dark:hover:text-on-surface dark:hover:bg-surface-highest/40 transition-colors"
                  >
                    Plus tard
                  </button>
                  <button
                    type="button"
                    onClick={onInstall}
                    className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-xl bg-secondary-container/20 text-secondary-container text-sm font-bold hover:bg-secondary-container/30 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-container/50"
                  >
                    <Download className="w-3.5 h-3.5" /> Installer
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-white/75 dark:text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                    <span>Appuyez sur</span>
                    <Share className="w-4 h-4 inline-block" aria-label="Partager" />
                    <span>puis</span>
                    <Plus className="w-4 h-4 inline-block" aria-label="Plus" />
                    <span>« Sur l'écran d'accueil ».</span>
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="inline-flex items-center px-3 min-h-[36px] rounded-xl bg-secondary-container/20 text-secondary-container text-sm font-bold hover:bg-secondary-container/30 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-container/50"
                    >
                      J'ai compris
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
