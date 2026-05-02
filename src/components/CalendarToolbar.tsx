import React from 'react';
import { Sparkles, Eraser, Download, RotateCcw } from 'lucide-react';
import { cn } from '~/utils';

type Scope = 'month' | 'year';

interface CalendarToolbarProps {
  monthShort: string;
  year: number;
  onFill: (scope: Scope) => void;
  onClear: (scope: Scope) => void;
  onExport: () => void;
  onReset: () => void;
}

interface ActionGroupProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  monthLabel: string;
  yearLabel: string;
  onMonth: () => void;
  onYear: () => void;
  tone: 'fill' | 'clear';
}

const ActionGroup: React.FC<ActionGroupProps> = ({
  label,
  Icon,
  monthLabel,
  yearLabel,
  onMonth,
  onYear,
  tone,
}) => {
  const toneClass =
    tone === 'fill'
      ? 'bg-secondary/8 text-secondary border-secondary/15'
      : 'bg-red-50 text-red-700 border-red-200/60';
  const btnTone =
    tone === 'fill'
      ? 'hover:bg-white/80 active:bg-white text-secondary'
      : 'hover:bg-white/80 active:bg-white text-red-700';
  const focusRing = tone === 'fill' ? 'focus:ring-secondary/30' : 'focus:ring-red-500/30';

  return (
    <div className={cn('rounded-2xl border p-3 flex flex-col gap-2.5', toneClass)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onMonth}
          className={cn(
            'min-h-[44px] md:min-h-[40px] rounded-xl bg-white/60 text-sm font-bold transition-colors focus:outline-none focus:ring-2',
            btnTone,
            focusRing,
          )}
        >
          {monthLabel}
        </button>
        <button
          type="button"
          onClick={onYear}
          className={cn(
            'min-h-[44px] md:min-h-[40px] rounded-xl bg-white/60 text-sm font-bold transition-colors focus:outline-none focus:ring-2',
            btnTone,
            focusRing,
          )}
        >
          {yearLabel}
        </button>
      </div>
    </div>
  );
};

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  monthShort,
  year,
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
            className="w-11 h-11 md:w-9 md:h-9 inline-flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <ActionGroup
          label="Remplir"
          Icon={Sparkles}
          monthLabel={monthShort}
          yearLabel={String(year)}
          onMonth={() => onFill('month')}
          onYear={() => onFill('year')}
          tone="fill"
        />
        <ActionGroup
          label="Vider"
          Icon={Eraser}
          monthLabel={monthShort}
          yearLabel={String(year)}
          onMonth={() => onClear('month')}
          onYear={() => onClear('year')}
          tone="clear"
        />
      </div>
    </div>
  );
};
