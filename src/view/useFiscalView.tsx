import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import {
  ACTIVITY_PARAMS,
  COMPTE_PRO_THRESHOLD,
  calcCAByActivity,
  calcCAFromEntries,
  calcCAYearFromEntries,
  calcCaRealiseFromEntries,
  calcEquivDays,
  calcInvoiceTotals,
  calcSeuilDateFromEntries,
  getActivities,
  getPrimaryActivity,
  isTVAApplicableOn,
  monthHasRevenue,
  resolveMonthlyTjm,
} from '~/lib/fiscal';
import { calcCalendarMonthBreakdown, calcNetCumuleFromMonths } from '~/lib/monthlyNet';
import { projectMonths, projectedMonthIndexes } from '~/lib/projection';
import { calcTVAStatusMulti } from '~/lib/tvaMulti';
import { buildUrssafDeclarations } from '~/lib/urssafDeclarations';
import { calcProvisions } from '~/lib/provisions';
import { calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { buildCashflowTimeline, buildPaymentProjections, getNextPaymentProjectionIndex, type PaymentProjection } from '~/lib/cashflow';
import { useCarriedOverPayments } from '~/hooks/useCarriedOverPayments';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import type { CalendarMonth, UserProfile } from '~/types';
import type { MonthVM, SeuilStatus, TreasuryVM, UpcomingVM, YearMonthVM, YearVM } from '~/view/types';

const monthYearFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** Date de référence « à date » : fin d'année pour une année passée, 1er janvier pour une année future. */
function referenceDate(year: number): Date {
  const now = new Date();
  if (year < now.getFullYear()) return new Date(year, 11, 31, 23, 59, 59, 999);
  if (year > now.getFullYear()) return new Date(year, 0, 1, 0, 0, 0, 0);
  return now;
}

function termsLabel(p: UserProfile): string {
  if (p.paymentDelayDays === 0) return 'paiement comptant';
  return `${p.paymentDelayDays} jours ${p.paymentDelayMode === 'net' ? 'nets' : 'fin de mois'}`;
}

function buildMonthVM(month: CalendarMonth, index: number, profile: UserProfile, year: number): MonthVM {
  const b = calcCalendarMonthBreakdown(month, profile, year);
  const invoiceDate = new Date(year, index + 1, 0, 12);
  const tvaApplies = isTVAApplicableOn(profile, invoiceDate);
  const invoice = calcInvoiceTotals(b.ca, tvaApplies, profile.tvaRate);
  let tvaStartsLabel: string | null = null;
  if (profile.tvaAssujetti && !tvaApplies && profile.tvaEffectiveDate) {
    const eff = new Date(`${profile.tvaEffectiveDate}T12:00:00`);
    if (eff > invoiceDate) tvaStartsLabel = monthYearFmt.format(eff);
  }
  const primary = getPrimaryActivity(profile).type;
  const urssafNet = Math.max(0, b.urssafBrut - b.acreReduction);
  return {
    index,
    name: MONTH_NAMES[index],
    days: calcEquivDays(month),
    tjm: resolveMonthlyTjm(profile, index),
    tjmCustom: profile.tjmByMonth?.[index] !== undefined,
    defaultTjm: profile.tjm,
    ca: b.ca,
    tva: invoice.tva,
    ttc: invoice.ttc,
    tvaApplies,
    tvaStartsLabel,
    urssaf: b.urssafBrut,
    urssafRate: profile.urssafRate,
    acre: b.acreReduction,
    acreRate: b.acreRate,
    cfp: b.cfp,
    taxeConsulaire: b.taxeConsulaire,
    ij: b.ij,
    cotisations: urssafNet + b.cfp + b.taxeConsulaire + b.ij,
    impot: b.ir,
    impotMode: b.irMode,
    vlRate: ACTIVITY_PARAMS[primary].tauxVL,
    charges: b.chargesFixes,
    net: b.net,
    aMettreDeCote: urssafNet + b.cfp + b.taxeConsulaire + b.ij + b.ir + (tvaApplies ? invoice.tva : 0),
    hasRevenue: b.ca > 0,
  };
}

interface Core {
  year: YearVM;
  treasury: TreasuryVM;
  upcoming: UpcomingVM[];
}

const Ctx = createContext<Core | null>(null);

/** Calcule une fois par rendu les modèles de vue de l'année (écrans Mois, Année, Trésorerie). */
export function FiscalViewProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const fy = useFiscalYearCtx();
  const { year, currentMonthIndex, todayDate, isJourFerie } = fy;
  const months = fy.fiscalYear.months;
  const carriedOver = useCarriedOverPayments(year, profile);

  const core = useMemo<Core>(() => {
    const ref = referenceDate(year);
    const projOpts = { year, currentMonthIndex, isJourFerie };
    const projected = projectMonths(months, profile, projOpts);
    const projectedSet = new Set(projectedMonthIndexes(months, profile, projOpts));

    // --- Année ---
    const caSaisi = calcCAYearFromEntries(months, profile);
    const { caRealise } = calcCaRealiseFromEntries(months, profile, currentMonthIndex, todayDate);
    const caProjete = calcCAYearFromEntries(projected, profile);
    const netCumule = calcNetCumuleFromMonths(months, profile, year);
    const netProjete = calcNetCumuleFromMonths(projected, profile, year);

    const yearMonths: YearMonthVM[] = months.map((m, i) => {
      const isProjected = projectedSet.has(i);
      const source = isProjected ? projected[i] : m;
      const has = monthHasRevenue(source) || calcCAFromEntries(source, profile) > 0;
      if (!has) {
        return { index: i, short: MONTH_SHORT[i], name: MONTH_NAMES[i], ca: 0, net: 0, cotisations: 0, impot: 0, charges: 0, days: 0, hasData: false, projected: false };
      }
      const b = calcCalendarMonthBreakdown(source, profile, year);
      return {
        index: i,
        short: MONTH_SHORT[i],
        name: MONTH_NAMES[i],
        ca: b.ca,
        net: b.net,
        cotisations: b.contributions,
        impot: b.ir,
        charges: b.chargesFixes,
        days: calcEquivDays(source),
        hasData: !isProjected,
        projected: isProjected,
      };
    });

    // Cumuls pour l'élévation.
    let cumReal = 0;
    let cumProj = 0;
    const realisedPerMonth = months.map((m, i) => {
      if (i < currentMonthIndex) return calcCAFromEntries(m, profile);
      return 0;
    });
    const cumul = months.map((m, i) => {
      cumProj += calcCAFromEntries(projected[i], profile);
      let realise: number | null = null;
      if (i < currentMonthIndex) {
        cumReal += realisedPerMonth[i];
        realise = cumReal;
      } else if (i === currentMonthIndex) {
        realise = caRealise;
      }
      return { index: i, realise, projete: cumProj };
    });

    // Seuil micro.
    const seuilMicro = profile.seuilMicro;
    const seuilDate = seuilMicro > 0 ? calcSeuilDateFromEntries(projected, profile, seuilMicro) : null;
    let seuilStatus: SeuilStatus = 'ok';
    if (seuilMicro > 0 && caRealise >= seuilMicro) seuilStatus = 'crossed';
    else if (seuilDate) seuilStatus = 'projected';
    else if (seuilMicro > 0 && caProjete / seuilMicro >= 0.8) seuilStatus = 'near';

    // TVA (sur les factures, projection comprise).
    const projections: PaymentProjection[] = buildPaymentProjections(projected, profile);
    const realProjections = buildPaymentProjections(months, profile);
    const invoiceTotals = realProjections.reduce(
      (t, p) => ({ ht: t.ht + p.amount, tva: t.tva + p.taxAmount, ttc: t.ttc + p.amountTtc }),
      { ht: 0, tva: 0, ttc: 0 },
    );
    const caByActivityProjected = calcCAByActivity(projected, profile);
    const tvaMulti = calcTVAStatusMulti(caByActivityProjected, { profile, projections, year });
    const tvaRealise = projections.filter((p) => p.invoiceDate <= ref).reduce((s, p) => s + p.amount, 0);
    const tvaProjete = projections.filter((p) => p.serviceYear === year).reduce((s, p) => s + p.amount, 0);
    const tvaDate = tvaMulti.status === 'breach' ? tvaMulti.seuilDates.majore : tvaMulti.seuilDates.basique;

    const yearVm: YearVM = {
      year,
      caSaisi,
      caRealise,
      caProjete,
      netCumule,
      netProjete,
      monthsWithActivity: months.filter(monthHasRevenue).length,
      seuilMicro,
      seuil: { status: seuilStatus, date: seuilDate, marge: Math.max(0, seuilMicro - caProjete) },
      tva: {
        assujetti: profile.tvaAssujetti,
        status: tvaMulti.status,
        seuil: tvaMulti.seuil.basique,
        seuilMajore: tvaMulti.seuil.majore,
        date: tvaDate,
        realise: tvaRealise,
        projete: tvaProjete,
        effectiveDate: profile.tvaEffectiveDate,
        rate: profile.tvaRate,
        invoice: invoiceTotals,
      },
      months: yearMonths,
      cumul,
      activities: getActivities(profile),
      caByActivity: calcCAByActivity(months, profile),
      comptePro: { threshold: COMPTE_PRO_THRESHOLD, exceeded: caSaisi > COMPTE_PRO_THRESHOLD },
    };

    // --- Trésorerie ---
    const taxed = projections.some((p) => p.tvaApplies);
    const amt = (p: PaymentProjection) => (taxed ? p.amountTtc : p.amount);
    const invoiced = projections.reduce((s, p) => s + amt(p), 0);
    const invoicedHt = projections.reduce((s, p) => s + p.amount, 0);
    const collectedToDate = projections.filter((p) => p.dueDate <= ref).reduce((s, p) => s + amt(p), 0);
    const collectedHt = projections.filter((p) => p.dueDate <= ref).reduce((s, p) => s + p.amount, 0);
    const deferred = projections.filter((p) => p.dueDate.getFullYear() > year).reduce((s, p) => s + amt(p), 0);
    const deferredHt = projections.filter((p) => p.dueDate.getFullYear() > year).reduce((s, p) => s + p.amount, 0);
    const collectedInYear = projections.filter((p) => p.dueDate.getFullYear() === year).reduce((s, p) => s + amt(p), 0);
    const nextIndex = getNextPaymentProjectionIndex(projections, ref);
    const firstTaxed = projections.find((p) => p.tvaApplies);

    // Le CA se déclare à l'encaissement : la facture de décembre N-1 payée en janvier compte en N.
    const declarations = buildUrssafDeclarations([...carriedOver, ...projections], profile, year, ref).map((d) => ({
      key: `${d.periodicity}-${d.index}`,
      label: d.label,
      due: d.dueDate,
      caEncaisse: d.caEncaisse,
      sources: d.sources,
      cotisations: d.total,
      status: d.status,
    }));

    const prov = calcProvisions(months, profile, { year, referenceDate: ref, isJourFerie });
    const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, year);

    const treasury: TreasuryVM = {
      hasData: projections.length > 0,
      termsLabel: termsLabel(profile),
      taxed,
      projections,
      timeline: buildCashflowTimeline(projections),
      invoiced,
      invoicedHt,
      collectedToDate,
      collectedHt,
      toCollect: Math.max(0, invoiced - collectedToDate),
      toCollectHt: Math.max(0, invoicedHt - collectedHt),
      collectedInYear,
      deferred,
      deferredHt,
      nextIndex,
      tvaTotal: projections.reduce((s, p) => s + p.taxAmount, 0),
      tvaFrom: firstTaxed ? shortFmt.format(firstTaxed.invoiceDate) : null,
      declarations,
      provisions: {
        cotisations: { toDate: prov.aDate.urssafEtContributions, year: prov.finAnnee.urssafEtContributions },
        impot: { toDate: prov.aDate.impot, year: prov.finAnnee.impot, mode: prov.finAnnee.impotMode },
        tva: { toDate: prov.aDate.tvaCollectee, year: prov.finAnnee.tvaCollectee },
        regularisationVL: prov.finAnnee.regularisationVL > 0 ? prov.finAnnee.regularisationVL : null,
        vlCheck: elig.motif === 'rfr-too-high' && !prov.vlRegularizationNeeded,
      },
    };

    // --- À venir ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const upcoming: UpcomingVM[] = [];
    const nextDecl = declarations.find((d) => d.status === 'current') ?? declarations.find((d) => d.status === 'upcoming');
    if (nextDecl && nextDecl.due >= startOfToday) {
      upcoming.push({
        key: 'decl',
        date: nextDecl.due,
        title: `Déclaration URSSAF, ${nextDecl.label.toLowerCase()}`,
        detail: `Sur ${Math.round(nextDecl.caEncaisse).toLocaleString('fr-FR')} € encaissés`,
        amount: nextDecl.cotisations,
        tone: 'neutral',
        to: '/tresorerie',
      });
    }
    const next = nextIndex >= 0 ? projections[nextIndex] : null;
    if (next && next.dueDate >= startOfToday) {
      upcoming.push({
        key: 'pay',
        date: next.dueDate,
        title: 'Paiement client attendu',
        detail: `Facture du ${shortFmt.format(next.invoiceDate)}, au plus tard`,
        amount: amt(next),
        amountTtc: taxed,
        tone: 'neutral',
        to: '/tresorerie',
      });
    }
    if (seuilStatus === 'projected' && seuilDate && seuilDate >= startOfToday) {
      upcoming.push({ key: 'micro', date: seuilDate, title: 'Plafond micro atteint', detail: 'Au rythme actuel, projection comprise', tone: 'warn', to: '/annee' });
    }
    if (!profile.tvaAssujetti && tvaDate && tvaDate >= startOfToday) {
      upcoming.push({
        key: 'tva',
        date: tvaDate,
        title: tvaMulti.status === 'breach' ? 'TVA obligatoire' : 'Seuil de franchise TVA dépassé',
        detail: tvaMulti.status === 'breach' ? 'À facturer dès cette facture' : `TVA au 1er janvier ${year + 1} si le rythme se confirme`,
        tone: tvaMulti.status === 'breach' ? 'alert' : 'warn',
        to: '/annee',
      });
    }
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    return { year: yearVm, treasury, upcoming: upcoming.slice(0, 4) };
  }, [months, profile, year, currentMonthIndex, todayDate, isJourFerie, carriedOver]);

  return <Ctx.Provider value={core}>{children}</Ctx.Provider>;
}

function useCore(): Core {
  const c = useContext(Ctx);
  if (!c) throw new Error('FiscalViewProvider manquant');
  return c;
}

export const useYearView = (): YearVM => useCore().year;
export const useTreasuryView = (): TreasuryVM => useCore().treasury;
export const useUpcoming = (): UpcomingVM[] => useCore().upcoming;

export function useMonthView(index: number): MonthVM {
  const { profile } = useProfile();
  const fy = useFiscalYearCtx();
  const month = fy.fiscalYear.months[index];
  return useMemo(() => buildMonthVM(month, index, profile, fy.year), [month, index, profile, fy.year]);
}
