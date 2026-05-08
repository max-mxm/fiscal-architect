import { buildDefaultYearConfig, getLegalParamsForYear } from '~/constants';
import { createEmptyFiscalYear } from '~/lib/calendar';
import type { FiscalYear, YearConfig } from '~/types';

const yearConfigKey = (year: number) => `fiscal-year-config-${year}`;
const yearCalendarKey = (year: number) => `fiscal-calendar-${year}`;

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponible — silencieux
  }
}

function configEqualsDefault(config: YearConfig, year: number): boolean {
  const defaults = buildDefaultYearConfig(year);
  return JSON.stringify(config) === JSON.stringify(defaults);
}

function calendarHasNoEntries(calendar: FiscalYear): boolean {
  return calendar.months.every(
    (m) =>
      m.workedDays.length === 0
      && (m.halfDays?.length ?? 0) === 0
      && (m.entries?.length ?? 0) === 0,
  );
}

/**
 * Une année est considérée « vide » si elle n'a jamais été personnalisée :
 * pas de config en localStorage, ou config strictement égale aux valeurs par
 * défaut, et calendrier sans aucune entrée. Sert à déterminer si on doit
 * proposer la popup de transition (héritage / from scratch) ou switcher direct.
 */
export function isYearEmpty(year: number): boolean {
  const config = readJSON<YearConfig>(yearConfigKey(year));
  if (!config) return true;
  if (!configEqualsDefault(config, year)) return false;
  const calendar = readJSON<FiscalYear>(yearCalendarKey(year));
  if (!calendar) return true;
  return calendarHasNoEntries(calendar);
}

/**
 * Crée une nouvelle année avec les valeurs par défaut (TJM 650, charges
 * standards, ACRE désactivée, etc.) + calendrier vide. Idempotent : écrase
 * toute entrée existante pour cette année. Appelé depuis `YearTransitionModal`
 * quand l'utilisateur choisit « Repartir de zéro ».
 */
export function createYearFresh(year: number): { config: YearConfig; calendar: FiscalYear } {
  const config = buildDefaultYearConfig(year);
  const calendar = createEmptyFiscalYear(year);
  writeJSON(yearConfigKey(year), config);
  writeJSON(yearCalendarKey(year), calendar);
  return { config, calendar };
}

/**
 * Crée une nouvelle année en clonant la config d'une année source (préférences
 * perso conservées : TJM, charges fixes, activités, options déclaratives). Les
 * paramètres légaux (URSSAF, seuil) sont patchés pour l'année cible. Le RFR N-2
 * et missionStart sont réinitialisés. Le calendrier est créé vide.
 */
export function createYearInherited(
  year: number,
  sourceYear: number,
): { config: YearConfig; calendar: FiscalYear } {
  const donor = readJSON<YearConfig>(yearConfigKey(sourceYear));
  if (!donor) {
    return createYearFresh(year);
  }
  const legal = getLegalParamsForYear(year);
  const config: YearConfig = {
    ...donor,
    schemaVersion: 1,
    year,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    missionStart: `${year}-01-01`,
    rfrN2: null,
    activities: donor.activities.map((a) => ({ ...a })),
    fixedCosts: donor.fixedCosts.map((c) => ({ ...c })),
  };
  const calendar = createEmptyFiscalYear(year);
  writeJSON(yearConfigKey(year), config);
  writeJSON(yearCalendarKey(year), calendar);
  return { config, calendar };
}

/**
 * Aperçu non-persistant des données qui seront héritées d'une année source.
 * Utilisé pour afficher la preview dans `YearTransitionModal` sans avoir à
 * toucher localStorage avant la confirmation utilisateur.
 */
export function previewInheritedConfig(year: number, sourceYear: number): YearConfig | null {
  const donor = readJSON<YearConfig>(yearConfigKey(sourceYear));
  if (!donor) return null;
  const legal = getLegalParamsForYear(year);
  return {
    ...donor,
    schemaVersion: 1,
    year,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    missionStart: `${year}-01-01`,
    rfrN2: null,
    activities: donor.activities.map((a) => ({ ...a })),
    fixedCosts: donor.fixedCosts.map((c) => ({ ...c })),
  };
}
