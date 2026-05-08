import React from 'react';
import type { CalendarMonth } from '~/types';
import { cn } from '~/utils';
import { MONTH_SHORT } from '~/lib/calendar';
import { calcEquivDays } from '~/lib/fiscal';

interface AnnualMiniBarsProps {
  months: CalendarMonth[];
  selectedMonth: number;
  onSelect: (month: number) => void;
}

export const AnnualMiniBars: React.FC<AnnualMiniBarsProps> = ({ months, selectedMonth, onSelect }) => {
  const maxWorkedDays = Math.max(1, ...months.map((m) => calcEquivDays(m)));

  return (
    <div className="bg-surface-lowest p-4 rounded-2xl shadow-sm">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2">
        Progression annuelle
      </h4>
      <div className="flex items-end justify-between gap-0.5">
        {months.map((m, i) => {
          const workedCount = calcEquivDays(m);
          const heightPercent = (workedCount / maxWorkedDays) * 100;
          const isSelected = i === selectedMonth;
          const hasData = workedCount > 0;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="flex flex-col items-center gap-0.5 flex-1 group"
            >
              <div className="w-full h-10 flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all',
                    isSelected
                      ? 'bg-secondary'
                      : hasData
                        ? 'bg-half-accent group-hover:bg-secondary/40'
                        : 'bg-surface-highest/40',
                  )}
                  style={{ height: hasData ? `${Math.max(8, heightPercent)}%` : '8%' }}
                />
              </div>
              <span className={cn(
                'text-[7px] font-bold uppercase',
                isSelected ? 'text-secondary' : 'text-on-surface-variant/60',
              )}>
                {MONTH_SHORT[i]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
