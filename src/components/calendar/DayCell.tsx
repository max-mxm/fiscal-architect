import React from 'react';
import { cn } from '~/utils';

interface DayCellProps {
  day: number;
  isWeekend: boolean;
  isFerie: boolean;
  ferieName?: string;
  isWorked: boolean;
  isHalf: boolean;
  isToday: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

function buildTitle(args: {
  isWeekend: boolean;
  isFerie: boolean;
  ferieName?: string;
  isWorked: boolean;
  isHalf: boolean;
}): string | undefined {
  const { isWeekend, isFerie, ferieName, isWorked, isHalf } = args;
  if (isWeekend) return undefined;
  if (isFerie) return ferieName ?? 'Jour férié';
  if (!isWorked && !isHalf) return 'Clic : journée pleine — encore : demi-journée';
  if (isWorked) return 'Journée pleine — clic : demi-journée';
  if (isHalf) return 'Demi-journée — clic : effacer';
  return undefined;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  isWeekend,
  isFerie,
  ferieName,
  isWorked,
  isHalf,
  isToday,
  onMouseDown,
  onMouseEnter,
}) => {
  const title = buildTitle({ isWeekend, isFerie, ferieName, isWorked, isHalf });

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      onMouseEnter={onMouseEnter}
      title={title}
      className={cn(
        'h-14 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all select-none relative',
        isWeekend
          ? 'bg-surface-highest/30 text-on-surface-variant/40 cursor-default'
          : isFerie && !isWorked && !isHalf
            ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-default hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/20'
            : !isWorked && !isHalf
              ? 'bg-surface-highest/10 text-on-surface-variant cursor-pointer hover:bg-secondary/10 hover:text-secondary hover:ring-1 hover:ring-secondary/30'
              : 'cursor-pointer',
        isWorked && !isWeekend && 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20 hover:bg-secondary/90',
        isHalf && !isWeekend && 'text-white shadow-md shadow-secondary/15 hover:brightness-95 bg-[linear-gradient(135deg,var(--color-secondary)_50%,var(--color-half-accent)_50%)]',
        isToday && 'ring-2 ring-secondary ring-offset-1',
      )}
    >
      <span className="relative z-10">{day}</span>
      {isHalf && !isWeekend && (
        <span className="absolute top-0.5 right-1 text-[9px] font-black tracking-tight text-on-surface/80 dark:text-on-surface/90 z-10">½</span>
      )}
      {isFerie && !isWeekend && !isWorked && !isHalf && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
      )}
    </div>
  );
};
