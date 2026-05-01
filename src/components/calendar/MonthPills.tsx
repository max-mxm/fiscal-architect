import React from 'react';
import type { CalendarMonth } from '~/types';
import { cn } from '~/utils';
import { MONTH_SHORT } from '~/lib/calendar';
import { calcEquivDays } from '~/lib/fiscal';

interface MonthPillsProps {
  months: CalendarMonth[];
  selectedMonth: number;
  currentMonthIndex: number;
  onSelect: (month: number) => void;
}

export const MonthPills: React.FC<MonthPillsProps> = ({
  months,
  selectedMonth,
  currentMonthIndex,
  onSelect,
}) => {
  return (
    <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
      <div className="flex gap-1.5 min-w-max">
        {MONTH_SHORT.map((name, i) => {
          const hasData = calcEquivDays(months[i]) > 0;
          const isSelected = i === selectedMonth;
          const isCurrent = i === currentMonthIndex;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                'snap-start relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                isSelected
                  ? 'bg-secondary text-white shadow-lg'
                  : 'bg-surface-lowest text-on-surface-variant hover:bg-surface-highest/30',
                isCurrent && !isSelected && 'ring-1 ring-secondary/30',
              )}
            >
              {name}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-secondary-container" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
