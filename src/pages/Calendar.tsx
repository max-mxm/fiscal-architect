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
  CalendarDays,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { UserProfile, FiscalYear, CalendarMonth } from '~/types';
import { cn } from '~/utils';
import { calcSeuilDate, calcNetMicro } from '~/lib/fiscal';
import { useLocalStorage } from '~/hooks/useLocalStorage';

interface CalendarProps {
  profile: UserProfile;
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

/** Calcul de la date de Pâques (algorithme de Meeus) */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Retourne un Set de clés (mois*100+jour) et un Map de noms pour les jours fériés français */
function getJoursFeries(year: number): { set: Set<number>; names: Map<number, string> } {
  const easter = getEasterDate(year);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const lundiPaques = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const lundiPentecote = addDays(easter, 50);

  const entries: [Date, string][] = [
    [new Date(year, 0, 1), 'Jour de l\'An'],
    [lundiPaques, 'Lundi de Pâques'],
    [new Date(year, 4, 1), 'Fête du Travail'],
    [new Date(year, 4, 8), 'Victoire 1945'],
    [ascension, 'Ascension'],
    [lundiPentecote, 'Lundi de Pentecôte'],
    [new Date(year, 6, 14), 'Fête nationale'],
    [new Date(year, 7, 15), 'Assomption'],
    [new Date(year, 10, 1), 'Toussaint'],
    [new Date(year, 10, 11), 'Armistice'],
    [new Date(year, 11, 25), 'Noël'],
  ];

  const set = new Set<number>();
  const names = new Map<number, string>();
  for (const [d, name] of entries) {
    const key = d.getMonth() * 100 + d.getDate();
    set.add(key);
    names.set(key, name);
  }
  return { set, names };
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

export const Calendar: React.FC<CalendarProps> = ({ profile }) => {
  const now = new Date();
  const year = now.getFullYear();
  const todayDate = now.getDate();
  const currentMonthIndex = now.getMonth();

  const [fiscalYear, setFiscalYear] = useLocalStorage<FiscalYear>(`fiscal-calendar-${year}`, createEmptyFiscalYear(year));
  const [missionStart, setMissionStart] = useLocalStorage<string>(`fiscal-mission-start-${year}`, `${year}-01-01`);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [navDirection, setNavDirection] = useState<number>(1);

  const missionStartDate = useMemo(() => new Date(missionStart), [missionStart]);

  const { set: joursFeriesSet, names: joursFeriesNames } = useMemo(() => getJoursFeries(year), [year]);
  const isJourFerie = useCallback((month: number, day: number) => joursFeriesSet.has(month * 100 + day), [joursFeriesSet]);
  const getJourFerieName = useCallback((month: number, day: number) => joursFeriesNames.get(month * 100 + day), [joursFeriesNames]);

  // --- Drag-to-select state ---
  const dragging = useRef(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const dragMonth = useRef<number>(-1);

  const setDay = useCallback((monthIndex: number, day: number, add: boolean, force = false) => {
    if (isWeekend(year, monthIndex, day)) return;
    if (!force && isJourFerie(monthIndex, day)) return;
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
  }, [year, isJourFerie]);

  const handleDayMouseDown = useCallback((monthIndex: number, day: number) => {
    if (isWeekend(year, monthIndex, day)) return;
    if (isJourFerie(monthIndex, day)) return;
    dragging.current = true;
    dragMonth.current = monthIndex;
    const isWorked = fiscalYear.months[monthIndex].workedDays.includes(day);
    dragMode.current = isWorked ? 'remove' : 'add';
    setDay(monthIndex, day, !isWorked);
  }, [year, fiscalYear, setDay, isJourFerie]);

  const handleDayMouseEnter = useCallback((monthIndex: number, day: number) => {
    if (!dragging.current) return;
    if (monthIndex !== dragMonth.current) return;
    if (isWeekend(year, monthIndex, day)) return;
    if (isJourFerie(monthIndex, day)) return;
    setDay(monthIndex, day, dragMode.current === 'add');
  }, [year, setDay, isJourFerie]);

  const handleDayDoubleClick = useCallback((monthIndex: number, day: number) => {
    if (isWeekend(year, monthIndex, day)) return;
    if (!isJourFerie(monthIndex, day)) return;
    const isWorked = fiscalYear.months[monthIndex].workedDays.includes(day);
    setDay(monthIndex, day, !isWorked, true);
  }, [year, fiscalYear, setDay, isJourFerie]);

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

  // Fill weekdays for selected month only (excluding holidays)
  const fillMonthBusinessDays = () => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m, i) => {
        if (i !== selectedMonth) return m;
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d) && !isJourFerie(m.month, d)) weekdays.push(d);
        }
        return { ...m, workedDays: weekdays };
      });
      return { ...prev, months: newMonths };
    });
  };

  // Fill all months (excluding holidays)
  const fillAllBusinessDays = () => {
    setFiscalYear((prev) => {
      const newMonths = prev.months.map((m) => {
        const totalDays = getDaysInMonth(prev.year, m.month);
        const weekdays: number[] = [];
        for (let d = 1; d <= totalDays; d++) {
          if (!isWeekend(prev.year, m.month, d) && !isJourFerie(m.month, d)) weekdays.push(d);
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

  // CA réalisé : jours travaillés des mois passés + jours <= aujourd'hui du mois en cours
  const { caRealise, joursRealises } = useMemo(() => {
    let jours = 0;
    for (const m of fiscalYear.months) {
      if (m.month < currentMonthIndex) {
        jours += m.workedDays.length;
      } else if (m.month === currentMonthIndex) {
        jours += m.workedDays.filter((d) => d <= todayDate).length;
      }
    }
    return { caRealise: jours * profile.tjm, joursRealises: jours };
  }, [fiscalYear, currentMonthIndex, todayDate, profile.tjm]);

  const seuilMicro = profile.seuilMicro;

  const progressPercent = useMemo(
    () => Math.min(100, (caCumule / seuilMicro) * 100),
    [caCumule, seuilMicro],
  );

  const remainingDays = useMemo(
    () => (caCumule >= seuilMicro ? 0 : Math.ceil((seuilMicro - caCumule) / profile.tjm)),
    [caCumule, seuilMicro, profile.tjm],
  );

  const seuilDate = useMemo(
    () => calcSeuilDate(fiscalYear.months, profile.tjm, seuilMicro),
    [fiscalYear.months, profile.tjm, seuilMicro],
  );

  // Jours ouvrés à partir de la date de début de mission (hors weekends et fériés)
  const missionStartMonth = missionStartDate.getMonth();
  const missionStartDay = missionStartDate.getDate();

  const totalBusinessDays = useMemo(() => {
    let count = 0;
    for (let m = 0; m < 12; m++) {
      const days = getDaysInMonth(year, m);
      for (let d = 1; d <= days; d++) {
        if (m < missionStartMonth || (m === missionStartMonth && d < missionStartDay)) continue;
        if (!isWeekend(year, m, d) && !isJourFerie(m, d)) count++;
      }
    }
    return count;
  }, [year, isJourFerie, missionStartMonth, missionStartDay]);

  const joursNonTravailles = totalBusinessDays - totalWorkedDays;

  // Calcul annuel avec IR via le moteur fiscal
  const resultAnnuel = useMemo(
    () => calcNetMicro(caCumule, profile.urssafRate, chargesFixesMensuelles * 12, profile.versementLiberatoire),
    [caCumule, profile.urssafRate, chargesFixesMensuelles, profile.versementLiberatoire],
  );
  const tauxNetEffectif = caCumule > 0 ? resultAnnuel.netApresIR / caCumule : 0;

  // Selected month metrics
  const selectedMonthWorkedDays = fiscalYear.months[selectedMonth]?.workedDays.length ?? 0;
  const caMensuel = selectedMonthWorkedDays * profile.tjm;
  const netMensuel = caMensuel * tauxNetEffectif;

  // Weekly metrics
  const caHebdo = profile.tjm * 5;
  const netHebdo = caHebdo * tauxNetEffectif;

  // Annual metrics
  const netCumule = resultAnnuel.netApresIR;

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
      const ferie = isJourFerie(monthIndex, d);
      const isWorked = workedDays.includes(d);
      const isToday = monthIndex === currentMonthIndex && d === todayDate;
      const ferieName = getJourFerieName(monthIndex, d);

      cells.push(
        <div
          key={d}
          onMouseDown={(e) => { e.preventDefault(); handleDayMouseDown(monthIndex, d); }}
          onMouseEnter={() => handleDayMouseEnter(monthIndex, d)}
          onDoubleClick={() => handleDayDoubleClick(monthIndex, d)}
          title={ferie && !weekend ? (ferieName ?? 'Jour férié') + ' — double-clic pour sélectionner' : undefined}
          className={cn(
            'h-14 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all select-none relative',
            weekend
              ? 'bg-surface-highest/30 text-slate-300 cursor-default'
              : ferie && !isWorked
                ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-default'
                : 'bg-surface-highest/10 text-slate-400 cursor-pointer hover:bg-surface-highest/30',
            isWorked && !weekend && 'bg-secondary text-white shadow-lg shadow-secondary/20',
            isToday && 'ring-2 ring-secondary ring-offset-1',
          )}
        >
          {d}
          {ferie && !weekend && !isWorked && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
          )}
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
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-on-surface-variant text-xs font-medium tracking-widest uppercase">Année fiscale {year}</h2>
            <div className="flex items-center gap-1.5 bg-surface-lowest rounded-lg px-2.5 py-1 shadow-sm">
              <CalendarDays className="w-3 h-3 text-on-surface-variant" />
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Début mission</label>
              <input
                type="date"
                value={missionStart}
                onChange={(e) => setMissionStart(e.target.value)}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                className="bg-transparent text-xs font-bold text-secondary border-none p-0 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="font-headline font-extrabold text-3xl leading-none tracking-tighter text-slate-900">
              {formatEuro(caRealise)} <span className="text-slate-400 text-lg font-bold ml-1">Réalisé</span>
            </h1>
            <span className="font-headline font-bold text-xl leading-none tracking-tighter text-on-surface-variant/40">
              {formatEuro(caCumule)} <span className="text-secondary text-sm font-bold ml-0.5">Projeté</span>
            </span>
          </div>
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

      <div className="grid grid-cols-12 gap-4">
        {/* Calendar */}
        <div className="col-span-12 lg:col-span-7 space-y-3">
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

        {/* Metrics */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Threshold Card — compact */}
          <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="bg-white/10 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase">
                  {seuilDate ? 'Prévision plafond' : 'Statut micro'}
                </span>
              </div>
              <h3 className="font-headline text-lg font-bold mb-1">Seuil micro-entreprise</h3>

              {seuilDate ? (
                <>
                  <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
                    Franchissement estimé du plafond :
                  </p>
                  {(() => {
                    const { day, monthName, year: y } = formatDateFR(seuilDate);
                    return (
                      <div className="flex items-baseline space-x-2 mb-4">
                        <span className="text-2xl font-black font-headline tracking-tight">{day} {monthName.toLowerCase()}</span>
                        <span className="text-secondary font-bold text-xs">{y}</span>
                      </div>
                    );
                  })()}
                </>
              ) : totalWorkedDays > 0 ? (
                <div className="mb-4">
                  <p className="text-secondary text-xs font-bold mb-2">Vous restez sous le seuil cette année.</p>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Marge restante : {formatEuro(seuilMicro - caCumule)}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
                  Ajoutez des jours pour estimer votre projection annuelle.
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Progression</span>
                  <span>{formatEuro(caCumule)} / {formatEuro(seuilMicro)}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] text-secondary/80 font-medium">
                    {caCumule >= seuilMicro
                      ? 'Seuil micro-entreprise atteint.'
                      : seuilDate
                        ? `~${remainingDays} jours facturables restants avant passage TVA.`
                        : `${joursNonTravailles} jours ouvrés disponibles restants.`
                    }
                  </p>
                  <Link to="/profile" className="text-[11px] text-slate-500 hover:text-secondary transition-colors underline underline-offset-2">
                    Modifier
                  </Link>
                </div>
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
