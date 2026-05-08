import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '~/utils';
import { TAUX_VL_BNC } from '~/lib/fiscal';
import { HelpTooltip } from '~/components/ui/HelpTooltip';

interface VLToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** Taux VL effectif (0..1). Défaut : TAUX_VL_BNC (libéral SSI). */
  tauxVL?: number;
  /** Variant inline (chip cliquable dans MonthSummary). */
  variant?: 'default' | 'chip';
  /** Si true, l'utilisateur n'est pas éligible (RFR N-2 trop élevé) — bloque le toggle. */
  ineligibleReason?: string | null;
}

export const VLToggle: React.FC<VLToggleProps> = ({ value, onChange, tauxVL = TAUX_VL_BNC, variant = 'default', ineligibleReason = null }) => {
  const tauxLabel = (tauxVL * 100).toFixed(1).replace('.', ',');
  const blocked = !!ineligibleReason && !value;

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        title={value ? 'VL activé — cliquez pour désactiver' : 'VL désactivé — cliquez pour activer'}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 min-h-[28px] rounded-full text-[11px] font-bold tracking-tight transition-colors',
          value
            ? 'bg-secondary/10 text-secondary hover:bg-secondary/15'
            : 'bg-surface-highest/60 text-on-surface-variant hover:bg-surface-highest',
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            value ? 'bg-secondary' : 'bg-outline-variant',
          )}
        />
        VL {tauxLabel}%
      </button>
    );
  }

  return (
    <div className={cn(blocked && 'opacity-60')}>
      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="vl-toggle" className="text-xs font-bold uppercase tracking-wider text-secondary">
              Versement libératoire
            </label>
            <HelpTooltip termId="vl" />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Taux forfaitaire {tauxLabel}% en remplacement de l'IR au barème.
          </p>
        </div>
        <button
          id="vl-toggle"
          type="button"
          role="switch"
          aria-checked={value}
          aria-disabled={blocked}
          disabled={blocked}
          onClick={() => !blocked && onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
            blocked ? 'cursor-not-allowed bg-surface-highest' : 'cursor-pointer',
            !blocked && (value ? 'bg-secondary' : 'bg-surface-highest'),
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 mt-0.5',
              value ? 'translate-x-5 ml-0.5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
      {ineligibleReason && (
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30 px-3 py-2 text-[11px] leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{ineligibleReason}</span>
        </div>
      )}
    </div>
  );
};
