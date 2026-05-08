import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import {
  calcCaRealise,
  calcEquivDays,
  calcMonthlyBreakdown,
  calcNetCumule,
  calcSeuilDate,
  calcTotalChargesFixes,
  countMonthsWithActivity,
  getFiscalParams,
} from '~/lib/fiscal';
import {
  MONTH_NAMES,
  MONTH_SHORT,
  getDaysInMonth,
  isWeekend,
} from '~/lib/calendar';
import { useCalendarDrag, type DayState } from '~/hooks/useCalendarDrag';
import { MonthGrid } from '~/components/calendar/MonthGrid';
import { AnnualMiniBars } from '~/components/calendar/AnnualMiniBars';
import { KeyMetrics } from '~/components/KeyMetrics';
import { CalendarToolbar } from '~/components/CalendarToolbar';
import { SlidersBlock } from '~/components/SlidersBlock';
import { MonthSummary } from '~/components/MonthSummary';
import { EmptyHero } from '~/components/EmptyHero';
import { LiveAnnouncer } from '~/components/LiveAnnouncer';
import { UndoToast } from '~/components/UndoToast';
import { ConfirmModal } from '~/components/ConfirmModal';
import type { CalendarMonth } from '~/types';

type ConfirmKind = 'clear-year' | 'fill-month' | 'fill-year';

interface UndoState {
  message: string;
  snapshot: CalendarMonth[];
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

export const Home: React.FC = () => {
  const { profile, setProfile } = useProfile();
  const fy = useFiscalYearCtx();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const confirmKind = (search?.confirm as ConfirmKind | undefined) ?? null;
  const reducedMotion = usePrefersReducedMotion();

  const { year, currentMonthIndex, todayDate } = fy;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [navDirection, setNavDirection] = useState<number>(1);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [announce, setAnnounce] = useState<string>('');

  // Snapshot dédié pour le pattern Undo (remplace les actions immédiates).
  const pendingSnapshotRef = useRef<CalendarMonth[] | null>(null);

  const isWeekendCell = useCallback(
    (m: number, d: number) => isWeekend(year, m, d),
    [year],
  );

  const getDayState = useCallback((m: number, d: number): DayState => {
    const month = fy.fiscalYear.months[m];
    if (month.workedDays.includes(d)) return 'full';
    if ((month.halfDays ?? []).includes(d)) return 'half';
    return 'empty';
  }, [fy.fiscalYear]);

  const dragHandlers = useCalendarDrag({
    isWeekendCell,
    isJourFerie: fy.isJourFerie,
    getDayState,
    cycleDay: fy.cycleDay,
    dragSetDay: fy.dragSetDay,
  });

  // --- Métriques ---
  const chargesFixesMensuelles = useMemo(
    () => calcTotalChargesFixes(profile.fixedCosts),
    [profile.fixedCosts],
  );

  const fiscalParams = useMemo(() => getFiscalParams(profile), [profile]);
  const fiscalOpts = useMemo(
    () => ({ abattement: fiscalParams.abattement, tauxVL: fiscalParams.tauxVL }),
    [fiscalParams.abattement, fiscalParams.tauxVL],
  );

  const totalWorkedDays = useMemo(
    () => fy.fiscalYear.months.reduce((sum, m) => sum + calcEquivDays(m), 0),
    [fy.fiscalYear.months],
  );

  const caCumule = totalWorkedDays * profile.tjm;
  const isEmpty = totalWorkedDays === 0;

  const { caRealise } = useMemo(
    () => calcCaRealise(fy.fiscalYear.months, profile.tjm, currentMonthIndex, todayDate),
    [fy.fiscalYear.months, profile.tjm, currentMonthIndex, todayDate],
  );

  const monthsWithActivity = useMemo(
    () => countMonthsWithActivity(fy.fiscalYear.months),
    [fy.fiscalYear.months],
  );

  const netCumule = useMemo(
    () => calcNetCumule(
      caCumule,
      profile.urssafRate,
      chargesFixesMensuelles,
      monthsWithActivity,
      profile.versementLiberatoire,
      fiscalOpts,
    ),
    [caCumule, profile.urssafRate, chargesFixesMensuelles, monthsWithActivity, profile.versementLiberatoire, fiscalOpts],
  );

  // Projection : on simule les mois courant + futurs sans données
  // avec le rythme nominal `workingDays` jours ouvrés / mois.
  const projectedMonths = useMemo(() => {
    return fy.fiscalYear.months.map((m) => {
      const equiv = m.workedDays.length + (m.halfDays?.length ?? 0) * 0.5;
      // Mois passés sans saisie ou mois déjà saisis → ne pas extrapoler
      if (equiv > 0 || m.month < currentMonthIndex) return m;
      const total = getDaysInMonth(year, m.month);
      const businessDays: number[] = [];
      for (let d = 1; d <= total && businessDays.length < profile.workingDays; d++) {
        if (!isWeekend(year, m.month, d) && !fy.isJourFerie(m.month, d)) {
          businessDays.push(d);
        }
      }
      return { ...m, workedDays: businessDays, halfDays: [] };
    });
  }, [fy.fiscalYear.months, currentMonthIndex, year, fy.isJourFerie, profile.workingDays]);

  const seuilDate = useMemo(
    () => calcSeuilDate(projectedMonths, profile.tjm, profile.seuilMicro),
    [projectedMonths, profile.tjm, profile.seuilMicro],
  );

  const selectedMonthData = fy.fiscalYear.months[selectedMonth];
  const selectedMonthDays = selectedMonthData ? calcEquivDays(selectedMonthData) : 0;
  const caMensuel = selectedMonthDays * profile.tjm;
  const monthBreakdown = useMemo(
    () => calcMonthlyBreakdown(caMensuel, profile.urssafRate, chargesFixesMensuelles, profile.versementLiberatoire, fiscalOpts),
    [caMensuel, profile.urssafRate, chargesFixesMensuelles, profile.versementLiberatoire, fiscalOpts],
  );

  // --- Navigation calendrier ---
  const goToMonth = (month: number) => {
    setNavDirection(month > selectedMonth ? 1 : -1);
    setSelectedMonth(month);
  };
  const prevMonth = () => {
    setNavDirection(-1);
    setSelectedMonth((p) => (p === 0 ? 11 : p - 1));
  };
  const nextMonth = () => {
    setNavDirection(1);
    setSelectedMonth((p) => (p === 11 ? 0 : p + 1));
  };

  // --- Routing helpers (search params overlays) ---
  const openFiscalSettings = () => navigate({ to: '/', search: { settings: 'fiscal' } });
  const openConfirm = (kind: ConfirmKind) => navigate({ to: '/', search: { confirm: kind } });
  const closeConfirm = () => navigate({ to: '/', search: {} });

  // --- Bulk actions ---
  const monthHasData = (idx: number) => {
    const m = fy.fiscalYear.months[idx];
    return m.workedDays.length > 0 || (m.halfDays?.length ?? 0) > 0;
  };
  const yearHasData = () => fy.fiscalYear.months.some((_, i) => monthHasData(i));

  const flushUndo = useCallback(() => {
    setUndo(null);
    pendingSnapshotRef.current = null;
  }, []);

  const triggerUndoFlow = (snapshot: CalendarMonth[], message: string) => {
    if (reducedMotion) {
      // Pas de toast Undo en reduced motion : annoncer + appliquer directement.
      setAnnounce(message);
      return;
    }
    pendingSnapshotRef.current = snapshot;
    setUndo({ snapshot, message });
    setAnnounce(message);
  };

  const handleClearMonth = () => {
    if (!monthHasData(selectedMonth)) return;
    const snapshot = fy.fiscalYear.months;
    const cleared = monthEquiv(snapshot[selectedMonth]);
    fy.clearMonth(selectedMonth);
    triggerUndoFlow(
      snapshot,
      `${cleared} jour${cleared > 1 ? 's' : ''} vidé${cleared > 1 ? 's' : ''} pour ${MONTH_NAMES[selectedMonth]}`,
    );
  };

  const handleClearYear = () => {
    if (!yearHasData()) return;
    openConfirm('clear-year');
  };
  const confirmClearYear = () => {
    fy.clearAll();
    setAnnounce(`Tous les mois de ${year} ont été vidés.`);
    closeConfirm();
  };

  const handleFillMonth = () => {
    if (!monthHasData(selectedMonth)) {
      // Mois vide → action directe
      fy.fillMonth(selectedMonth);
      const filled = monthEquiv(fy.fiscalYear.months[selectedMonth]);
      setAnnounce(`${MONTH_NAMES[selectedMonth]} rempli (${filled || 'jours ouvrés'} jours travaillés).`);
      return;
    }
    if (reducedMotion) {
      openConfirm('fill-month');
      return;
    }
    const snapshot = fy.fiscalYear.months;
    const previous = monthEquiv(snapshot[selectedMonth]);
    fy.fillMonth(selectedMonth);
    triggerUndoFlow(
      snapshot,
      `${MONTH_NAMES[selectedMonth]} rempli (${previous} jour${previous > 1 ? 's' : ''} précédemment saisi${previous > 1 ? 's' : ''} écrasé${previous > 1 ? 's' : ''})`,
    );
  };

  const handleFillYear = () => {
    openConfirm('fill-year');
  };
  const confirmFillYear = () => {
    fy.fillAll();
    setAnnounce(`Tous les jours ouvrés ${year} ont été remplis.`);
    closeConfirm();
  };
  const confirmFillMonth = () => {
    fy.fillMonth(selectedMonth);
    setAnnounce(`${MONTH_NAMES[selectedMonth]} rempli.`);
    closeConfirm();
  };

  const handleUndo = () => {
    const snap = pendingSnapshotRef.current;
    if (!snap) {
      flushUndo();
      return;
    }
    fy.restoreMonths(snap);
    setAnnounce('Action annulée.');
    flushUndo();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-4 lg:space-y-5"
    >
      <h1 className="sr-only">Fiscal Architect — suivi fiscal {year}</h1>

      {/* Hero KPI ou Empty */}
      {isEmpty ? (
        <EmptyHero seuilMicro={profile.seuilMicro} />
      ) : (
        <KeyMetrics
          caCumule={caCumule}
          caRealise={caRealise}
          netCumule={netCumule}
          seuilMicro={profile.seuilMicro}
          monthName={MONTH_NAMES[selectedMonth]}
          caMensuel={caMensuel}
          netMensuel={Math.round(monthBreakdown.net)}
          joursTravailes={selectedMonthDays}
          missionStart={fy.missionStart}
          seuilDate={seuilDate}
          onEditMissionStart={openFiscalSettings}
        />
      )}

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* Colonne calendrier */}
        <section aria-labelledby="calendar-section" className="col-span-12 lg:col-span-7 space-y-4">
          <h2 id="calendar-section" className="sr-only">Calendrier</h2>
          <div className="bg-surface-lowest rounded-3xl shadow-sm p-5">
            <MonthGrid
              year={year}
              monthIndex={selectedMonth}
              monthName={MONTH_NAMES[selectedMonth]}
              workedDays={fy.fiscalYear.months[selectedMonth].workedDays}
              halfDays={fy.fiscalYear.months[selectedMonth].halfDays ?? []}
              workedDaysEquiv={selectedMonthDays}
              todayInMonth={selectedMonth === currentMonthIndex ? todayDate : null}
              navDirection={navDirection}
              isJourFerie={fy.isJourFerie}
              getJourFerieName={fy.getJourFerieName}
              onPrev={prevMonth}
              onNext={nextMonth}
              dragHandlers={dragHandlers}
            />
          </div>
          <CalendarToolbar
            monthShort={MONTH_SHORT[selectedMonth]}
            monthLong={MONTH_NAMES[selectedMonth]}
            year={year}
            monthHasData={monthHasData(selectedMonth)}
            yearHasData={yearHasData()}
            onFill={(scope) => (scope === 'month' ? handleFillMonth() : handleFillYear())}
            onClear={(scope) => (scope === 'month' ? handleClearMonth() : handleClearYear())}
            onExport={() => fy.exportCSV(profile.tjm)}
            onReset={() => navigate({ to: '/', search: { confirm: 'reset-all' } })}
          />
          <AnnualMiniBars
            months={fy.fiscalYear.months}
            selectedMonth={selectedMonth}
            onSelect={goToMonth}
          />
        </section>

        {/* Colonne sliders + résumé */}
        <aside className="col-span-12 lg:col-span-5 space-y-4">
          <SlidersBlock
            tjm={profile.tjm}
            urssafRate={profile.urssafRate}
            urssafDefault={fiscalParams.urssafRate}
            workedDaysEquiv={selectedMonthDays}
            caMensuel={caMensuel}
            netMensuel={Math.round(monthBreakdown.net)}
            onTjmChange={(v) => setProfile((p) => ({ ...p, tjm: v }))}
            onUrssafChange={(v) => setProfile((p) => ({ ...p, urssafRate: v }))}
            onOpenAdvanced={openFiscalSettings}
          />
          <MonthSummary
            monthName={MONTH_NAMES[selectedMonth]}
            workedDaysEquiv={selectedMonthDays}
            caMensuel={caMensuel}
            urssafMensuel={Math.round(monthBreakdown.urssaf)}
            urssafRate={profile.urssafRate}
            chargesFixesMensuelles={chargesFixesMensuelles}
            irMensuel={Math.round(monthBreakdown.ir)}
            netMensuel={Math.round(monthBreakdown.net)}
            versementLiberatoire={profile.versementLiberatoire}
            tauxVL={fiscalParams.tauxVL}
            onToggleVL={(v) => setProfile((p) => ({ ...p, versementLiberatoire: v }))}
          />
        </aside>
      </div>

      {/* Overlays */}
      <ConfirmModal
        open={confirmKind === 'clear-year'}
        title={`Vider toute l'année ${year} ?`}
        message="Les 12 mois seront supprimés. Action irréversible."
        confirmLabel="Vider l'année"
        destructive
        onConfirm={confirmClearYear}
        onCancel={closeConfirm}
      />
      <ConfirmModal
        open={confirmKind === 'fill-year'}
        title={`Remplir toute l'année ${year} ?`}
        message={
          yearHasData()
            ? 'Tous les jours ouvrés des 12 mois seront marqués comme travaillés. Les jours déjà saisis seront écrasés.'
            : 'Tous les jours ouvrés des 12 mois seront marqués comme travaillés (≈ 220 jours).'
        }
        confirmLabel="Remplir l'année"
        destructive={false}
        onConfirm={confirmFillYear}
        onCancel={closeConfirm}
      />
      <ConfirmModal
        open={confirmKind === 'fill-month'}
        title={`Remplir ${MONTH_NAMES[selectedMonth]} ?`}
        message="Les jours déjà saisis seront écrasés."
        confirmLabel="Remplir le mois"
        destructive={false}
        onConfirm={confirmFillMonth}
        onCancel={closeConfirm}
      />

      <UndoToast
        open={!!undo}
        message={undo?.message ?? ''}
        onUndo={handleUndo}
        onDismiss={flushUndo}
      />

      <LiveAnnouncer message={announce} />
    </motion.div>
  );
};

function monthEquiv(m: CalendarMonth): number {
  return m.workedDays.length + (m.halfDays?.length ?? 0) * 0.5;
}
