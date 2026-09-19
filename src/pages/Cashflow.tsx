import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  ReceiptText,
  Settings2,
  WalletCards,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { getDaysInMonth, isWeekend, MONTH_SHORT } from '~/lib/calendar';
import { monthHasRevenue } from '~/lib/fiscal';
import {
  buildCashflowTimeline,
  buildPaymentProjections,
  getNextPaymentProjectionIndex,
  sumReceiptsForYear,
  sumReceiptsThroughDate,
} from '~/lib/cashflow';
import { formatEuro, formatInvoiceEuro } from '~/lib/format';

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function formatTerms(days: number, mode: 'net' | 'endOfMonth'): string {
  if (days === 0) return 'Paiement comptant';
  return mode === 'net' ? `${days} jours nets` : `${days} jours fin de mois`;
}

export const Cashflow: React.FC = () => {
  const { profile } = useProfile();
  const fy = useFiscalYearCtx();
  const navigate = useNavigate();
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => setChartReady(true), []);
  const showCalendar = profile.revenueModel === 'days' || profile.revenueModel === 'mixed';

  const projectedMonths = useMemo(() => {
    if (!showCalendar) return fy.fiscalYear.months;
    return fy.fiscalYear.months.map((month) => {
      const hasDays = month.workedDays.length > 0 || (month.halfDays?.length ?? 0) > 0;
      if (hasDays || monthHasRevenue(month) || month.month < fy.currentMonthIndex) return month;
      const workedDays: number[] = [];
      for (let day = 1; day <= getDaysInMonth(fy.year, month.month) && workedDays.length < profile.workingDays; day++) {
        if (!isWeekend(fy.year, month.month, day) && !fy.isJourFerie(month.month, day)) workedDays.push(day);
      }
      return { ...month, workedDays, halfDays: [] };
    });
  }, [showCalendar, fy.fiscalYear.months, fy.currentMonthIndex, fy.year, fy.isJourFerie, profile.workingDays]);

  const projections = useMemo(
    () => buildPaymentProjections(projectedMonths, profile),
    [projectedMonths, profile],
  );
  const today = useMemo(() => new Date(), []);
  const startOfToday = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );
  const nextPaymentIndex = useMemo(
    () => getNextPaymentProjectionIndex(projections, today),
    [projections, today],
  );
  const timeline = useMemo(() => buildCashflowTimeline(projections), [projections]);
  const totalInvoiced = projections.reduce((sum, item) => sum + item.amount, 0);
  const totalInvoicedTtc = projections.reduce((sum, item) => sum + item.amountTtc, 0);
  const totalTax = projections.reduce((sum, item) => sum + item.taxAmount, 0);
  const receivedInYear = sumReceiptsForYear(projections, fy.year);
  const receivedInYearTtc = projections.filter((item) => item.dueDate.getFullYear() === fy.year).reduce((sum, item) => sum + item.amountTtc, 0);
  const receivedThroughToday = sumReceiptsThroughDate(projections, today);
  const receivedThroughTodayTtc = projections.filter((item) => item.dueDate <= today).reduce((sum, item) => sum + item.amountTtc, 0);
  const shiftedToNextYear = projections
    .filter((item) => item.dueDate.getFullYear() > fy.year)
    .reduce((sum, item) => sum + item.amount, 0);
  const shiftedToNextYearTtc = projections
    .filter((item) => item.dueDate.getFullYear() > fy.year)
    .reduce((sum, item) => sum + item.amountTtc, 0);
  const awaitingPayment = Math.max(0, totalInvoiced - receivedThroughToday);
  const awaitingPaymentTtc = Math.max(0, totalInvoicedTtc - receivedThroughTodayTtc);
  const displayAmount = (ht: number, ttc: number) => formatInvoiceEuro(profile.tvaAssujetti ? ttc : ht);
  const amountSuffix = profile.tvaAssujetti ? ' TTC' : ' HT';

  const chartData = timeline.map((row) => ({
    label: `${MONTH_SHORT[row.month]}${row.year !== fy.year ? ` ${String(row.year).slice(2)}` : ''}`,
    facturé: profile.tvaAssujetti ? row.cumulativeInvoicedTtc : row.cumulativeInvoiced,
    encaissé: profile.tvaAssujetti ? row.cumulativeReceivedTtc : row.cumulativeReceived,
  }));

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Projection annuelle</p>
          <h1 className="mt-1 font-headline text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
            Encaissements au plus tard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Visualisez quand les prestations de {fy.year} devraient être réglées selon votre délai contractuel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/encaissements', search: { settings: 'payments' } })}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl border border-outline-variant/35 bg-surface-lowest px-4 py-2 text-sm font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-highest/30 focus:outline-none focus:ring-2 focus:ring-secondary/30 sm:self-auto"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          {formatTerms(profile.paymentDelayDays, profile.paymentDelayMode)}
        </button>
      </header>

      <section aria-label="Résumé des encaissements" className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4 lg:gap-4">
        {[
          { label: 'Facturé en projection', ht: totalInvoiced, ttc: totalInvoicedTtc, Icon: ReceiptText },
          { label: 'À encaisser', ht: awaitingPayment, ttc: awaitingPaymentTtc, Icon: WalletCards, emphasis: true },
          { label: `Encaissé en ${fy.year}`, ht: receivedInYear, ttc: receivedInYearTtc, Icon: CircleDollarSign },
          { label: `Reporté après ${fy.year}`, ht: shiftedToNextYear, ttc: shiftedToNextYearTtc, Icon: ArrowRight },
        ].map(({ label, ht, ttc, Icon, emphasis }) => (
          <article key={label} className={clsx('min-w-0 rounded-2xl p-4 shadow-sm sm:p-5', emphasis ? 'border border-secondary/30 bg-secondary/[0.06]' : 'bg-surface-lowest')}>
            <Icon className={clsx('h-4 w-4', emphasis ? 'text-secondary' : 'text-on-surface-variant')} aria-hidden="true" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant sm:text-[11px]">{label}</p>
            <p className={clsx('mt-1 truncate font-mono text-base font-bold tabular-nums sm:text-lg', emphasis ? 'text-secondary' : 'text-on-surface')} title={`${displayAmount(ht, ttc)} €`}>
              {displayAmount(ht, ttc)} €
            </p>
            {profile.tvaAssujetti && <p className="mt-1 font-mono text-[11px] font-bold tabular-nums text-tax">HT {formatInvoiceEuro(ht)} €</p>}
          </article>
        ))}
      </section>

      <section aria-label="Résumé prioritaire des encaissements" className="space-y-3 md:hidden">
        <article className="rounded-3xl border border-secondary/30 bg-secondary/[0.07] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">À encaisser{amountSuffix}</p>
              <p className="mt-2 font-headline font-black text-3xl leading-none tabular-nums text-on-surface">{displayAmount(awaitingPayment, awaitingPaymentTtc)} €</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-on-secondary"><WalletCards className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <p className="mt-4 border-t border-secondary/15 pt-3 text-xs leading-relaxed text-on-surface-variant">
            Sur {displayAmount(totalInvoiced, totalInvoicedTtc)} € facturés, {displayAmount(receivedThroughToday, receivedThroughTodayTtc)} € sont déjà encaissés à date.
          </p>
        </article>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Facturé', ht: totalInvoiced, ttc: totalInvoicedTtc, Icon: ReceiptText },
            { label: 'Encaissé à date', ht: receivedThroughToday, ttc: receivedThroughTodayTtc, Icon: CircleDollarSign },
          ].map(({ label, ht, ttc, Icon }) => (
            <article key={label} className="min-w-0 rounded-2xl bg-surface-lowest p-4 shadow-sm">
              <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}{amountSuffix}</p>
              <p className="mt-1 truncate font-mono text-base font-bold tabular-nums text-on-surface">{displayAmount(ht, ttc)} €</p>
            </article>
          ))}
        </div>

        {shiftedToNextYearTtc > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-low px-4 py-3 text-xs">
            <span className="inline-flex items-center gap-2 font-bold text-on-surface-variant"><ArrowRight className="h-4 w-4" aria-hidden="true" /> Reporté après {fy.year}</span>
            <span className="font-mono font-bold tabular-nums text-on-surface">{displayAmount(shiftedToNextYear, shiftedToNextYearTtc)} €</span>
          </div>
        )}
      </section>

      {profile.tvaAssujetti && (
        <aside className="rounded-2xl border border-tax/20 bg-tax-container px-4 py-3 text-xs leading-relaxed text-on-surface">
          <span className="font-bold text-tax">TVA collectée en projection · {formatInvoiceEuro(totalTax)} €</span>
          <span className="ml-1">Elle est incluse dans les montants TTC, mais exclue du CA et des seuils fiscaux.</span>
        </aside>
      )}

      {projections.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-outline-variant/45 bg-surface-lowest px-6 py-12 text-center">
          <WalletCards className="mx-auto h-8 w-8 text-secondary" aria-hidden="true" />
          <h2 className="mt-4 font-headline text-lg font-bold text-on-surface">Aucune prestation à projeter</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            Renseignez des jours ou des revenus dans le planning pour voir apparaître les échéances de paiement.
          </p>
          <Link to="/" className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">
            Ouvrir le planning
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="cashflow-chart-title" className="rounded-3xl bg-surface-lowest p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="cashflow-chart-title" className="font-headline text-lg font-bold text-on-surface">Facturé vs encaissé{profile.tvaAssujetti ? ' TTC' : ''}</h2>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">Cumul des factures mensuelles et de leur paiement à l’échéance maximale.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] font-bold text-on-surface-variant" aria-hidden="true">
                <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 bg-secondary" /> Facturé</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-amber-500" /> Encaissé</span>
              </div>
            </div>
            <div className="mt-5 h-[260px] min-w-0 w-full sm:h-[320px]" aria-hidden="true">
              {chartReady ? <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                initialDimension={{ width: 320, height: 260 }}
              >
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" className="text-outline-variant/20" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-on-surface-variant" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 11 }} stroke="currentColor" className="text-on-surface-variant" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [`${formatEuro(Number(value))} €`]}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-lowest)', color: 'var(--color-on-surface)' }}
                  />
                  <Line type="monotone" dataKey="facturé" stroke="var(--color-secondary)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                  <Line type="stepAfter" dataKey="encaissé" stroke="#d97706" strokeWidth={3} strokeDasharray="7 5" dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer> : <div className="h-full w-full rounded-2xl bg-surface-low motion-safe:animate-pulse" />}
            </div>
          </section>

          <section aria-labelledby="payment-calendar-title" className="rounded-3xl bg-surface-lowest p-5 shadow-sm sm:p-6">
            <h2 id="payment-calendar-title" className="font-headline text-lg font-bold text-on-surface">Calendrier des paiements</h2>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Hypothèse : une facture récapitulative est émise le dernier jour de chaque mois de prestation.
            </p>

            <div className="mt-5 space-y-2 md:hidden">
              {projections.map((item, index) => {
                const isPast = item.dueDate < startOfToday;
                const isNext = index === nextPaymentIndex;
                return (
                  <article
                    key={`${item.serviceYear}-${item.serviceMonth}`}
                    className={clsx(
                      'rounded-2xl border p-4 transition-colors',
                      isNext
                        ? 'border-secondary/45 bg-secondary/[0.06] ring-1 ring-secondary/15'
                        : isPast
                          ? 'border-outline-variant/15 bg-surface-low/35'
                          : 'border-outline-variant/25',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={clsx('text-[10px] font-bold uppercase tracking-wider', isNext ? 'text-secondary' : 'text-on-surface-variant')}>
                          Date de paiement
                        </p>
                        <p className={clsx('mt-1 text-sm font-bold', isPast ? 'text-on-surface-variant' : 'text-on-surface')}>
                          {DATE_FORMAT.format(item.dueDate)}
                        </p>
                        {isNext ? (
                          <span className="mt-2 inline-flex rounded-full bg-secondary px-2 py-1 text-[10px] font-black uppercase tracking-wide text-on-secondary">Prochain paiement</span>
                        ) : isPast ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant/65">
                            <CalendarClock className="h-3 w-3" aria-hidden="true" /> Échéance passée
                          </span>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">À encaisser{profile.tvaAssujetti ? ' TTC' : ''}</p>
                        <p className={clsx('mt-1 shrink-0 font-mono text-sm font-bold tabular-nums', isPast ? 'text-on-surface-variant' : 'text-on-surface')}>
                          {formatInvoiceEuro(profile.tvaAssujetti ? item.amountTtc : item.amount)} €
                        </p>
                        {profile.tvaAssujetti && <p className="mt-1 font-mono text-[10px] font-bold tabular-nums text-tax">HT {formatInvoiceEuro(item.amount)} € · TVA {formatInvoiceEuro(item.taxAmount)} €</p>}
                      </div>
                    </div>
                    <div className={clsx('mt-3 flex items-center justify-between gap-3 border-t pt-3 text-xs', isPast ? 'border-outline-variant/15 text-on-surface-variant/65' : 'border-outline-variant/20 text-on-surface-variant')}>
                      <span className="font-bold uppercase tracking-wider">Date de facturation</span>
                      <span>{DATE_FORMAT.format(item.invoiceDate)}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/25 text-[11px] uppercase tracking-wider text-on-surface-variant">
                    <th scope="col" className="px-3 py-3 font-bold text-secondary">Date de paiement</th>
                    <th scope="col" className="px-3 py-3 text-right font-bold">Montant à encaisser{profile.tvaAssujetti ? ' TTC' : ''}</th>
                    <th scope="col" className="px-3 py-3 font-bold">Date de facturation</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((item, index) => {
                    const isPast = item.dueDate < startOfToday;
                    const isNext = index === nextPaymentIndex;
                    return (
                      <tr
                        key={`${item.serviceYear}-${item.serviceMonth}`}
                        className={clsx(
                          'border-b border-outline-variant/15 transition-colors last:border-0',
                          isNext ? 'bg-secondary/[0.06]' : isPast && 'bg-surface-low/30',
                        )}
                      >
                        <th scope="row" className={clsx('px-3 py-4 font-bold', isNext && 'border-l-4 border-secondary pl-4', isPast ? 'text-on-surface-variant/70' : 'text-on-surface')}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={clsx('rounded-full px-2.5 py-1 font-bold', isNext ? 'bg-secondary text-on-secondary shadow-sm' : isPast ? 'bg-surface-highest/30 text-on-surface-variant/70' : 'bg-secondary/8 text-secondary')}>
                              {DATE_FORMAT.format(item.dueDate)}
                            </span>
                            {isNext && <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Prochain paiement</span>}
                            {isPast && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60"><CalendarClock className="h-3 w-3" aria-hidden="true" /> Échéance passée</span>}
                          </div>
                        </th>
                        <td className={clsx('px-3 py-4 text-right font-mono font-bold tabular-nums', isPast ? 'text-on-surface-variant/70' : 'text-on-surface')}>
                          {formatInvoiceEuro(profile.tvaAssujetti ? item.amountTtc : item.amount)} €
                          {profile.tvaAssujetti && <span className="mt-1 block text-[10px] font-bold text-tax">HT {formatInvoiceEuro(item.amount)} € · TVA {formatInvoiceEuro(item.taxAmount)} €</span>}
                        </td>
                        <td className={clsx('px-3 py-4', isPast ? 'text-on-surface-variant/60' : 'text-on-surface-variant')}>
                          {DATE_FORMAT.format(item.invoiceDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <aside className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
        Cette projection est une date contractuelle maximale, pas une garantie d’encaissement. Les paiements réels et les factures de l’année précédente ne sont pas encore rapprochés automatiquement.
      </aside>
    </div>
  );
};
