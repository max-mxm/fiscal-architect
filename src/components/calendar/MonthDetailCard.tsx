import React from 'react';
import { cn } from '~/utils';
import { formatEuro } from '~/lib/format';
import { formatDaysFR } from '~/lib/calendar';
import { MetricTile } from './MetricTile';

interface MonthDetailCardProps {
  monthName: string;
  workedDays: number;
  caMensuel: number;
  netAvantIR: number;
  netApresIR: number;
  /** Compact = version mobile (valeurs text-xl). Sinon desktop (text-2xl). */
  compact?: boolean;
  className?: string;
}

export const MonthDetailCard: React.FC<MonthDetailCardProps> = ({
  monthName,
  workedDays,
  caMensuel,
  netAvantIR,
  netApresIR,
  compact = false,
  className,
}) => {
  const valueSize = compact ? 'md' : 'lg';
  return (
    <div className={cn('bg-surface-lowest rounded-2xl shadow-sm', compact ? 'p-4 lg:p-5' : 'p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline text-lg font-bold text-slate-900">{monthName}</h3>
        <span className={cn(
          'text-xs font-bold px-2.5 py-0.5 rounded-full',
          workedDays > 0 ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-400',
        )}>
          {formatDaysFR(workedDays)} jours
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MetricTile label="CA brut" value={`${formatEuro(caMensuel)}€`} size={valueSize} />
        <MetricTile
          label="Net avant IR"
          value={`${formatEuro(netAvantIR)}€`}
          tone={netAvantIR >= 0 ? 'positive' : 'negative'}
          size={valueSize}
        />
        <MetricTile
          label="Net après IR"
          value={`${formatEuro(netApresIR)}€`}
          tone={netApresIR >= 0 ? 'positive' : 'negative'}
          size={valueSize}
        />
      </div>
    </div>
  );
};
