import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { wipeLocalData } from '~/lib/wipeLocalData';
import { buildBackupFilename, createBackupFromStorage, serializeBackup } from '~/lib/importExport';
import { Dialog } from '~/ui/Dialog';
import { Button } from '~/ui/Button';

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

  const handleConfirm = async () => {
    if (pending != null) {
      try {
        localStorage.setItem(STORAGE_KEY, String(pending));
      } catch {
        /* ignore */
      }
    }
    await wipeLocalData();
    window.location.reload();
  };

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as { standalone?: boolean }).standalone === true);

  const downloadBackup = () => {
    try {
      const now = new Date();
      const blob = new Blob([serializeBackup(createBackupFromStorage(window.localStorage, now))], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildBackupFilename(now);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* rien à sauvegarder */
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => undefined}
      dismissable={false}
      role="alertdialog"
      size="md"
      title="Mise à jour majeure"
      description="Cette nouvelle version doit repartir d’un stockage vide : vos données locales vont être effacées."
      footer={
        <>
          <Button variant="secondary" icon={<Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />} onClick={downloadBackup}>
            Télécharger une sauvegarde
          </Button>
          <Button variant="primary" onClick={handleConfirm} data-autofocus>
            Effacer et recharger
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[14px] leading-snug text-ink-2">
        <p>Téléchargez d’abord une sauvegarde : vous pourrez la restaurer depuis Réglages, Données et sauvegarde.</p>
        {isStandalone && (
          <>
            <p className="font-medium text-ink">Réinstallez aussi l’application pour recevoir la mise à jour :</p>
            <ul className="space-y-1.5 border-l border-line pl-3">
              <li>
                <strong className="text-ink">iPhone, iPad</strong> : appui long sur l’icône, « Supprimer l’app », puis dans Safari, Partager, « Sur l’écran d’accueil ».
              </li>
              <li>
                <strong className="text-ink">Android</strong> : appui long sur l’icône, « Désinstaller », puis dans Chrome, menu, « Installer l’application ».
              </li>
            </ul>
          </>
        )}
      </div>
    </Dialog>
  );
};
