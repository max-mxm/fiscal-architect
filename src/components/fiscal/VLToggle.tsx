import React from 'react';
import { cn } from '~/utils';
import { TAUX_VL_BNC } from '~/lib/fiscal';

interface VLToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** Variant inline (chip cliquable dans MonthSummary). */
  variant?: 'default' | 'chip';
}

export const VLToggle: React.FC<VLToggleProps> = ({ value, onChange, variant = 'default' }) => {
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
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            value ? 'bg-secondary' : 'bg-slate-400',
          )}
        />
        VL {(TAUX_VL_BNC * 100).toFixed(1)}%
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <label htmlFor="vl-toggle" className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em] block">
            Versement libératoire
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Taux forfaitaire {(TAUX_VL_BNC * 100).toFixed(1)}% en remplacement de l'IR au barème.
          </p>
        </div>
        <button
          id="vl-toggle"
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
            value ? 'bg-secondary' : 'bg-slate-300',
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
    </div>
  );
};
