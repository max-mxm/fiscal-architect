import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Smartphone, Apple } from 'lucide-react';

const STORAGE_KEY = 'fiscal-breaking-version';
const VERSION_URL = '/version.json';

type VersionPayload = { breakingVersion: number; appVersion?: string };

async function fetchRemoteVersion(): Promise<VersionPayload | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as VersionPayload;
    if (typeof data.breakingVersion !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

async function wipeEverything(): Promise<void> {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
  }
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Détecte les mises à jour majeures déployées en prod (changement de
 * `breakingVersion` dans /version.json) et propose à l'utilisateur de
 * réinitialiser ses données + désinstaller/réinstaller la PWA.
 *
 * Premier lancement : la version courante est mémorisée silencieusement.
 */
export const BreakingUpdateGate: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await fetchRemoteVersion();
      if (cancelled || !remote) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored == null) {
        localStorage.setItem(STORAGE_KEY, String(remote.breakingVersion));
        return;
      }
      const storedNum = parseInt(stored, 10);
      if (!Number.isNaN(storedNum) && storedNum !== remote.breakingVersion) {
        setPending(remote.breakingVersion);
        setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleConfirm = async () => {
    if (pending != null) {
      try {
        localStorage.setItem(STORAGE_KEY, String(pending));
      } catch {
        /* ignore */
      }
    }
    await wipeEverything();
    window.location.reload();
  };

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as { standalone?: boolean }).standalone === true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm"
        >
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative bg-surface-lowest rounded-3xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id={titleId} className="font-headline text-base font-bold text-on-surface">
                  Mise à jour majeure détectée
                </h3>
                <div id={descId} className="text-sm text-on-surface-variant mt-1.5 leading-relaxed space-y-2">
                  <p>
                    Une nouvelle version a été déployée et nécessite une réinitialisation
                    complète. Vos données locales (calendrier, profil, charges) vont être
                    effacées.
                  </p>
                  {isStandalone && (
                    <p>
                      Pour bénéficier de la mise à jour, vous devez aussi{' '}
                      <strong>désinstaller puis réinstaller l'application</strong> :
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isStandalone && (
              <div className="mt-4 grid gap-2">
                <div className="rounded-xl bg-surface-highest/40 px-3 py-2.5 flex items-start gap-2.5">
                  <Apple className="w-4 h-4 shrink-0 mt-0.5 text-on-surface-variant" />
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    <strong>iOS</strong> — appui long sur l'icône de l'app sur l'écran d'accueil →
                    « Supprimer l'app » → puis Safari → menu Partager → « Sur l'écran d'accueil ».
                  </p>
                </div>
                <div className="rounded-xl bg-surface-highest/40 px-3 py-2.5 flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-on-surface-variant" />
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    <strong>Android</strong> — appui long sur l'icône → « Désinstaller » → puis
                    Chrome → menu ⋮ → « Installer l'application ».
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                ref={closeBtnRef}
                type="button"
                onClick={handleConfirm}
                className="px-4 min-h-[44px] rounded-xl text-sm font-bold bg-secondary hover:opacity-90 text-on-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                Réinitialiser et recharger
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
