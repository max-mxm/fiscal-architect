import React from 'react';
import { Sparkles, Eraser, Download, RotateCcw } from 'lucide-react';
import { cn } from '~/utils';

type Scope = 'month' | 'year';

interface CalendarToolbarProps {
  monthShort: string;
  monthLong: string;
  year: number;
  monthHasData: boolean;
  yearHasData: boolean;
  onFill: (scope: Scope) => void;
  onClear: (scope: Scope) => void;
  onExport: () => void;
  onReset: () => void;
}

interface FillButtonProps {
  label: string;
  ariaLabel: string;
  title: string;
  onClick: () => void;
}

const FillButton: React.FC<FillButtonProps> = ({ label, ariaLabel, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    title={title}
    className={cn(
      'min-h-[48px] md:min-h-[44px] w-full inline-flex items-center justify-center gap-2',
      'rounded-2xl bg-secondary text-on-secondary text-sm font-bold tracking-tight',
      'shadow-sm hover:bg-secondary/90 active:bg-secondary/85 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:ring-offset-1',
    )}
  >
    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
    <span className="truncate">{label}</span>
  </button>
);

interface ClearLinkProps {
  label: string;
  ariaLabel: string;
  title: string;
  onClick: () => void;
  disabled: boolean;
}

const ClearLink: React.FC<ClearLinkProps> = ({ label, ariaLabel, title, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    title={title}
    className={cn(
      'min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3',
      'rounded-xl text-xs font-bold tracking-tight transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-red-500/30',
      disabled
        ? 'text-on-surface-variant/50 cursor-not-allowed'
        : 'text-red-600 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10 dark:active:bg-red-500/20',
    )}
  >
    <Eraser className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <span className="truncate">{label}</span>
  </button>
);

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  monthShort,
  monthLong,
  year,
  monthHasData,
  yearHasData,
  onFill,
  onClear,
  onExport,
  onReset,
}) => {
  return (
    <div className="bg-surface-lowest rounded-3xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Actions calendrier
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onExport}
            aria-label="Exporter le calendrier en CSV"
            title="Exporter en CSV"
            className="w-11 h-11 md:w-9 md:h-9 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Tout réinitialiser"
            title="Tout réinitialiser"
            className="w-11 h-11 md:w-9 md:h-9 inline-flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FillButton
          label={`Remplir ${monthLong}`}
          ariaLabel={`Marquer tous les jours ouvrés de ${monthLong} ${year} comme travaillés`}
          title={`Marque tous les jours ouvrés de ${monthLong} (jours fériés ignorés)`}
          onClick={() => onFill('month')}
        />
        <FillButton
          label={`Remplir ${year}`}
          ariaLabel={`Marquer tous les jours ouvrés de l'année ${year} comme travaillés`}
          title={`Marque tous les jours ouvrés de l'année (jours fériés ignorés)`}
          onClick={() => onFill('year')}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1 pt-1 border-t border-outline-variant/15">
        <ClearLink
          label={`Vider ${monthShort}`}
          ariaLabel={`Vider ${monthLong} ${year}`}
          title={`Retire tous les jours travaillés de ${monthLong}`}
          onClick={() => onClear('month')}
          disabled={!monthHasData}
        />
        <ClearLink
          label={`Vider ${year}`}
          ariaLabel={`Vider l'année ${year}`}
          title={`Retire tous les jours travaillés de l'année`}
          onClick={() => onClear('year')}
          disabled={!yearHasData}
        />
      </div>
    </div>
  );
};
