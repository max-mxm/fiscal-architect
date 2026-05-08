import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Home } from 'lucide-react';
import { ErrorOrb } from '~/components/ErrorOrb';
import { cn } from '~/utils';

interface ErrorPageProps {
  kind: 'error' | 'not-found';
  /** Disponible uniquement quand kind === 'error'. Affiché dans un détail repliable. */
  error?: Error;
  /** Action principale : reload de l'app. Si non fourni, fallback sur window.location.reload. */
  onReload?: () => void;
}

const COPY = {
  error: {
    title: 'Quelque chose s\'est cassé',
    body: 'Une erreur inattendue s\'est produite. Vos données restent en sécurité dans votre navigateur.',
    cta: 'Recharger l\'app',
    Icon: RefreshCw,
  },
  'not-found': {
    title: 'Page introuvable',
    body: 'Cette adresse n\'existe pas dans Fiscal Architect.',
    cta: 'Retour à l\'accueil',
    Icon: Home,
  },
} as const;

/**
 * Fallback global quand TanStack Router rencontre une erreur ou une route
 * inconnue. Affiche un orbe ambre pulsant + texte rassurant + bouton de
 * reprise. Monté en isolation (en dehors du shell) — pas de TopBar ni
 * FiscalContextBar disponibles.
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({ kind, error, onReload }) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const copy = COPY[kind];

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const handleAction = () => {
    if (kind === 'not-found') {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return;
    }
    if (onReload) {
      onReload();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md flex flex-col items-center text-center"
      >
        <ErrorOrb />

        <div role="alert" className="mt-8 md:mt-10 space-y-2">
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            {copy.title}
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
            {copy.body}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleAction}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl',
              'bg-secondary text-on-secondary text-sm font-bold',
              'hover:opacity-90 transition-opacity',
              'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:ring-offset-2 focus:ring-offset-surface',
            )}
          >
            <copy.Icon className="w-4 h-4" aria-hidden="true" />
            <span>{copy.cta}</span>
          </button>
        </div>

        {kind === 'error' && error?.message && (
          <details className="mt-8 w-full text-left">
            <summary className="cursor-pointer text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors select-none">
              Détails techniques
            </summary>
            <pre className="mt-2 p-3 rounded-xl bg-surface-highest/40 text-[11px] text-on-surface-variant whitespace-pre-wrap break-words font-mono max-h-48 overflow-auto">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}
      </motion.div>
    </div>
  );
};
