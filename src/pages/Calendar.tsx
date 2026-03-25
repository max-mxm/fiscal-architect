import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Sparkles,
  Trash2,
  Share2,
  Plus,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { UserProfile, FiscalYear, CalendarMonth } from '~/types';
import { cn } from '~/utils';
import { calcSeuilDate } from '~/lib/fiscal';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { FiscalControls } from '~/components/FiscalControls';

interface CalendarProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

const DAY_HEADERS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function createEmptyFiscalYear(year: number): FiscalYear {
  const months: CalendarMonth[] = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    workedDays: [],
  }));
  return { year, months };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0 (Mon) – 6 (Sun) for the 1st of the month */
function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1; // convert to Mon-first
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '€';
}

function formatEuroDetailed(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

function formatDateFR(date: Date): { day: number; monthName: string; year: number } {
  return {
    day: date.getDate(),
    monthName: MONTH_NAMES[date.getMonth()],
    year: date.getFullYear(),
  };
}

export const Calendar: React.FC<CalendarProps> = ({ profile, setProfile }) => {
  const now = new Date();
  const year = now.getFullYear();
  const todayDate = now.getDate();
  const currentMonthIndex = now.getMonth();

  const [fiscalYear, setFiscalYear] = useLocalStorage<FiscalYear>(`fiscal-calendar-${year}`, createEmptyFiscalYear(year));
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [navDirection, setNavDirection] = useState<number>(1);
  const [editingSeuil, setEditingSeuil] = useState(false);
  const [seuilInput, setSeuilInput] = useState(String(profile.seuilMicro));
  const [showConfig, setShowConfig] = useState(false);

  // --- Drag-to-select state ---
  const dragging = useRef(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const dragMonth = useRef<number>(-1);

  const setDay = useCallback((monthIndex: number, day: number, add: boolean) => {
    if (isWeekend(year, monthIndex, day)) return;
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== monthIndex) return m;
        const has = m.workedDays.includes(day);
        if (add && !has) {
          return { ...m, workedDays: [...m.workedDays, day].sort((a, b) => a - b) };
        }
        if (!add && has) {
          return { ...m, workedDays: m.workedDays.filter((d) => d !== day) };
        }
        return m;
      });
      return { ...prev, months: newMonths };
    });
  }, [year]);

  const handleDayMouseDown = useCallback((monthIndex: number, day: number) => {
    if (isWeekend(year, monthIndex, day)) return;
    dragging.current = true;
    dragMonth.current = monthIndex;
    const isWorked = fiscalYear.months[monthIndex].workedDays.includes(day);
    dragMode.current = isWorked ? 'remove' : 'add';
    setDay(monthIndex, day, !isWorked);
  }, [year, fiscalYear, setDay]);

  const handleDayMouseEnter = useCallback((monthIndex: number, day: number) => {
    if (!dragging.current) return;
    if (monthIndex !== dragMonth.current) return;
    if (isWeekend(year, monthIndex, day)) return;
    setDay(monthIndex, day, dragMode.current === 'add');
  }, [year, setDay]);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Navigate months
  const goToMonth = (month: number) => {
    setNavDirection(month > selectedMonth ? 1 : -1);
    setSelectedMonth(month);
  };

  const prevMonth = () => {
    setNavDirection(-1);
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const nextMonth = () => {
    setNavDirection(1);
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  // Fill weekdays for selected month only
  const fillMonthBusinessDays = () => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== selectedMonth) return m;
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d)) weekdays.push(d);
        }
        return { ...m, workedDays: weekdays };
      });
      return { ...prev, months: newMonths };
    });
  };

  // Fill all months
  const fillAllBusinessDays = () => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m) => {
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d)) weekdays.push(d);
        }
        return { ...m, workedDays: weekdays };
      });
      return { ...prev, months: newMonths };
    });
  };

  // Clear selected month
  const clearMonth = () => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== selectedMonth) return m;
        return { ...m, workedDays: [] };
      });
      return { ...prev, months: newMonths };
    });
  };

  // Clear all
  const clearAll = () => {
    setFiscalYear(createEmptyFiscalYear(year));
  };

  // Export CSV
  const exportCSV = () => {
    const header = 'Mois,Jours travaillés,CA (€)\n';
    const rows = fiscalYear.months
      .map((m) => {
        const ca = m.workedDays.length * profile.tjm;
        return `${MONTH_NAMES[m.month]},${m.workedDays.length},${ca}`;
      })
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `previsions-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Seuil editing
  const handleSeuilSubmit = () => {
    const val = parseInt(seuilInput, 10);
    if (!isNaN(val) && val > 0) {
      setProfile((prev) => ({ ...prev, seuilMicro: val }));
    } else {
      setSeuilInput(String(profile.seuilMicro));
    }
    setEditingSeuil(false);
  };

  // Computed values
  const chargesFixesMensuelles = useMemo(
    () => profile.fixedCosts.reduce((sum, c) => sum + c.amount, 0),
    [profile.fixedCosts],
  );

  const totalWorkedDays = useMemo(
    () => fiscalYear.months.reduce((sum, m) => sum + m.workedDays.length, 0),
    [fiscalYear],
  );

  const caCumule = useMemo(() => totalWorkedDays * profile.tjm, [totalWorkedDays, profile.tjm]);

  const seuilMicro = profile.seuilMicro;

  const progressPercent = useMemo(
    () => Math.min(100, (caCumule / seuilMicro) * 100),
    [caCumule, seuilMicro],
  );

  const remainingDays = useMemo(
    () => (caCumule >= seuilMicro ? 0 : Math.ceil((seuilMicro - caCumule) / profile.tjm)),
    [caCumule, seuilMicro, profile.tjm],
  );

  const caMensuelMoyen = useMemo(() => {
    const monthsWithWork = fiscalYear.months.filter((m) => m.workedDays.length > 0).length;
    return monthsWithWork > 0 ? caCumule / monthsWithWork : 0;
  }, [fiscalYear, caCumule]);

  const seuilDate = useMemo(
    () => calcSeuilDate(caCumule, caMensuelMoyen, seuilMicro),
    [caCumule, caMensuelMoyen, seuilMicro],
  );

  // Selected month metrics
  const selectedMonthWorkedDays = fiscalYear.months[selectedMonth]?.workedDays.length ?? 0;
  const caMensuel = selectedMonthWorkedDays * profile.tjm;
  const netMensuel = caMensuel * (1 - profile.urssafRate / 100) - chargesFixesMensuelles;

  // Weekly metrics
  const caHebdo = profile.tjm * 5;
  const netHebdo = caHebdo * (1 - profile.urssafRate / 100) - chargesFixesMensuelles / 4.33;

  // Annual metrics
  const netCumule = caCumule * (1 - profile.urssafRate / 100) - chargesFixesMensuelles * 12;

  // Max worked days across all months (for mini bar chart scaling)
  const maxWorkedDays = useMemo(
    () => Math.max(1, ...fiscalYear.months.map((m) => m.workedDays.length)),
    [fiscalYear],
  );

  // Render days for a given month
  const renderMonth = (monthIndex: number) => {
    const totalDays = getDaysInMonth(year, monthIndex);
    const offset = getFirstDayOffset(year, monthIndex);
    const workedDays = fiscalYear.months[monthIndex].workedDays;
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const weekend = isWeekend(year, monthIndex, d);
      const isWorked = workedDays.includes(d);
      const isToday = monthIndex === currentMonthIndex && d === todayDate;

      cells.push(
        <div
          key={d}
          onMouseDown={(e) => { e.preventDefault(); handleDayMouseDown(monthIndex, d); }}
          onMouseEnter={() => handleDayMouseEnter(monthIndex, d)}
          className={cn(
            'h-14 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all select-none',
            weekend
              ? 'bg-surface-highest/30 text-slate-300 cursor-default'
              : 'bg-surface-highest/10 text-slate-400 cursor-pointer hover:bg-surface-highest/30',
            isWorked && !weekend && 'bg-secondary text-white shadow-lg shadow-secondary/20',
            isToday && 'ring-2 ring-secondary ring-offset-1',
          )}
        >
          {d}
        </div>,
      );
    }

    return cells;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Compact header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-on-surface-variant text-xs font-medium tracking-widest uppercase mb-1">Année fiscale {year}</h2>
          <h1 className="font-headline font-extrabold text-3xl leading-none tracking-tighter text-slate-900">
            {formatEuroDetailed(caCumule)} <span className="text-secondary text-lg font-bold ml-1">Projeté</span>
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col items-center">
            <button
              onClick={fillMonthBusinessDays}
              className="px-4 py-2 rounded-xl bg-surface-lowest text-on-surface-variant hover:text-slate-900 transition-colors font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Remplir {MONTH_SHORT[selectedMonth]}
            </button>
            <button onClick={fillAllBusinessDays} className="text-xs text-on-surface-variant underline mt-0.5 hover:text-slate-900 transition-colors">
              Toute l'année
            </button>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={clearMonth}
              className="px-4 py-2 rounded-xl bg-surface-lowest text-on-surface-variant hover:text-red-500 transition-colors font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Effacer {MONTH_SHORT[selectedMonth]}
            </button>
            <button onClick={clearAll} className="text-xs text-on-surface-variant underline mt-0.5 hover:text-red-500 transition-colors">
              Toute l'année
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:opacity-90 transition-opacity font-bold text-xs flex items-center gap-1.5 shadow-lg self-start"
          >
            <Share2 className="w-3.5 h-3.5" /> Exporter
          </button>
        </div>
      </div>

      {/* Mobile config toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-lowest text-on-surface-variant font-semibold text-xs shadow-sm transition-colors hover:text-slate-900"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Paramètres fiscaux {showConfig ? '▴' : '▾'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Calendar: 5 cols on lg */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          {/* Month pills selector */}
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-1.5 min-w-max">
              {MONTH_SHORT.map((name, i) => {
                const hasData = fiscalYear.months[i].workedDays.length > 0;
                const isSelected = i === selectedMonth;
                const isCurrent = i === currentMonthIndex;
                return (
                  <button
                    key={i}
                    onClick={() => goToMonth(i)}
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

          {/* Month header with prev/next arrows */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-surface-lowest flex items-center justify-center hover:bg-surface-highest/30 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
            </button>
            <div className="text-center">
              <h3 className="font-headline text-xl font-bold text-slate-900">
                {MONTH_NAMES[selectedMonth]}
              </h3>
              <span className={cn(
                'text-xs font-bold uppercase tracking-widest',
                selectedMonthWorkedDays > 0 ? 'text-secondary' : 'text-slate-400 italic',
              )}>
                {selectedMonthWorkedDays > 0
                  ? `${selectedMonthWorkedDays} jours travaillés`
                  : 'Aucun jour sélectionné'}
              </span>
            </div>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-surface-lowest flex items-center justify-center hover:bg-surface-highest/30 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>

          {/* Single month calendar (animated) */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedMonth}
              initial={{ opacity: 0, x: navDirection * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: navDirection * -20 }}
              transition={{ duration: 0.15 }}
            >
              <div className="grid grid-cols-7 gap-2.5" role="grid" aria-label="Calendrier des jours travaillés">
                {DAY_HEADERS.map((d) => (
                  <div key={d} className="text-xs text-slate-400 font-bold uppercase text-center pb-1" role="columnheader">{d}</div>
                ))}
                {renderMonth(selectedMonth)}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mini annual progress bars — compact */}
          <div className="bg-surface-lowest p-4 rounded-2xl shadow-sm">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2">Progression annuelle</h4>
            <div className="flex items-end justify-between gap-0.5">
              {fiscalYear.months.map((m, i) => {
                const workedCount = m.workedDays.length;
                const heightPercent = (workedCount / maxWorkedDays) * 100;
                const isSelected = i === selectedMonth;
                const hasData = workedCount > 0;
                return (
                  <button
                    key={i}
                    onClick={() => goToMonth(i)}
                    className="flex flex-col items-center gap-0.5 flex-1 group"
                  >
                    <div className="w-full h-10 flex items-end">
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all',
                          isSelected
                            ? 'bg-secondary'
                            : hasData
                              ? 'bg-secondary-container group-hover:bg-secondary/40'
                              : 'bg-surface-highest/40',
                        )}
                        style={{ height: hasData ? `${Math.max(8, heightPercent)}%` : '8%' }}
                      />
                    </div>
                    <span className={cn(
                      'text-[7px] font-bold uppercase',
                      isSelected ? 'text-secondary' : 'text-slate-400',
                    )}>
                      {MONTH_SHORT[i]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Config: 3 cols on lg — hidden on mobile unless toggled */}
        <div className={cn('col-span-12 lg:col-span-3', !showConfig && 'hidden lg:block')}>
          <AnimatePresence>
            {(showConfig || true) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:!h-auto"
              >
                <FiscalControls profile={profile} setProfile={setProfile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Metrics: 4 cols on lg */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Threshold Card — compact */}
          <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="bg-white/10 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase">Prévision plafond</span>
              </div>
              <h3 className="font-headline text-lg font-bold mb-1">Seuil micro-entreprise</h3>
              <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
                {seuilDate
                  ? 'Franchissement estimé du plafond :'
                  : 'Ajoutez des jours pour estimer la date de franchissement.'}
              </p>
              {seuilDate && (() => {
                const { day, monthName, year: y } = formatDateFR(seuilDate);
                return (
                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-2xl font-black font-headline tracking-tight">{day} {monthName.toLowerCase()}</span>
                    <span className="text-secondary font-bold text-xs">{y}</span>
                  </div>
                );
              })()}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Progression</span>
                  <span>{formatEuro(caCumule)} / {editingSeuil ? (
                    <input
                      type="number"
                      value={seuilInput}
                      onChange={(e) => setSeuilInput(e.target.value)}
                      onBlur={handleSeuilSubmit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSeuilSubmit()}
                      autoFocus
                      className="bg-white/10 text-white text-xs font-bold w-20 px-1 py-0.5 rounded border border-white/20 outline-none focus:border-secondary"
                    />
                  ) : (
                    <button
                      onClick={() => { setSeuilInput(String(seuilMicro)); setEditingSeuil(true); }}
                      className="inline-flex items-center gap-1 hover:text-secondary transition-colors"
                    >
                      {formatEuro(seuilMicro)} <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="text-[11px] text-secondary/80 font-medium">
                  {remainingDays > 0
                    ? `~${remainingDays} jours facturables restants avant passage TVA.`
                    : 'Seuil micro-entreprise atteint.'}
                </p>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-secondary/20 blur-[60px] rounded-full"></div>
          </div>

          {/* Financial metrics — 3 sections */}
          <div className="space-y-3">
            {/* Mois sélectionné */}
            <div className="bg-surface-lowest p-4 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> {MONTH_NAMES[selectedMonth]}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CA</span>
                  <div className="text-lg font-headline font-black text-slate-900">{formatEuro(caMensuel)}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net</span>
                  <div className={cn('text-lg font-headline font-black', netMensuel >= 0 ? 'text-secondary' : 'text-red-500')}>
                    {formatEuro(Math.round(netMensuel))}
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{selectedMonthWorkedDays} jours planifiés</span>
              </div>
            </div>

            {/* Hebdo */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-secondary" /> Hebdomadaire
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CA</span>
                  <div className="text-lg font-headline font-black text-slate-900">{formatEuro(caHebdo)}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net</span>
                  <div className={cn('text-lg font-headline font-black', netHebdo >= 0 ? 'text-secondary' : 'text-red-500')}>
                    {formatEuro(Math.round(netHebdo))}
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">5 jours × {formatEuro(profile.tjm)}</span>
              </div>
            </div>

            {/* Annuel */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-secondary" /> Annuel cumulé
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CA</span>
                  <div className="text-base font-headline font-black text-slate-900">{formatEuro(caCumule)}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net</span>
                  <div className={cn('text-base font-headline font-black', netCumule >= 0 ? 'text-secondary' : 'text-red-500')}>
                    {formatEuro(Math.round(netCumule))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jours</span>
                  <div className="text-base font-headline font-black text-slate-900">{totalWorkedDays}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 lg:bottom-10 right-10 flex flex-col items-end space-y-4">
        <button className="group flex items-center space-x-3 bg-secondary p-4 px-6 rounded-full shadow-2xl text-white hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
          <span className="font-headline font-bold text-sm">Ajouter un projet</span>
        </button>
      </div>
    </motion.div>
  );
};
