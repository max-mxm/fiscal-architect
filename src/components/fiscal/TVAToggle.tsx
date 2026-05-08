import React from 'react';
import { cn } from '~/utils';
import { HelpTooltip } from '~/components/ui/HelpTooltip';

interface TVAToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
}

export const TVAToggle: React.FC<TVAToggleProps> = ({ value, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between min-h-[44px] gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor="tva-toggle" className="text-xs font-bold uppercase tracking-wider text-secondary">
              TVA assujettie
            </label>
            <HelpTooltip termId="franchiseEnBase" />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
            Désactivé = franchise en base. À activer si vous facturez la TVA à vos clients.
          </p>
        </div>
        <button
          id="tva-toggle"
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
            value ? 'bg-amber-500' : 'bg-surface-highest',
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
