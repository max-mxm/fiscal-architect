import React from 'react';
import { cn } from '~/utils';
import { IJ_RATE_LIBERAL } from '~/lib/fiscal';
import type { ActivityEntry } from '~/types';
import { HelpTooltip } from '~/components/ui/HelpTooltip';

interface IJToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  activities: ActivityEntry[];
}

export const IJToggle: React.FC<IJToggleProps> = ({ value, onChange, activities }) => {
  const hasLiberal = activities.some((a) => a.type === 'liberalSsi' || a.type === 'liberalCipav');
  const tauxLabel = (IJ_RATE_LIBERAL * 100).toFixed(2).replace('.', ',');
  const disabled = !hasLiberal;

  return (
    <div className={cn(disabled && 'opacity-50')}>
      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="ij-toggle" className="text-xs font-bold uppercase tracking-wider text-secondary">
              Indemnités journalières
            </label>
            <HelpTooltip termId="ij" />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {disabled
              ? 'Disponible uniquement pour les activités libérales (SSI/CIPAV).'
              : `Cotisation ${tauxLabel} % du CA pour ouvrir des droits aux IJ maladie.`}
          </p>
        </div>
        <button
          id="ij-toggle"
          type="button"
          role="switch"
          aria-checked={value}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => !disabled && onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
            disabled ? 'cursor-not-allowed bg-surface-highest' : 'cursor-pointer',
            !disabled && (value ? 'bg-secondary' : 'bg-surface-highest'),
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
