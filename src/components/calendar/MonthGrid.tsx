import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/utils';
import {
  DAY_HEADERS,
  formatDaysFR,
  getDaysInMonth,
  getFirstDayOffset,
  isWeekend as isWeekendFn,
} from '~/lib/calendar';
import { DayCell } from './DayCell';

interface MonthGridProps {
  year: number;
  monthIndex: number;
  monthName: string;
  workedDays: number[];
  halfDays: number[];
  workedDaysEquiv: number;
  /** Jour courant si le mois sélectionné est le mois courant, sinon null. */
  todayInMonth: number | null;
  navDirection: number;
  isJourFerie: (monthIndex: number, day: number) => boolean;
  getJourFerieName: (monthIndex: number, day: number) => string | undefined;
  onPrev: () => void;
  onNext: () => void;
  dragHandlers: {
    onDayPointerDown: (monthIndex: number, day: number) => void;
    onDayPointerEnter: (monthIndex: number, day: number) => void;
  };
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  year,
  monthIndex,
  monthName,
  workedDays,
  halfDays,
  workedDaysEquiv,
  todayInMonth,
  navDirection,
  isJourFerie,
  getJourFerieName,
  onPrev,
  onNext,
  dragHandlers,
}) => {
  const totalDays = getDaysInMonth(year, monthIndex);
  const offset = getFirstDayOffset(year, monthIndex);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }
  for (let d = 1; d <= totalDays; d++) {
    const weekend = isWeekendFn(year, monthIndex, d);
    const ferie = isJourFerie(monthIndex, d);
    cells.push(
      <DayCell
        key={d}
        day={d}
        isWeekend={weekend}
        isFerie={ferie}
        ferieName={getJourFerieName(monthIndex, d)}
        isWorked={workedDays.includes(d)}
        isHalf={halfDays.includes(d)}
        isToday={d === todayInMonth}
        onPointerDown={() => dragHandlers.onDayPointerDown(monthIndex, d)}
        onPointerEnter={() => dragHandlers.onDayPointerEnter(monthIndex, d)}
      />,
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="w-8 h-8 rounded-lg bg-surface-lowest flex items-center justify-center hover:bg-surface-highest/30 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
        </button>
        <div className="text-center">
          <h3 className="font-headline text-xl font-bold text-on-surface">{monthName}</h3>
          <span className={cn(
            'text-xs font-bold uppercase tracking-widest',
            workedDaysEquiv > 0 ? 'text-secondary' : 'text-on-surface-variant/60 italic',
          )}>
            {workedDaysEquiv > 0
              ? `${formatDaysFR(workedDaysEquiv)} jours travaillés`
              : 'Aucun jour sélectionné'}
          </span>
        </div>
        <button
          onClick={onNext}
          className="w-8 h-8 rounded-lg bg-surface-lowest flex items-center justify-center hover:bg-surface-highest/30 transition-colors shadow-sm"
        >
          <ChevronRight className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthIndex}
          initial={{ opacity: 0, x: navDirection * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: navDirection * -20 }}
          transition={{ duration: 0.15 }}
        >
          <div className="grid grid-cols-7 gap-2.5" role="grid" aria-label="Calendrier des jours travaillés">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-xs text-on-surface-variant/60 font-bold uppercase text-center pb-1" role="columnheader">{d}</div>
            ))}
            {cells}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
