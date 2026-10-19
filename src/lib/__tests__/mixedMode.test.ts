import { describe, expect, it } from 'vitest';
import type { CalendarMonth, RevenueEntry } from '~/types';
import {
  calcCAByActivity,
  calcCAFromEntries,
  calcCaRealiseFromEntries,
  calcSeuilDateFromEntries,
  effectiveEntries,
  effectiveEntriesForModel,
  isCalendarLine,
  monthHasRevenue,
  monthHasRevenueForModel,
} from '~/lib/fiscal';
import { cycleDayInMonths, withoutCalendarLines } from '~/lib/calendarMutations';
import { makeProfile, monthsOf } from './testUtils';

const mixed = makeProfile({ revenueModel: 'mixed', tjm: 500 });
const noFerie = () => false;
const forfait = (amount: number, id = 'f1'): RevenueEntry => ({ kind: 'forfait', id, date: '2026-06-20', amount });

// Juin 2026 : le 1er est un lundi.
const june = (patch: Partial<CalendarMonth> = {}): CalendarMonth => ({
  month: 5,
  year: 2026,
  workedDays: [],
  halfDays: [],
  entries: [],
  ...patch,
});

/** Simule l'UI actuelle : la liste de forfaits reçoit `effectiveEntries` et persiste `[...entries, next]`. */
function addForfaitLikeUI(month: CalendarMonth, entry: RevenueEntry): CalendarMonth {
  return { ...month, entries: [...effectiveEntries(month), entry] };
}

describe('mode mixte : les jours cochés restent la source de vérité de la ligne jours', () => {
  it('reproduit le bug : après ajout d’un forfait, un clic calendrier change encore le CA', () => {
    let months = monthsOf(2026, [{}, {}, {}, {}, {}, { workedDays: [1, 2] }]);
    months = months.map((m) => (m.month === 5 ? addForfaitLikeUI(m, forfait(1_000)) : m));
    // La ligne virtuelle a été figée dans entries…
    expect(months[5].entries.some(isCalendarLine)).toBe(true);
    expect(calcCAFromEntries(months[5], mixed)).toBe(2 * 500 + 1_000);
    // …mais un clic suivant doit continuer à compter.
    months = cycleDayInMonths(months, 2026, 5, 3, noFerie);
    expect(months[5].workedDays).toEqual([1, 2, 3]);
    expect(calcCAFromEntries(months[5], mixed)).toBe(3 * 500 + 1_000);
  });

  it('forfait seul dans entries + jours cochés ensuite : les jours comptent en mode mixte', () => {
    const month = june({ workedDays: [1, 2], entries: [forfait(1_000)] });
    expect(calcCAFromEntries(month, mixed)).toBe(2 * 500 + 1_000);
  });

  it('réconcilie un vieux `days` figé avec workedDays/halfDays (données persistées)', () => {
    const month = june({
      workedDays: [1, 2, 3, 4],
      halfDays: [8],
      entries: [
        { kind: 'days', id: 'calendar-2026-5', days: [1, 2], halfDays: [] },
        { kind: 'flat', id: 'fl', amount: 300 },
      ],
    });
    expect(calcCAFromEntries(month, mixed)).toBe(4.5 * 500 + 300);
    const line = effectiveEntriesForModel(month, 'mixed').find(isCalendarLine);
    expect(line).toMatchObject({ days: [1, 2, 3, 4], halfDays: [8] });
  });

  it('la réconciliation conserve tjmOverride et activityId de la ligne persistée', () => {
    const month = june({
      workedDays: [1, 2, 3],
      entries: [
        { kind: 'days', id: 'calendar-2026-5', days: [1], halfDays: [], tjmOverride: 800, activityId: 'shop' },
        forfait(1_000),
      ],
    });
    const profile = makeProfile({
      revenueModel: 'mixed',
      activities: [
        { id: 'svc', type: 'liberalSsi', isPrimary: true },
        { id: 'shop', type: 'vente', isPrimary: false },
      ],
    });
    expect(calcCAFromEntries(month, profile)).toBe(3 * 800 + 1_000);
    const byActivity = calcCAByActivity([month], profile);
    expect(byActivity.vente).toBe(3 * 800);
    expect(byActivity.liberalSsi).toBe(1_000);
  });

  it('jours décochés après le gel : la ligne figée ne compte plus', () => {
    const month = june({
      workedDays: [],
      entries: [{ kind: 'days', id: 'calendar-2026-5', days: [1, 2], halfDays: [] }, forfait(1_000)],
    });
    expect(calcCAFromEntries(month, mixed)).toBe(1_000);
    expect(monthHasRevenueForModel(month, 'mixed')).toBe(true);
  });

  it('ne duplique pas la ligne jours si elle est persistée plusieurs fois', () => {
    const month = june({
      workedDays: [1],
      entries: [
        { kind: 'days', id: 'calendar-2026-5', days: [1], halfDays: [] },
        { kind: 'days', id: 'calendar-2026-5', days: [1], halfDays: [] },
      ],
    });
    expect(effectiveEntriesForModel(month, 'mixed').filter(isCalendarLine)).toHaveLength(1);
    expect(calcCAFromEntries(month, mixed)).toBe(500);
  });

  it('mode days : le calendrier compte même si entries contient un reste de forfait', () => {
    const month = june({ workedDays: [1, 2], entries: [forfait(1_000)] });
    expect(calcCAFromEntries(month, makeProfile({ revenueModel: 'days' }))).toBe(2_000);
  });

  it('modes forfait/flat : des jours résiduels (calendrier masqué) restent ignorés si entries est saisi', () => {
    const month = june({ workedDays: [1, 2, 3, 4, 5], entries: [{ kind: 'flat', id: 'f', amount: 10_000 }] });
    expect(calcCAFromEntries(month, makeProfile({ revenueModel: 'flat' }))).toBe(10_000);
    expect(calcCAFromEntries(month, makeProfile({ revenueModel: 'forfait' }))).toBe(10_000);
  });

  it('sans entries, le comportement historique est inchangé (ligne virtuelle)', () => {
    const month = june({ workedDays: [1, 2], halfDays: [3] });
    expect(effectiveEntries(month)).toEqual([
      { kind: 'days', id: 'calendar-2026-5', days: [1, 2], halfDays: [3] },
    ]);
  });

  it('CA réalisé et date de seuil suivent aussi le calendrier en mode mixte', () => {
    const month = june({ workedDays: [1, 2, 3], entries: [forfait(1_000)] });
    const realise = calcCaRealiseFromEntries([month], mixed, 5, 30);
    expect(realise.caRealise).toBe(3 * 500 + 1_000);
    expect(realise.joursRealises).toBe(3);
    const date = calcSeuilDateFromEntries([month], mixed, 1_400);
    expect(date).toEqual(new Date(2026, 5, 3));
  });
});

describe('withoutCalendarLines', () => {
  it('retire la ligne jours dérivée avant persistance (les jours restent dans workedDays)', () => {
    const month = june({ workedDays: [1, 2], entries: [forfait(1_000)] });
    const edited = [...effectiveEntriesForModel(month, 'mixed'), forfait(500, 'f2')];
    const persisted = withoutCalendarLines(edited);
    expect(persisted.map((e) => e.id)).toEqual(['f1', 'f2']);
    expect(calcCAFromEntries({ ...month, entries: persisted }, mixed)).toBe(2 * 500 + 1_500);
  });

  it('conserve les lignes days explicites (autre id)', () => {
    const explicit: RevenueEntry = { kind: 'days', id: 'd', days: [1], halfDays: [], tjmOverride: 900 };
    expect(withoutCalendarLines([explicit])).toEqual([explicit]);
  });
});
