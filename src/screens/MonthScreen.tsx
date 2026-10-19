import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { ArrowRight, ChevronLeft, ChevronRight, Download, Eraser, MoreHorizontal, Sparkles, X } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { useNotificationsCtx } from '~/context/NotificationsContext';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import { effectiveEntries, getActivities } from '~/lib/fiscal';
import { withoutCalendarLines } from '~/lib/calendarMutations';
import { ScreenHead, Sheet } from '~/shell/AppShell';
import { NetBlock } from '~/components/viz/NetBlock';
import { SplitBar } from '~/components/viz/SplitBar';
import { MonthCalendar } from '~/components/calendar/MonthCalendar';
import { ForfaitEntries, FlatEntry } from '~/components/fiscal/RevenueEntries';
import { TjmMonthlyEditor } from '~/components/fiscal/TjmMonthlyEditor';
import { QuickLevers } from '~/components/fiscal/QuickLevers';
import { VLSimulationBanner, useVLSimulation } from '~/components/fiscal/VLSimulationBanner';
import { PersonaPicker } from '~/components/onboarding/PersonaPicker';
import { UndoToast } from '~/components/UndoToast';
import { LiveAnnouncer } from '~/components/LiveAnnouncer';
import { Button, IconButton } from '~/ui/Button';
import { Dialog } from '~/ui/Dialog';
import { Money, eur, pct } from '~/ui/Money';
import { Dot, FAMILY, type Family } from '~/ui/families';
import { deMois } from '~/ui/text';
import { useMonthView, useUpcoming, useYearView } from '~/view/useFiscalView';
import type { CalendarMonth } from '~/types';
import type { MonthVM, UpcomingVM, YearVM } from '~/view/types';
import { cn } from '~/utils';

const equiv = (m: CalendarMonth) => m.workedDays.length + (m.halfDays?.length ?? 0) * 0.5;
const daysLabel = (n: number) => `${n.toLocaleString('fr-FR')} jour${n > 1 ? 's' : ''}`;

export function MonthScreen() {
  const { profile, setProfile } = useProfile();
  const fy = useFiscalYearCtx();
  const reduced = usePrefersReducedMotion();
  const { year, currentMonthIndex, todayDate } = fy;
  const search = useSearch({ from: '/' });
  const [month, setMonth] = useState(search.mois ?? currentMonthIndex);
  useEffect(() => {
    if (search.mois != null) setMonth(search.mois);
  }, [search.mois]);
  const [tjmOpen, setTjmOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'fill-year' | 'clear-year' | 'fill-month' | 'clear-month'>(null);
  const [undo, setUndo] = useState<{ message: string; snapshot: CalendarMonth[] } | null>(null);
  const [announce, setAnnounce] = useState('');

  const vm = useMonthView(month);
  const vlSim = useVLSimulation();
  const yearVm = useYearView();
  const upcoming = useUpcoming();

  // Après une transition d'année depuis décembre / janvier, recaler le mois.
  const prevYear = useRef(year);
  useEffect(() => {
    if (prevYear.current === year) return;
    setMonth(year > prevYear.current ? 0 : 11);
    prevYear.current = year;
  }, [year]);

  const mode = profile.revenueModel;
  const showCalendar = mode === 'days' || mode === 'mixed';
  const showForfaits = mode === 'forfait' || mode === 'mixed';
  const showFlat = mode === 'flat' || mode === 'mixed';
  const monthData = fy.fiscalYear.months[month];
  const entries = monthData ? effectiveEntries(monthData) : [];
  const activities = getActivities(profile);
  const monthHasDays = monthData ? equiv(monthData) > 0 : false;
  const yearHasDays = fy.fiscalYear.months.some((m) => equiv(m) > 0);
  const name = MONTH_NAMES[month];

  const go = (delta: -1 | 1) => {
    const next = month + delta;
    if (next < 0) return fy.requestYearTransition(year - 1);
    if (next > 11) return fy.requestYearTransition(year + 1);
    setMonth(next);
  };

  const withUndo = (message: string, apply: () => void) => {
    const snapshot = fy.fiscalYear.months;
    apply();
    setAnnounce(message);
    if (!reduced) setUndo({ message, snapshot });
  };

  const fillMonth = () => {
    setActionsOpen(false);
    if (!monthHasDays) {
      fy.fillMonth(month);
      setAnnounce(`${name} : jours ouvrés cochés.`);
      return;
    }
    if (reduced) return setConfirm('fill-month');
    withUndo(`${name} rempli, ${daysLabel(equiv(monthData))} précédents remplacés.`, () => fy.fillMonth(month));
  };
  const clearMonth = () => {
    setActionsOpen(false);
    if (!monthHasDays) return;
    // En mouvement réduit il n'y a pas de bandeau d'annulation : on confirme d'abord.
    if (reduced) return setConfirm('clear-month');
    withUndo(`${daysLabel(equiv(monthData))} effacés en ${name.toLowerCase()}.`, () => fy.clearMonth(month));
  };

  const confirmDialog = (
    kind: NonNullable<typeof confirm>,
    title: string,
    description: string,
    label: string,
    action: () => void,
    danger = false,
  ) => (
    <Dialog
      open={confirm === kind}
      onClose={() => setConfirm(null)}
      role="alertdialog"
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={() => setConfirm(null)} data-autofocus>
            Annuler
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              action();
              setConfirm(null);
            }}
          >
            {label}
          </Button>
        </>
      }
    />
  );

  return (
    <>
      <h1 className="sr-only">
        {name} {year} : net du mois et jours travaillés
      </h1>

      <ScreenHead>
        <MonthNav vm={vm} year={year} onPrev={() => go(-1)} onNext={() => go(1)} onOpenTjm={() => setTjmOpen(true)} showTjm={showCalendar} />
        <VLSimulationBanner className="mt-2.5 lg:mt-5" />
        <div className="mt-2.5 grid gap-2.5 lg:mt-5 lg:grid-cols-12 lg:gap-5">
          <NetBlock
            className="lg:col-span-5"
            label={vlSim.active ? `Net ${deMois(name)} · simulation VL` : `Net ${deMois(name)}`}
            value={vm.net}
            share={vm.ca > 0 ? Math.round((vm.net / vm.ca) * 1000) / 10 : null}
            footer={vm.ca > 0 ? 'Après cotisations, impôt et charges fixes' : 'Aucun chiffre d’affaires ce mois-ci : charges fixes seules'}
            compactFooter
            invoice={{ label: 'À facturer au client', amount: vm.tvaApplies ? vm.ttc : vm.ca, ttc: vm.tvaApplies && vm.tva > 0 }}
          />
          <section aria-label={`Répartition du CA ${deMois(name)}`} className="card px-4 py-3 lg:col-span-7 lg:p-5">
            <div className="mb-2.5 flex items-baseline justify-between gap-3 lg:mb-3">
              <h2 className="text-[16px] font-bold text-ink">Où va votre CA</h2>
              <p className="text-[14px] font-semibold text-ink-2 tnum">
                <span className={FAMILY.ca.ink}>{eur(vm.ca)} HT</span>
                {vm.tvaApplies && vm.tva > 0 && <span className={cn('ml-2', FAMILY.tva.ink)}>{eur(vm.ttc)} TTC</span>}
              </p>
            </div>
            <SplitBar
              hideNetInLegend
              segments={[
                { family: 'net', label: 'Net', value: Math.max(0, vm.net) },
                { family: 'cot', label: 'Cotisations', value: vm.cotisations },
                { family: 'impot', label: vm.impotMode === 'vl' ? 'VL' : 'Impôt', value: vm.impot },
                { family: 'charges', label: 'Charges', value: vm.charges },
              ]}
              tva={vm.tvaApplies ? vm.tva : 0}
              emptyLabel={showCalendar ? `Cochez vos jours de ${name.toLowerCase()} pour voir la répartition.` : `Saisissez le chiffre d’affaires ${deMois(name)}.`}
            />
          </section>
        </div>
      </ScreenHead>

      <Sheet className="space-y-5 pt-3 lg:pt-8">
        <div className="hidden lg:block">
          <Alerts />
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <section aria-labelledby="saisie" className="card px-3 py-3 sm:p-4 lg:p-5">
              <div className="mb-2 flex items-center justify-between gap-3 pl-1 sm:pl-0">
                <h2 id="saisie" className="text-[17px] font-bold text-ink">
                  {showCalendar ? 'Jours travaillés' : mode === 'forfait' ? 'Prestations' : 'Chiffre d’affaires'}
                </h2>
                {showCalendar && (
                  <div className="flex items-center gap-1">
                    {!monthHasDays && (
                      <Button variant="primary" size="sm" icon={<Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden="true" />} onClick={fillMonth}>
                        Cocher les jours ouvrés
                      </Button>
                    )}
                    <IconButton label="Actions sur le calendrier" onClick={() => setActionsOpen(true)}>
                      <MoreHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </IconButton>
                  </div>
                )}
              </div>

              {showCalendar && monthData && (
                <MonthCalendar
                  year={year}
                  monthIndex={month}
                  workedDays={monthData.workedDays}
                  halfDays={monthData.halfDays ?? []}
                  todayInMonth={month === currentMonthIndex && year === new Date().getFullYear() ? todayDate : null}
                  isJourFerie={fy.isJourFerie}
                  getJourFerieName={fy.getJourFerieName}
                  cycleDay={fy.cycleDay}
                  dragSetDay={fy.dragSetDay}
                />
              )}

              {showForfaits && (
                <div className={cn(showCalendar && 'mt-6 border-t border-line pt-5')}>
                  {mode === 'mixed' && <h3 className="mb-2 text-[16px] font-bold text-ink">Prestations au forfait</h3>}
                  <ForfaitEntries
                    entries={entries}
                    onChange={(next) => fy.setMonthEntries(month, withoutCalendarLines(next))}
                    activities={activities}
                    tvaApplies={vm.tvaApplies}
                    tvaRate={profile.tvaRate}
                    year={year}
                    monthIndex={month}
                    monthName={name}
                  />
                </div>
              )}
              {showFlat && (
                <div className={cn((showCalendar || showForfaits) && 'mt-6 border-t border-line pt-5')}>
                  {mode === 'mixed' && <h3 className="mb-2 text-[16px] font-bold text-ink">Montant du mois</h3>}
                  <FlatEntry
                    entries={entries}
                    onChange={(next) => fy.setMonthEntries(month, withoutCalendarLines(next))}
                    activities={activities}
                    tvaApplies={vm.tvaApplies}
                    tvaRate={profile.tvaRate}
                    monthName={name}
                  />
                </div>
              )}
            </section>

            <div className="lg:hidden">
              <Alerts />
            </div>
            <div className="lg:hidden">
              <QuickLevers monthName={name} tjm={vm.tjm} tjmCustom={vm.tjmCustom} showTjm={showCalendar} onOpenTjm={() => setTjmOpen(true)} />
            </div>

            <YearStrip yearVm={yearVm} selected={month} onSelect={setMonth} workingDays={profile.workingDays} />
            <div className="hidden lg:block">
              <Upcoming items={upcoming} />
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:col-span-5">
            <div className="hidden lg:block">
              <QuickLevers monthName={name} tjm={vm.tjm} tjmCustom={vm.tjmCustom} showTjm={showCalendar} onOpenTjm={() => setTjmOpen(true)} />
            </div>
            <MonthDetail vm={vm} showDays={showCalendar} />
            <div className="lg:hidden">
              <Upcoming items={upcoming} />
            </div>
          </aside>
        </div>
      </Sheet>

      <Dialog open={actionsOpen} onClose={() => setActionsOpen(false)} title="Actions sur le calendrier" size="sm">
        <div className="space-y-2">
          <Button block variant="secondary" icon={<Sparkles className="h-4 w-4 text-ca" strokeWidth={2} aria-hidden="true" />} onClick={fillMonth} className="justify-start">
            Cocher tous les jours ouvrés {deMois(name)}
          </Button>
          <Button
            block
            variant="secondary"
            icon={<Sparkles className="h-4 w-4 text-ca" strokeWidth={2} aria-hidden="true" />}
            onClick={() => {
              setActionsOpen(false);
              setConfirm('fill-year');
            }}
            className="justify-start"
          >
            Cocher tous les jours ouvrés de {year}
          </Button>
          <Button
            block
            variant="secondary"
            icon={<Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            onClick={() => {
              setActionsOpen(false);
              fy.exportCSV(profile);
            }}
            className="justify-start"
          >
            Exporter {year} en CSV
          </Button>
        </div>
        <div className="mt-8 space-y-2 border-t border-line pt-4">
          <Button block variant="danger" disabled={!monthHasDays} icon={<Eraser className="h-4 w-4" strokeWidth={2} aria-hidden="true" />} onClick={clearMonth} className="justify-start">
            Effacer les jours {deMois(name)}
          </Button>
          <Button
            block
            variant="danger"
            disabled={!yearHasDays}
            icon={<Eraser className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            onClick={() => {
              setActionsOpen(false);
              setConfirm('clear-year');
            }}
            className="justify-start"
          >
            Effacer toute l’année {year}
          </Button>
        </div>
      </Dialog>

      {confirmDialog(
        'fill-year',
        `Cocher toute l’année ${year} ?`,
        yearHasDays
          ? 'Tous les jours ouvrés des 12 mois seront cochés ; les jours déjà saisis seront remplacés.'
          : 'Tous les jours ouvrés des 12 mois seront cochés (environ 220 jours).',
        'Cocher l’année',
        () => {
          fy.fillAll();
          setAnnounce(`Tous les jours ouvrés de ${year} sont cochés.`);
        },
      )}
      {confirmDialog(
        'clear-year',
        `Effacer toute l’année ${year} ?`,
        'Les jours cochés des 12 mois seront supprimés. Cette action ne peut pas être annulée.',
        'Effacer l’année',
        () => {
          fy.clearAll();
          setAnnounce(`Les jours de ${year} sont effacés.`);
        },
        true,
      )}
      {confirmDialog(
        'fill-month',
        `Remplacer les jours ${deMois(name)} ?`,
        'Tous les jours ouvrés seront cochés ; les jours déjà saisis seront remplacés.',
        'Cocher le mois',
        () => {
          fy.fillMonth(month);
          setAnnounce(`${name} rempli.`);
        },
      )}
      {confirmDialog(
        'clear-month',
        `Effacer les jours ${deMois(name)} ?`,
        'Les jours cochés de ce mois seront supprimés.',
        'Effacer le mois',
        () => {
          fy.clearMonth(month);
          setAnnounce(`${name} effacé.`);
        },
        true,
      )}

      <UndoToast
        open={undo != null}
        message={undo?.message ?? ''}
        onUndo={() => {
          if (undo) fy.restoreMonths(undo.snapshot);
          setAnnounce('Action annulée.');
          setUndo(null);
        }}
        onDismiss={() => setUndo(null)}
      />

      <TjmMonthlyEditor
        open={tjmOpen}
        onClose={() => setTjmOpen(false)}
        year={year}
        defaultTjm={profile.tjm}
        tjmByMonth={profile.tjmByMonth}
        initialMonth={month}
        onChange={({ defaultTjm, tjmByMonth }) => setProfile((p) => ({ ...p, tjm: defaultTjm, tjmByMonth }))}
        tvaAssujetti={profile.tvaAssujetti}
        tvaRate={profile.tvaRate}
        tvaEffectiveDate={profile.tvaEffectiveDate}
      />

      <PersonaPicker
        open={profile.onboardingDone === false}
        year={year}
        onPick={(patch) => setProfile((p) => ({ ...p, ...patch }))}
        onSkip={() => setProfile((p) => ({ ...p, onboardingDone: true }))}
      />

      <LiveAnnouncer message={announce} />
    </>
  );
}

function MonthNav({
  vm,
  year,
  onPrev,
  onNext,
  onOpenTjm,
  showTjm,
}: {
  vm: MonthVM;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenTjm: () => void;
  showTjm: boolean;
}) {
  const prevName = MONTH_NAMES[(vm.index + 11) % 12].toLowerCase();
  const nextName = MONTH_NAMES[(vm.index + 1) % 12].toLowerCase();
  return (
    <div className="flex items-center gap-2">
      <IconButton label={`Mois précédent, ${prevName}`} onClick={onPrev} className="-ml-2 bg-card shadow-[var(--shadow-card)]">
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </IconButton>
      <div className="min-w-0 flex-1 text-center lg:flex-none lg:px-2 lg:text-left">
        <p className="text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-ink tnum lg:text-[30px]" aria-live="polite">
          {vm.name} {year}
        </p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[13px] font-semibold lg:justify-start">
          <span className={cn('rounded-full px-2 py-0.5', FAMILY.ca.soft)}>{daysLabel(vm.days)}</span>
          {showTjm && (
            <button type="button" onClick={onOpenTjm} className={cn('rounded-full px-2 py-0.5 hover:brightness-95', FAMILY.ca.soft)}>
              TJM {eur(vm.tjm)}
              {vm.tjmCustom ? ' ce mois' : ''}
            </button>
          )}
        </p>
      </div>
      <IconButton label={`Mois suivant, ${nextName}`} onClick={onNext} className="-mr-2 bg-card shadow-[var(--shadow-card)] lg:mr-0">
        <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function Line({
  family,
  label,
  value,
  note,
  strong,
  valueClass,
}: {
  family?: Family;
  label: React.ReactNode;
  value: number;
  note?: React.ReactNode;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2.5', strong && 'border-t-2 border-line pt-3')}>
      <dt className="flex min-w-0 items-start gap-2.5">
        {family && <Dot family={family} className="mt-1.5" />}
        <span className={cn('min-w-0 text-[15px]', strong ? 'font-bold text-ink' : 'font-medium text-ink')}>
          {label}
          {note && <span className="block text-[13px] font-normal text-ink-3">{note}</span>}
        </span>
      </dt>
      <dd className={cn('shrink-0 tnum', strong ? 'text-[22px] font-extrabold' : 'text-[16px] font-bold', valueClass ?? 'text-ink')}>
        <Money value={value} animate />
      </dd>
    </div>
  );
}

function MonthDetail({ vm, showDays }: { vm: MonthVM; showDays: boolean }) {
  const tvaRate = vm.ca > 0 ? Math.round((vm.tva / vm.ca) * 1000) / 10 : 0;
  return (
    <section aria-labelledby="detail-mois" className="card p-4 lg:p-5">
      <h2 id="detail-mois" className="mb-1 text-[17px] font-bold text-ink">
        Détail {deMois(vm.name)}
      </h2>
      <dl className="divide-y divide-line">
        <Line family="ca" label="Chiffre d’affaires HT" value={vm.ca} note={showDays && vm.days > 0 ? `${vm.days.toLocaleString('fr-FR')} j × ${eur(vm.tjm)}` : undefined} />
        {vm.tvaApplies && vm.tva > 0 && (
          <Line family="tva" label={`TVA collectée (${pct(tvaRate)})`} value={vm.tva} note={`Facturé TTC ${eur(vm.ttc)}`} valueClass={FAMILY.tva.ink} />
        )}
        <Line family="cot" label={`Cotisations URSSAF (${pct(vm.urssafRate)})`} value={-vm.urssaf} />
        {vm.acre > 0 && <Line family="cot" label={`Réduction ACRE (${pct(Math.round(vm.acreRate * 100))})`} value={vm.acre} valueClass={FAMILY.net.ink} />}
        {vm.cfp > 0 && <Line family="cot" label="Formation professionnelle (CFP)" value={-vm.cfp} />}
        {vm.taxeConsulaire > 0 && <Line family="cot" label="Taxe consulaire" value={-vm.taxeConsulaire} />}
        {vm.ij > 0 && <Line family="cot" label="Indemnités journalières" value={-vm.ij} />}
        <Line
          family="impot"
          label={vm.impotMode === 'vl' ? `Versement libératoire (${pct(vm.vlRate * 100)})` : 'Impôt sur le revenu estimé'}
          value={-vm.impot}
          note={vm.impotMode === 'bareme' ? 'Barème annuel ramené au mois' : undefined}
        />
        <Line family="charges" label="Charges fixes" value={-vm.charges} />
        <Line family="net" label="Net du mois" value={vm.net} strong valueClass={vm.net < 0 ? FAMILY.alert.ink : FAMILY.net.ink} />
      </dl>
      {vm.hasRevenue && (
        <p className="mt-3 rounded-[var(--radius-ctl)] bg-card-2 px-3 py-2.5 text-[14px] leading-snug text-ink-2 text-pretty">
          Sur les {eur(vm.tvaApplies ? vm.ttc : vm.ca)} facturés ce mois-ci, gardez{' '}
          <strong className="font-extrabold text-ink tnum">{eur(vm.aMettreDeCote)}</strong> de côté pour les cotisations, l’impôt
          {vm.tvaApplies && vm.tva > 0 ? <> et la <span className={cn('font-bold', FAMILY.tva.ink)}>TVA</span></> : ''}.
        </p>
      )}
      {vm.tvaStartsLabel && (
        <p className="mt-2 text-[13px] text-ink-2">
          Factures hors taxes ce mois-ci : la <span className={cn('font-bold', FAMILY.tva.ink)}>TVA</span> s’applique à partir de {vm.tvaStartsLabel}.
        </p>
      )}
    </section>
  );
}

function YearStrip({
  yearVm,
  selected,
  onSelect,
  workingDays,
}: {
  yearVm: YearVM;
  selected: number;
  onSelect: (m: number) => void;
  workingDays: number;
}) {
  const max = Math.max(1, ...yearVm.months.map((m) => m.ca));
  return (
    <section aria-labelledby="annee-strip" className="card p-4 lg:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="annee-strip" className="text-[17px] font-bold text-ink">
          Mois par mois
        </h2>
        <Link to="/annee" className="inline-flex min-h-9 pointer-coarse:min-h-11 items-center gap-1 text-[14px] font-semibold text-ca-ink hover:underline">
          Vue de l’année <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-12 items-end gap-1.5" role="tablist" aria-label="Choisir le mois">
        {yearVm.months.map((m) => {
          const active = m.index === selected;
          const h = Math.max(6, Math.round((m.ca / max) * 64));
          return (
            <button
              key={m.index}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${m.name} : ${m.ca > 0 ? `${eur(m.ca)} de CA${m.projected ? ' (projeté)' : ''}` : 'aucun CA'}`}
              onClick={() => onSelect(m.index)}
              className="group flex min-h-11 flex-col items-center justify-end gap-1.5"
            >
              <span className="flex h-16 w-full items-end">
                <span
                  className={cn(
                    'block w-full rounded-[5px] transition-[height,background-color] duration-300',
                    m.projected
                      ? 'border-2 border-dashed border-ca/60 bg-transparent'
                      : active
                        ? 'bg-ca'
                        : m.hasData
                          ? 'bg-ca-light group-hover:bg-ca/70'
                          : 'bg-card-2',
                    active && m.projected && 'border-ca',
                  )}
                  style={{ height: h }}
                />
              </span>
              <span className={cn('text-[11px]', active ? 'font-extrabold text-ca-ink' : 'font-semibold text-ink-3')}>
                {MONTH_SHORT[m.index].slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-ink-3">Pointillés : mois à venir projetés à {workingDays} jours.</p>
    </section>
  );
}

const UPCOMING_FAMILY: Record<string, Family> = { decl: 'cot', pay: 'ca', micro: 'warn', tva: 'tva' };

function Upcoming({ items }: { items: UpcomingVM[] }) {
  if (items.length === 0) return null;
  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
  const mon = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
  return (
    <section aria-labelledby="a-venir" className="card p-4 lg:p-5">
      <h2 id="a-venir" className="mb-2 text-[17px] font-bold text-ink">
        À venir
      </h2>
      <ol className="space-y-1">
        {items.map((it) => {
          const family = it.tone === 'alert' ? 'alert' : UPCOMING_FAMILY[it.key] ?? 'charges';
          const body = (
            <>
              <span className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] leading-none', FAMILY[family].fill)}>
                <span className="text-[17px] font-extrabold tnum">{day.format(it.date)}</span>
                <span className="mt-0.5 text-[11px] font-bold">{mon.format(it.date)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{it.title}</span>
                <span className="block text-[13px] text-ink-2">{it.detail}</span>
              </span>
              {it.amount != null && (
                <span className="shrink-0 text-right">
                  <Money value={it.amount} className={cn('block text-[16px] font-bold', family === 'tva' || it.amountTtc ? FAMILY.tva.ink : 'text-ink')} />
                  {it.amountTtc && <span className={cn('text-[11px] font-bold', FAMILY.tva.ink)}>TTC</span>}
                </span>
              )}
            </>
          );
          return (
            <li key={it.key}>
              {it.to ? (
                <Link to={it.to} className="-mx-2 flex items-center gap-3 rounded-[var(--radius-ctl)] px-2 py-2 hover:bg-card-2">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-2">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Alerts() {
  const { active, dismiss } = useNotificationsCtx();
  // Le VL hors droits a son propre bandeau en tête d'écran.
  const shown = active.filter((n) => n.id !== 'seuil-micro-projected' && n.id !== 'vl-ineligible');
  if (shown.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label="Alertes">
      {shown.map((n) => (
        <li key={n.id} className={cn('flex items-start gap-3 rounded-[var(--radius-card)] px-4 py-3', n.level === 'critical' ? FAMILY.alert.soft : FAMILY.warn.soft)}>
          <span aria-hidden="true" className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', n.level === 'critical' ? 'bg-alert' : 'bg-warn')} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">{n.title}</p>
            <p className="mt-0.5 text-[14px] leading-snug text-ink-2 text-pretty">{n.body}</p>
            {n.action && (
              <Link to={n.action.to} className="mt-1.5 inline-flex min-h-9 pointer-coarse:min-h-11 items-center gap-1 text-[14px] font-bold text-ink underline decoration-ink/30 hover:decoration-ink">
                {n.action.label} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
              </Link>
            )}
          </div>
          <IconButton label={`Masquer « ${n.title} »`} size="sm" onClick={() => dismiss(n.id)}>
            <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </IconButton>
        </li>
      ))}
    </ul>
  );
}
