import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DAY_HEADERS, MONTH_NAMES, getDaysInMonth, getFirstDayOffset, isWeekend } from '~/lib/calendar';
import { usePaintGesture, type DayState } from '~/hooks/usePaintGesture';
import { cn } from '~/utils';

interface MonthCalendarProps {
  year: number;
  monthIndex: number;
  workedDays: number[];
  halfDays: number[];
  todayInMonth: number | null;
  isJourFerie: (monthIndex: number, day: number) => boolean;
  getJourFerieName: (monthIndex: number, day: number) => string | undefined;
  cycleDay: (monthIndex: number, day: number) => void;
  dragSetDay: (monthIndex: number, day: number, add: boolean) => void;
}

const WEEKDAY_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const STATE_LABEL: Record<DayState, string> = {
  empty: 'non travaillé',
  full: 'journée pleine',
  half: 'demi-journée',
};

export function MonthCalendar({
  year,
  monthIndex,
  workedDays,
  halfDays,
  todayInMonth,
  isJourFerie,
  getJourFerieName,
  cycleDay,
  dragSetDay,
}: MonthCalendarProps) {
  const total = getDaysInMonth(year, monthIndex);
  const offset = getFirstDayOffset(year, monthIndex);
  const worked = useMemo(() => new Set(workedDays), [workedDays]);
  const half = useMemo(() => new Set(halfDays), [halfDays]);

  const isLocked = useCallback(
    (d: number) => isWeekend(year, monthIndex, d) || isJourFerie(monthIndex, d),
    [year, monthIndex, isJourFerie],
  );
  const getState = useCallback(
    (d: number): DayState => (worked.has(d) ? 'full' : half.has(d) ? 'half' : 'empty'),
    [worked, half],
  );

  const { gridRef, onPointerDown, onClick } = usePaintGesture({
    isLocked,
    getState,
    cycle: (d) => cycleDay(monthIndex, d),
    paint: (d, add) => dragSetDay(monthIndex, d, add),
  });

  // Tabulation itinérante : un seul jour dans l'ordre de tabulation.
  const firstOpen = useMemo(() => {
    for (let d = 1; d <= total; d++) if (!isLocked(d)) return d;
    return 1;
  }, [total, isLocked]);
  const [focusDay, setFocusDay] = useState<number>(todayInMonth ?? firstOpen);
  useEffect(() => setFocusDay(todayInMonth ?? firstOpen), [monthIndex, year, todayInMonth, firstOpen]);
  const buttons = useRef<Record<number, HTMLButtonElement | null>>({});

  const moveFocus = (to: number) => {
    const next = Math.min(total, Math.max(1, to));
    setFocusDay(next);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (day: number, e: React.KeyboardEvent) => {
    const col = (offset + day - 1) % 7;
    const map: Record<string, number> = {
      ArrowRight: day + 1,
      ArrowLeft: day - 1,
      ArrowDown: day + 7,
      ArrowUp: day - 7,
      Home: day - col,
      End: day + (6 - col),
    };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    }
  };

  const ferieNames = useMemo(() => {
    const out: string[] = [];
    for (let d = 1; d <= total; d++) {
      if (isJourFerie(monthIndex, d)) out.push(`${d} ${MONTH_NAMES[monthIndex].toLowerCase()} : ${getJourFerieName(monthIndex, d) ?? 'férié'}`);
    }
    return out;
  }, [total, monthIndex, isJourFerie, getJourFerieName]);

  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div>
      <div
        ref={gridRef}
        role="grid"
        aria-label={`Jours travaillés, ${MONTH_NAMES[monthIndex].toLowerCase()} ${year}`}
        className="select-none touch-pan-y [-webkit-touch-callout:none]"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div role="row" className="grid grid-cols-7 gap-1 pb-1">
          {DAY_HEADERS.map((h, i) => (
            <div
              key={h}
              role="columnheader"
              aria-label={WEEKDAY_LONG[i]}
              className={cn('text-center text-[12px] font-bold', i >= 5 ? 'text-ink-3' : 'text-ink-2')}
            >
              {h.charAt(0)}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {rows.map((row, r) => (
            <div key={r} role="row" className="grid grid-cols-7 gap-1">
              {row.map((day, c) => {
                if (day == null) return <div key={`x${c}`} role="gridcell" aria-hidden="true" />;
                const weekend = isWeekend(year, monthIndex, day);
                const ferie = !weekend && isJourFerie(monthIndex, day);
                const state = getState(day);
                const locked = weekend || ferie;
                const isToday = todayInMonth === day;
                const label = `${WEEKDAY_LONG[(offset + day - 1) % 7]} ${day} ${MONTH_NAMES[monthIndex].toLowerCase()}, ${
                  ferie ? `férié (${getJourFerieName(monthIndex, day) ?? ''})` : weekend ? 'week-end' : STATE_LABEL[state]
                }${isToday ? ", aujourd'hui" : ''}`;
                return (
                  <div key={day} role="gridcell" aria-selected={state !== 'empty'}>
                    <button
                      ref={(el) => {
                        buttons.current[day] = el;
                      }}
                      type="button"
                      data-day={day}
                      tabIndex={day === focusDay ? 0 : -1}
                      aria-label={label}
                      aria-pressed={locked ? undefined : state === 'full' ? true : state === 'half' ? 'mixed' : false}
                      aria-disabled={locked || undefined}
                      title={ferie ? getJourFerieName(monthIndex, day) : undefined}
                      onPointerDown={(e) => onPointerDown(day, e)}
                      onClick={() => onClick(day)}
                      onKeyDown={(e) => onKeyDown(day, e)}
                      onFocus={() => setFocusDay(day)}
                      className={cn(
                        'relative block h-11 w-full overflow-hidden rounded-[9px] text-left sm:h-12 md:h-14',
                        'transition-[background-color,color,transform] duration-150 active:scale-95',
                        weekend && 'cursor-default text-ink-3/70',
                        ferie && 'cursor-not-allowed bg-warn-soft text-warn-ink',
                        !locked && state === 'empty' && 'bg-card-2 text-ink-2 hover:bg-ca-soft hover:text-ca-ink',
                        !locked && state === 'full' && 'bg-ca text-ca-on',
                        !locked && state === 'half' && 'bg-ca-light text-ca-on',
                        isToday && 'ring-2 ring-ink ring-offset-2 ring-offset-card',
                      )}
                    >
                      {!locked && state === 'half' && (
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2 bg-ca" />
                      )}
                      <span className="relative z-[1] block px-2 pt-1.5 text-[14px] font-bold leading-none tnum md:text-[15px]">
                        {day}
                      </span>
                      {!locked && state === 'half' && (
                        <span aria-hidden="true" className="absolute bottom-1 right-1.5 text-[12px] font-extrabold leading-none text-ink">
                          ½
                        </span>
                      )}
                      {ferie && (
                        <span aria-hidden="true" className="absolute bottom-1 left-2 text-[11px] font-bold">
                          férié
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[13px] text-ink-3">
        <span className="pointer-coarse:hidden">Clic : journée, puis demi-journée, puis effacer. Cliquer-glisser coche plusieurs jours.</span>
        <span className="hidden pointer-coarse:inline">Toucher : journée, puis demi-journée, puis effacer. Appui long puis glisser coche plusieurs jours.</span>
      </p>
      {ferieNames.length > 0 && <p className="mt-1 text-[13px] text-ink-3">Férié : {ferieNames.join(' · ')}</p>}
    </div>
  );
}
