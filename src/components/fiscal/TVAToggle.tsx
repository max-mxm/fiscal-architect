import React from 'react';
import { cn } from '~/utils';
import { HelpTooltip } from '~/components/ui/HelpTooltip';

interface TVAToggleProps {
  value: boolean;
  rate: number;
  onChange: (next: boolean) => void;
  onRateChange: (next: number) => void;
}

export const TVAToggle: React.FC<TVAToggleProps> = ({ value, rate, onChange, onRateChange }) => {
  const percentage = Math.round(rate * 10000) / 100;

  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-surface-low p-4">
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

      <div
        className={cn(
          'mt-3 rounded-xl px-3 py-2.5 text-xs leading-relaxed',
          value ? 'bg-tax-container text-on-surface' : 'bg-surface-lowest text-on-surface-variant',
        )}
        role="status"
      >
        <span className={cn('font-bold', value && 'text-tax')}>
          {value ? `TVA active · ${percentage.toLocaleString('fr-FR')} % sur vos factures` : 'Franchise en base · TVA non facturée'}
        </span>
        <span className="block mt-0.5">
          {value
            ? 'Vos montants de CA et votre TJM restent saisis hors taxes ; le TTC est calculé automatiquement.'
            : 'Mention à afficher sur vos factures : « TVA non applicable, art. 293 B du CGI ». '}
        </span>
      </div>

      {value && (
        <div className="mt-4">
          <label htmlFor="tva-rate" className="block text-xs font-bold uppercase tracking-wider text-tax">
            Taux de TVA facturé
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="tva-rate"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.1}
              value={percentage}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) onRateChange(Math.max(0, Math.min(100, next)) / 100);
              }}
              aria-describedby="tva-rate-help"
              className="w-28 min-h-[44px] rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 font-mono text-sm font-bold text-on-surface focus:border-tax focus:outline-none focus:ring-2 focus:ring-tax/20"
            />
            <span className="font-bold text-tax">%</span>
          </div>
          <p id="tva-rate-help" className="mt-1.5 text-[11px] leading-relaxed text-on-surface-variant">
            Saisissez le taux appliqué à vos prestations ; 20 % est le taux proposé par défaut.
          </p>
        </div>
      )}
    </section>
  );
};
