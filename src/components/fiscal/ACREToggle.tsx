import React from 'react';
import { cn } from '~/utils';
import { ACRE_DURATION_MONTHS, ACRE_RATE_AFTER, ACRE_RATE_BEFORE, ACRE_TRANSITION_DATE } from '~/lib/fiscal';
import { HelpTooltip } from '~/components/ui/HelpTooltip';

interface ACREToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** ISO 'YYYY-MM-DD'. Si absent, le toggle est désactivé. */
  creationDate: string | undefined;
}

function formatFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export const ACREToggle: React.FC<ACREToggleProps> = ({ value, onChange, creationDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const created = creationDate ? new Date(creationDate) : null;
  const expiry = created ? new Date(created) : null;
  if (expiry) expiry.setMonth(expiry.getMonth() + ACRE_DURATION_MONTHS);

  const noDate = !created;
  const expired = !!(expiry && today >= expiry);
  const disabled = noDate || expired;
  const rate = created && created < ACRE_TRANSITION_DATE ? ACRE_RATE_BEFORE : ACRE_RATE_AFTER;
  const ratePct = Math.round(rate * 100);

  const description = (() => {
    if (noDate) return 'Renseignez votre date de création pour activer l\'ACRE.';
    if (expired) return `Période de 12 mois écoulée le ${formatFR(expiry!)} — non applicable.`;
    return `Réduction de ${ratePct} % URSSAF pendant 12 mois (jusqu'au ${formatFR(expiry!)}).`;
  })();

  return (
    <div>
      <div className="flex items-center justify-between min-h-[44px] gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor="acre-toggle" className="text-xs font-bold uppercase tracking-wider text-secondary">
              ACRE
            </label>
            <HelpTooltip termId="acre" />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{description}</p>
        </div>
        <button
          id="acre-toggle"
          type="button"
          role="switch"
          aria-checked={value && !disabled}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => !disabled && onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
            disabled
              ? 'bg-surface-highest cursor-not-allowed opacity-60'
              : value
                ? 'bg-secondary cursor-pointer'
                : 'bg-surface-highest cursor-pointer',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 mt-0.5',
              value && !disabled ? 'translate-x-5 ml-0.5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  );
};
