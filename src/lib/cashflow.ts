import type {
  CalendarMonth,
  EndOfMonthCalculation,
  PaymentDelayMode,
  UserProfile,
} from '~/types';
import { calcCAFromEntries, calcInvoiceTotals, isTVAApplicableOn } from '~/lib/fiscal';

export interface PaymentTerms {
  days: number;
  mode: PaymentDelayMode;
  endOfMonthCalculation: EndOfMonthCalculation;
}

export interface PaymentProjection {
  serviceMonth: number;
  serviceYear: number;
  invoiceDate: Date;
  dueDate: Date;
  /** Montant HT : sert aux seuils fiscaux et à tous les calculs de CA. */
  amount: number;
  /** TVA collectée sur la facture. */
  taxAmount: number;
  /** Indique que la TVA s'applique à cette facture précise. */
  tvaApplies: boolean;
  /** Montant effectivement facturé / encaissé, TVA comprise. */
  amountTtc: number;
}

export interface CashflowMonth {
  month: number;
  year: number;
  invoiced: number;
  received: number;
  cumulativeInvoiced: number;
  cumulativeReceived: number;
  invoicedTtc: number;
  receivedTtc: number;
  cumulativeInvoicedTtc: number;
  cumulativeReceivedTtc: number;
}

function atNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = atNoon(date);
  next.setDate(next.getDate() + Math.max(0, Math.round(days)));
  return next;
}

export function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

/**
 * Calcule la date limite contractuelle depuis la date d'émission de facture.
 * Les deux interprétations légales de « N jours fin de mois » sont conservées :
 * N jours puis fin du mois, ou fin du mois d'émission puis N jours.
 */
export function calculateDueDate(invoiceDate: Date, terms: PaymentTerms): Date {
  if (terms.days <= 0) return atNoon(invoiceDate);
  if (terms.mode === 'net') return addCalendarDays(invoiceDate, terms.days);
  return terms.endOfMonthCalculation === 'monthEndThenDelay'
    ? addCalendarDays(monthEnd(invoiceDate), terms.days)
    : monthEnd(addCalendarDays(invoiceDate, terms.days));
}

export function getPaymentTerms(
  profile: Pick<UserProfile, 'paymentDelayDays' | 'paymentDelayMode' | 'endOfMonthCalculation'>,
): PaymentTerms {
  return {
    days: profile.paymentDelayDays,
    mode: profile.paymentDelayMode,
    endOfMonthCalculation: profile.endOfMonthCalculation,
  };
}

/** Une facture mensuelle est réputée émise le dernier jour du mois de prestation. */
export function buildPaymentProjections(
  months: CalendarMonth[],
  profile: UserProfile,
): PaymentProjection[] {
  const terms = getPaymentTerms(profile);
  return months.flatMap((month) => {
    const amount = calcCAFromEntries(month, profile);
    if (amount <= 0) return [];
    const invoiceDate = new Date(month.year, month.month + 1, 0, 12);
    const tvaApplies = isTVAApplicableOn(profile, invoiceDate);
    const totals = calcInvoiceTotals(amount, tvaApplies, profile.tvaRate);
    return [{
      serviceMonth: month.month,
      serviceYear: month.year,
      invoiceDate,
      dueDate: calculateDueDate(invoiceDate, terms),
      amount: totals.ht,
      taxAmount: totals.tva,
      amountTtc: totals.ttc,
      tvaApplies,
    }];
  });
}

/**
 * Série mensuelle couvrant l'année de prestation et les éventuels encaissements
 * décalés au début de l'année suivante.
 */
export function buildCashflowTimeline(projections: PaymentProjection[]): CashflowMonth[] {
  if (projections.length === 0) return [];
  const first = projections.reduce(
    (min, item) => item.invoiceDate < min ? item.invoiceDate : min,
    projections[0].invoiceDate,
  );
  const last = projections.reduce(
    (max, item) => item.dueDate > max ? item.dueDate : max,
    projections[0].dueDate,
  );
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1, 12);
  const end = new Date(last.getFullYear(), last.getMonth(), 1, 12);
  const rows: CashflowMonth[] = [];
  let cumulativeInvoiced = 0;
  let cumulativeReceived = 0;
  let cumulativeInvoicedTtc = 0;
  let cumulativeReceivedTtc = 0;

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const invoiced = projections
      .filter((item) => item.invoiceDate.getFullYear() === year && item.invoiceDate.getMonth() === month)
      .reduce((sum, item) => sum + item.amount, 0);
    const received = projections
      .filter((item) => item.dueDate.getFullYear() === year && item.dueDate.getMonth() === month)
      .reduce((sum, item) => sum + item.amount, 0);
    const invoicedTtc = projections
      .filter((item) => item.invoiceDate.getFullYear() === year && item.invoiceDate.getMonth() === month)
      .reduce((sum, item) => sum + item.amountTtc, 0);
    const receivedTtc = projections
      .filter((item) => item.dueDate.getFullYear() === year && item.dueDate.getMonth() === month)
      .reduce((sum, item) => sum + item.amountTtc, 0);
    cumulativeInvoiced += invoiced;
    cumulativeReceived += received;
    cumulativeInvoicedTtc += invoicedTtc;
    cumulativeReceivedTtc += receivedTtc;
    rows.push({
      year,
      month,
      invoiced,
      received,
      cumulativeInvoiced,
      cumulativeReceived,
      invoicedTtc,
      receivedTtc,
      cumulativeInvoicedTtc,
      cumulativeReceivedTtc,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return rows;
}

export function sumReceiptsForYear(projections: PaymentProjection[], year: number): number {
  return projections
    .filter((item) => item.dueDate.getFullYear() === year)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Retourne l'index de la prochaine échéance à venir, indépendamment de l'ordre
 * des projections. Une échéance prévue aujourd'hui est considérée à venir.
 */
export function getNextPaymentProjectionIndex(
  projections: PaymentProjection[],
  today: Date,
): number {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return projections.reduce((nextIndex, item, index) => {
    if (item.dueDate < startOfToday) return nextIndex;
    if (nextIndex === -1 || item.dueDate < projections[nextIndex].dueDate) return index;
    return nextIndex;
  }, -1);
}

export function sumReceiptsThroughDate(projections: PaymentProjection[], date: Date): number {
  const limit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return projections
    .filter((item) => item.dueDate <= limit)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function calcReceiptThresholdDate(
  projections: PaymentProjection[],
  threshold: number,
  calendarYear?: number,
): Date | null {
  let cumulative = 0;
  const ordered = [...projections]
    .filter((item) => calendarYear === undefined || item.dueDate.getFullYear() === calendarYear)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  for (const item of ordered) {
    cumulative += item.amount;
    if (cumulative >= threshold) return item.dueDate;
  }
  return null;
}

/**
 * Date de la facture mensuelle qui fait dépasser un plafond de chiffre d'affaires.
 * Le dépassement légal est strict : un cumul exactement égal au plafond ne suffit pas.
 */
export function calcInvoiceThresholdDate(
  projections: PaymentProjection[],
  threshold: number,
  calendarYear?: number,
): Date | null {
  let cumulative = 0;
  const ordered = [...projections]
    .filter((item) => calendarYear === undefined || item.invoiceDate.getFullYear() === calendarYear)
    .sort((a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime());
  for (const item of ordered) {
    cumulative += item.amount;
    if (cumulative > threshold) return item.invoiceDate;
  }
  return null;
}

export function sumInvoicesThroughDate(projections: PaymentProjection[], date: Date): number {
  const limit = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return projections
    .filter((item) => item.invoiceDate <= limit)
    .reduce((sum, item) => sum + item.amount, 0);
}
