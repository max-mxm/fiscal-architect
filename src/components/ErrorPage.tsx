import React, { useEffect, useRef, useState } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import { wipeLocalData } from '~/lib/wipeLocalData';
import { Dialog } from '~/ui/Dialog';
import { Button } from '~/ui/Button';
import { BrandMark } from '~/shell/BrandMark';

interface ErrorPageProps {
  kind: 'error' | 'not-found';
  error?: Error;
  onReload?: () => void;
}

const COPY = {
  error: {
    title: 'Quelque chose s’est cassé',
    body: 'Une erreur inattendue a interrompu l’écran. Vos données restent intactes dans ce navigateur.',
    cta: 'Recharger l’application',
    Icon: RefreshCw,
  },
  'not-found': {
    title: 'Page introuvable',
    body: 'Cette adresse ne correspond à aucun écran de Fiscal Architect.',
    cta: 'Revenir au mois en cours',
    Icon: Home,
  },
} as const;

/** Une barre de répartition dont un morceau s'est détaché. */
function BrokenBar() {
  return (
    <svg viewBox="0 0 280 90" className="h-auto w-full max-w-[280px]" aria-hidden="true">
      <rect x="0" y="30" width="120" height="22" rx="11" fill="#00c875" />
      <rect x="126" y="30" width="46" height="22" rx="4" fill="#fdab3d" />
      <rect x="196" y="48" width="34" height="22" rx="6" fill="#ff5ac4" transform="rotate(14 213 59)" />
      <rect x="244" y="12" width="30" height="22" rx="11" fill="#a25ddc" transform="rotate(-18 259 23)" />
      <circle cx="186" cy="82" r="3" fill="#c8cbd9" />
      <circle cx="236" cy="84" r="2" fill="#c8cbd9" />
    </svg>
  );
}

/** Erreur globale et 404, hors du shell. */
export const ErrorPage: React.FC<ErrorPageProps> = ({ kind, error, onReload }) => {
  const btn = useRef<HTMLButtonElement | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const copy = COPY[kind];
  useEffect(() => btn.current?.focus(), []);

  const act = () => {
    if (typeof window === 'undefined') return;
    if (kind === 'not-found') {
      window.location.href = '/';
      return;
    }
    if (onReload) onReload();
    else window.location.reload();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ground text-ink">
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <BrandMark />
        <span className="text-[17px] font-extrabold">Fiscal Architect</span>
      </div>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10">
        <BrokenBar />
        <h1 className="mt-6 text-[30px] font-extrabold leading-tight tracking-[-0.01em]">{copy.title}</h1>
        <p className="mt-2 text-[16px] leading-snug text-ink-2 text-pretty">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button ref={btn} variant="primary" icon={<copy.Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />} onClick={act}>
            {copy.cta}
          </Button>
          {kind === 'error' && (
            <Button variant="ghost" onClick={() => setResetOpen(true)}>
              Effacer les données de l’app
            </Button>
          )}
        </div>
        {kind === 'error' && error?.message && (
          <details className="mt-6 text-[13px] text-ink-2">
            <summary className="min-h-9 pointer-coarse:min-h-11 cursor-pointer font-semibold">Détails techniques</summary>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-ctl)] bg-card p-3 font-mono text-[12px]">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}
      </main>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        role="alertdialog"
        size="sm"
        title="Effacer toutes les données ?"
        description="Profil, années, calendriers et réglages seront supprimés de ce navigateur. À réserver au cas où l’erreur revient à chaque ouverture."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)} data-autofocus>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await wipeLocalData();
                window.location.href = '/';
              }}
            >
              Tout effacer
            </Button>
          </>
        }
      />
    </div>
  );
};
