import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { UserProfile } from '~/types';
import {
  calcCaRealise,
  calcEquivDays,
  calcMonthlyBreakdown,
  calcNetMicro,
  calcSeuilDate,
  calcTotalChargesFixes,
} from '~/lib/fiscal';
import {
  MONTH_NAMES,
  MONTH_SHORT,
  getDaysInMonth,
  isWeekend,
} from '~/lib/calendar';
import { useFiscalYear } from '~/hooks/useFiscalYear';
import { useCalendarDrag, type DayState } from '~/hooks/useCalendarDrag';
import { CalendarHeader } from '~/components/calendar/CalendarHeader';
import { MonthDetailCard } from '~/components/calendar/MonthDetailCard';
import { MonthPills } from '~/components/calendar/MonthPills';
import { MonthGrid } from '~/components/calendar/MonthGrid';
import { AnnualMiniBars } from '~/components/calendar/AnnualMiniBars';
import { SeuilCard } from '~/components/calendar/SeuilCard';
import { AnnualSummary } from '~/components/calendar/AnnualSummary';

interface CalendarProps {
  profile: UserProfile;
}

export const Calendar: React.FC<CalendarProps> = ({ profile }) => {
  const now = new Date();
  const year = now.getFullYear();
  const todayDate = now.getDate();
  const currentMonthIndex = now.getMonth();

  const fy = useFiscalYear(year);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [navDirection, setNavDirection] = useState<number>(1);

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

  const handleReset = () => {
    fy.resetEverything();
    setSelectedMonth(currentMonthIndex);
  };

  const chargesFixesMensuelles = useMemo(
    () => calcTotalChargesFixes(profile.fixedCosts),
    [profile.fixedCosts],
  );

  const totalWorkedDays = useMemo(
    () => fy.fiscalYear.months.reduce((sum, m) => sum + calcEquivDays(m), 0),
    [fy.fiscalYear],
  );

  const caCumule = totalWorkedDays * profile.tjm;

  const { caRealise } = useMemo(
    () => calcCaRealise(fy.fiscalYear.months, profile.tjm, currentMonthIndex, todayDate),
    [fy.fiscalYear, currentMonthIndex, todayDate, profile.tjm],
  );

  const seuilMicro = profile.seuilMicro;
  const progressPercent = Math.min(100, (caCumule / seuilMicro) * 100);
  const remainingDays = caCumule >= seuilMicro
    ? 0
    : Math.ceil((seuilMicro - caCumule) / profile.tjm);

  const seuilDate = useMemo(
    () => calcSeuilDate(fy.fiscalYear.months, profile.tjm, seuilMicro),
    [fy.fiscalYear.months, profile.tjm, seuilMicro],
  );

  const missionStartDate = useMemo(() => new Date(fy.missionStart), [fy.missionStart]);
  const missionStartMonth = missionStartDate.getMonth();
  const missionStartDay = missionStartDate.getDate();

  const totalBusinessDays = useMemo(() => {
    let count = 0;
    for (let m = 0; m < 12; m++) {
      const days = getDaysInMonth(year, m);
      for (let d = 1; d <= days; d++) {
        if (m < missionStartMonth || (m === missionStartMonth && d < missionStartDay)) continue;
        if (!isWeekend(year, m, d) && !fy.isJourFerie(m, d)) count++;
      }
    }
    return count;
  }, [year, fy.isJourFerie, missionStartMonth, missionStartDay]);

  const joursNonTravailles = totalBusinessDays - totalWorkedDays;

  // Annuel cumulé — moteur fiscal centralisé (VL pris en compte)
  const chargesFixesAnnuelles = chargesFixesMensuelles * 12;
  const resultCumule = calcNetMicro(caCumule, profile.urssafRate, chargesFixesAnnuelles, profile.versementLiberatoire);
  const netCumule = resultCumule.netApresIR + resultCumule.ir; // Net avant IR
  const netApresIRCumule = resultCumule.netApresIR;

  // Ventilation mensuelle — moteur fiscal centralisé (VL pris en compte)
  const selectedMonthData = fy.fiscalYear.months[selectedMonth];
  const selectedMonthWorkedDays = selectedMonthData ? calcEquivDays(selectedMonthData) : 0;
  const caMensuel = selectedMonthWorkedDays * profile.tjm;
  const monthBreakdown = calcMonthlyBreakdown(caMensuel, profile.urssafRate, chargesFixesMensuelles, profile.versementLiberatoire);
  const netMensuelAvantIR = Math.round(monthBreakdown.net + monthBreakdown.ir);
  const netMensuelApresIR = Math.round(monthBreakdown.net);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <CalendarHeader
        year={year}
        missionStart={fy.missionStart}
        onMissionStartChange={fy.setMissionStart}
        caRealise={caRealise}
        caCumule={caCumule}
        selectedMonthShort={MONTH_SHORT[selectedMonth]}
        onFillMonth={() => fy.fillMonth(selectedMonth)}
        onFillAll={fy.fillAll}
        onClearMonth={() => fy.clearMonth(selectedMonth)}
        onClearAll={fy.clearAll}
        onExport={() => fy.exportCSV(profile.tjm)}
        onReset={handleReset}
      />

      <MonthDetailCard
        compact
        className="lg:hidden"
        monthName={MONTH_NAMES[selectedMonth]}
        workedDays={selectedMonthWorkedDays}
        caMensuel={caMensuel}
        netAvantIR={netMensuelAvantIR}
        netApresIR={netMensuelApresIR}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 space-y-3">
          <MonthPills
            months={fy.fiscalYear.months}
            selectedMonth={selectedMonth}
            currentMonthIndex={currentMonthIndex}
            onSelect={goToMonth}
          />
          <MonthGrid
            year={year}
            monthIndex={selectedMonth}
            monthName={MONTH_NAMES[selectedMonth]}
            workedDays={fy.fiscalYear.months[selectedMonth].workedDays}
            halfDays={fy.fiscalYear.months[selectedMonth].halfDays ?? []}
            workedDaysEquiv={selectedMonthWorkedDays}
            todayInMonth={selectedMonth === currentMonthIndex ? todayDate : null}
            navDirection={navDirection}
            isJourFerie={fy.isJourFerie}
            getJourFerieName={fy.getJourFerieName}
            onPrev={prevMonth}
            onNext={nextMonth}
            dragHandlers={dragHandlers}
          />
          <AnnualMiniBars
            months={fy.fiscalYear.months}
            selectedMonth={selectedMonth}
            onSelect={goToMonth}
          />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-3">
          <MonthDetailCard
            className="hidden lg:block"
            monthName={MONTH_NAMES[selectedMonth]}
            workedDays={selectedMonthWorkedDays}
            caMensuel={caMensuel}
            netAvantIR={netMensuelAvantIR}
            netApresIR={netMensuelApresIR}
          />
          <SeuilCard
            seuilDate={seuilDate}
            totalWorkedDays={totalWorkedDays}
            caCumule={caCumule}
            seuilMicro={seuilMicro}
            progressPercent={progressPercent}
            remainingDays={remainingDays}
            joursNonTravailles={joursNonTravailles}
          />
          <AnnualSummary
            caCumule={caCumule}
            netAvantIR={netCumule}
            netApresIR={netApresIRCumule}
          />
        </div>
      </div>
    </motion.div>
  );
};
