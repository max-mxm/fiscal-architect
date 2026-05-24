import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '~/utils';

interface TjmMonthChipProps {
  /** TJM applicable au mois affiché (déjà résolu via `resolveMonthlyTjm`). */
  tjm: number;
  /**
   * Le mois affiché a-t-il une surcharge dans `tjmByMonth` ?
   * Si `false`, le composant ne rend rien : le TJM par défaut est déjà visible
   * via le slider principal, l'afficher une seconde fois serait du bruit.
   */
  isCustom: boolean;
  /** TJM par défaut de l'année — sert à afficher le delta. */
  defaultTjm: number;
  /** Si fourni, le chip devient cliquable (ouvre l'éditeur de TJM mensuel). */
  onClick?: () => void;
  /**
   * - `compact` : pill horizontale, idéal pour SlidersBlock / KeyMetrics
   * - `full` : ligne `label … valeur` style item de liste, idéal pour MonthSummary
   */
  variant?: 'compact' | 'full';
  /** Nom du mois affiché — utilisé dans l'aria-label uniquement. */
  monthName?: string;
  className?: string;
}

function formatDelta(delta: number): string {
  if (delta === 0) return '';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${Math.abs(delta)} €`;
}

/**
 * Indicateur du TJM personnalisé pour le mois affiché. Ne se rend QUE si
 * `isCustom === true` — quand le TJM applicable diffère du défaut annuel.
 * Le TJM par défaut est déjà visible via le slider principal, donc l'afficher
 * en double dans les vues récap n'apporte rien (progressive disclosure).
 *
 * Cliquable pour ouvrir l'éditeur de TJM mensuel positionné sur le mois courant.
 */
export const TjmMonthChip: React.FC<TjmMonthChipProps> = ({
  tjm,
  isCustom,
  defaultTjm,
  onClick,
  variant = 'compact',
  monthName,
  className,
}) => {
  // Pas de surcharge → pas d'indicateur. L'info n'apporte rien de nouveau.
  if (!isCustom) return null;

  const delta = tjm - defaultTjm;
  const interactive = typeof onClick === 'function';

  const ariaLabel = monthName
    ? `TJM personnalisé pour ${monthName} : ${tjm} euros par jour${interactive ? '. Cliquer pour modifier.' : ''}`
    : `TJM personnalisé : ${tjm} euros par jour`;

  const Wrapper = (interactive ? 'button' : 'div') as 'button' | 'div';

  // --- Variante FULL : ligne d'item (utilisée dans MonthSummary) ---
  if (variant === 'full') {
    return (
      <Wrapper
        type={interactive ? 'button' : undefined}
        onClick={onClick}
        aria-label={interactive ? ariaLabel : undefined}
        className={cn(
          'w-full flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 -mx-1.5',
          'transition-colors',
          interactive && 'min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 hover:bg-surface-low cursor-pointer',
          className,
        )}
      >
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Sparkles className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
          <span className="font-medium text-on-surface">TJM ce mois</span>
          <span
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.1em] text-secondary bg-secondary-container/40 rounded-full px-1.5 py-0.5"
            aria-hidden="true"
          >
            Personnalisé
          </span>
        </span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="font-mono font-bold tabular-nums text-secondary">
            {tjm} €/j
          </span>
          {delta !== 0 && (
            <span
              className="font-mono font-bold tabular-nums text-[10px] text-secondary/80"
              aria-hidden="true"
            >
              {formatDelta(delta)}
            </span>
          )}
        </span>
      </Wrapper>
    );
  }

  // --- Variante COMPACT : pill horizontale (utilisée dans SlidersBlock / KeyMetrics) ---
  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      aria-label={interactive ? ariaLabel : undefined}
      className={cn(
        'w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2',
        'transition-colors bg-secondary-container/30 border border-secondary/40',
        interactive && 'min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 cursor-pointer hover:bg-secondary-container/45',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] truncate text-secondary">
          TJM ce mois
        </span>
        <span
          className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-[0.1em] text-secondary bg-secondary-container/50 rounded-full px-1.5 py-0.5"
          aria-hidden="true"
        >
          Personnalisé
        </span>
      </span>
      <span className="inline-flex items-baseline gap-1.5 shrink-0">
        <span className="font-mono font-black tabular-nums text-sm text-secondary">
          {tjm} €/j
        </span>
        {delta !== 0 && (
          <span
            className="font-mono font-bold tabular-nums text-[10px] text-secondary/80"
            aria-hidden="true"
          >
            {formatDelta(delta)}
          </span>
        )}
      </span>
    </Wrapper>
  );
};
