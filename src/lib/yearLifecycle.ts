import { buildDefaultYearConfig } from '~/constants';
import { createEmptyFiscalYear } from '~/lib/calendar';
import { getActivityLegalParams } from '~/lib/fiscal';
import { IDENTITY_KEYS, type CalendarMonth, type FiscalYear, type UserProfile, type YearConfig } from '~/types';

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

/**
 * Migrations de schéma pour `YearConfig`. Chaque entrée `[N]` reçoit la valeur
 * en version `N` et la transforme en version `N + 1`.
 */
export const YEAR_CONFIG_MIGRATIONS: Record<number, (old: any) => any> = {
  // v1 → v2 : introduction de `tjmByMonth` (sparse, undefined par défaut).
  1: (old: any) => ({ ...old, schemaVersion: 2 }),
  // v2 → v3 : délai de paiement. Zéro préserve strictement les projections existantes.
  2: (old: any) => ({
    ...old,
    schemaVersion: 3,
    paymentDelayDays: 0,
    paymentDelayMode: 'net',
    endOfMonthCalculation: 'delayThenMonthEnd',
  }),
  // v3 → v4 : le taux est configuré séparément ; 20 % préserve le cas standard.
  3: (old: any) => ({ ...old, schemaVersion: 4, tvaRate: 0.2 }),
  // v4 → v5 : les profils déjà assujettis conservent une TVA sur toute l'année.
  4: (old: any) => ({
    ...old,
    schemaVersion: 5,
    tvaEffectiveDate: old.tvaAssujetti ? `${old.year}-01-01` : null,
  }),
};

/**
 * Config persistée d'une année, migrée au schéma courant, sans rien écrire.
 * null si l'année n'a jamais été configurée ou si une migration manque.
 */
export function readStoredYearConfig(year: number): YearConfig | null {
  let config = readJSON<any>(yearConfigKey(year));
  const target = buildDefaultYearConfig(year).schemaVersion;
  while (config && typeof config.schemaVersion === 'number' && config.schemaVersion < target) {
    const migrate = YEAR_CONFIG_MIGRATIONS[config.schemaVersion];
    if (!migrate) return null;
    config = migrate(config);
  }
  return config;
}

/**
 * Profil d'une autre année : l'identité (commune à toutes les années) vient du
 * profil courant, tout le reste de la config de cette année, sans rien hériter
 * de la config courante (TJM du mois, TVA, délais…).
 */
export function profileForYear(current: UserProfile, config: YearConfig): UserProfile {
  const { schemaVersion: _, ...rest } = config;
  const identity = Object.fromEntries(IDENTITY_KEYS.map((k) => [k, current[k]]));
  return { ...identity, ...rest } as UserProfile;
}

/**
 * Paramètres légaux de l'année cible pour l'activité primaire du donneur (le
 * taux SSI de `LEGAL_PARAMS_BY_YEAR` n'est juste que pour le libéral SSI).
 */
function legalParamsFor(donor: YearConfig, year: number): { urssafRate: number; seuilMicro: number } {
  const primary = donor.activities?.find((a) => a.isPrimary) ?? donor.activities?.[0];
  const legal = getActivityLegalParams(primary?.type ?? 'liberalSsi', year);
  return { urssafRate: legal.urssafRate, seuilMicro: legal.seuilMicro };
}

/**
 * Lit le calendrier persisté d'une année (clé `fiscal-calendar-${year}`), avec
 * repli sur un calendrier vide. Les mois absents ou incomplets sont normalisés.
 * Sert aux exports qui n'ont pas accès au contexte du calendrier.
 */
export function readStoredFiscalYear(year: number): FiscalYear {
  const empty = createEmptyFiscalYear(year);
  const stored = readJSON<Partial<FiscalYear>>(yearCalendarKey(year));
  if (!stored || !Array.isArray(stored.months)) return empty;
  const months: CalendarMonth[] = empty.months.map((fallback) => {
    const m = stored.months?.find((candidate) => candidate?.month === fallback.month);
    if (!m) return fallback;
    return {
      month: fallback.month,
      year,
      workedDays: Array.isArray(m.workedDays) ? m.workedDays : [],
      halfDays: Array.isArray(m.halfDays) ? m.halfDays : [],
      entries: Array.isArray(m.entries) ? m.entries : [],
    };
  });
  return { schemaVersion: 1, year, months };
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
 * paramètres légaux (URSSAF, seuil) sont patchés pour l'année cible. Le revenu
 * fiscal de référence et missionStart sont réinitialisés. Le calendrier est créé vide.
 */
export function createYearInherited(
  year: number,
  sourceYear: number,
): { config: YearConfig; calendar: FiscalYear } {
  const donor = readJSON<YearConfig>(yearConfigKey(sourceYear));
  if (!donor) {
    return createYearFresh(year);
  }
  const legal = legalParamsFor(donor, year);
  const config: YearConfig = {
    ...donor,
    schemaVersion: 5,
    year,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    // Cohérence « j'ai augmenté en décembre, je continue à ce tarif » :
    // le TJM par défaut de la nouvelle année prend la valeur de décembre N-1
    // (si une surcharge mensuelle existait), sinon on garde le défaut du donor.
    tjm: donor.tjmByMonth?.[11] ?? donor.tjm,
    tjmByMonth: donor.tjmByMonth ? { ...donor.tjmByMonth } : undefined,
    tvaEffectiveDate: donor.tvaAssujetti ? `${year}-01-01` : null,
    missionStart: `${year}-01-01`,
    rfrN2: null,
    vlRegularizationMonths: undefined,
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
  const legal = legalParamsFor(donor, year);
  return {
    ...donor,
    schemaVersion: 5,
    year,
    urssafRate: legal.urssafRate,
    seuilMicro: legal.seuilMicro,
    tjm: donor.tjmByMonth?.[11] ?? donor.tjm,
    tjmByMonth: donor.tjmByMonth ? { ...donor.tjmByMonth } : undefined,
    tvaEffectiveDate: donor.tvaAssujetti ? `${year}-01-01` : null,
    missionStart: `${year}-01-01`,
    rfrN2: null,
    vlRegularizationMonths: undefined,
    activities: donor.activities.map((a) => ({ ...a })),
    fixedCosts: donor.fixedCosts.map((c) => ({ ...c })),
  };
}
