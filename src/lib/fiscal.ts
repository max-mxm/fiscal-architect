import type { Activity, ActivityEntry, UserProfile, FiscalResult, MonthlyBreakdown, MonthlyChartData, CalendarMonth, RevenueEntry, TVAStatus } from '~/types';

// --- Paramètres fiscaux par activité (2026) ---

export interface ActivityParams {
  label: string;
  hint: string;
  urssafRate: number;          // %
  abattement: number;          // 0..1, abattement IR au barème
  plafond: number;             // €, plafond annuel CA pour rester en micro
  tauxVL: number;              // 0..1, taux versement libératoire
  /** Taux CFP (Contribution Formation Pro), 0..1. Source : urssaf.fr. */
  cfpRate: number;
  /** Taux taxe consulaire (CCI/CMA), 0..1. Libéraux : exonérés. */
  taxeConsulaireRate: number;
}

export const ACTIVITY_PARAMS: Record<Activity, ActivityParams> = {
  vente:        { label: 'Vente / hébergement (BIC)',      hint: 'Marchandises, e-commerce, gîte',     urssafRate: 12.3, abattement: 0.71, plafond: 203_100, tauxVL: 0.010, cfpRate: 0.001, taxeConsulaireRate: 0.00015 },
  serviceBic:   { label: 'Services commerciaux / artisan', hint: 'Artisan, prestation BIC',            urssafRate: 21.2, abattement: 0.50, plafond:  83_600, tauxVL: 0.017, cfpRate: 0.003, taxeConsulaireRate: 0.00044 },
  liberalSsi:   { label: 'Libéral non réglementé (SSI)',   hint: 'BNC SSI : conseil, dev, design',     urssafRate: 26.1, abattement: 0.34, plafond:  83_600, tauxVL: 0.022, cfpRate: 0.002, taxeConsulaireRate: 0 },
  liberalCipav: { label: 'Libéral réglementé (CIPAV)',     hint: 'Architecte, ostéo, psy, etc.',       urssafRate: 23.2, abattement: 0.34, plafond:  83_600, tauxVL: 0.022, cfpRate: 0.002, taxeConsulaireRate: 0 },
};

// --- TVA — franchise en base (seuils 2026, inchangés depuis 2023) ---

export const TVA_FRANCHISE_2026 = {
  /** Vente de marchandises et hébergement. */
  vente:    { basique: 91_900, majore: 101_000 },
  /** Prestations de services et BNC (s'applique à serviceBic, liberalSsi, liberalCipav). */
  services: { basique: 36_800, majore:  39_100 },
} as const;

// --- ACRE — réduction d'URSSAF pendant 12 mois post-création ---

/** Date de bascule du taux ACRE : 50 % avant cette date, 25 % à partir. */
export const ACRE_TRANSITION_DATE = new Date('2024-05-01');
export const ACRE_RATE_BEFORE = 0.50;
export const ACRE_RATE_AFTER = 0.25;
export const ACRE_DURATION_MONTHS = 12;

// Alias rétro-compat (avant introduction de l'activité, l'app était figée sur BNC libéral SSI).
// Conservés pour ne pas casser les imports tiers et les tests historiques.
export const SEUIL_MICRO = ACTIVITY_PARAMS.liberalSsi.plafond;
export const ABATTEMENT_BNC = ACTIVITY_PARAMS.liberalSsi.abattement;
export const TAUX_VL_BNC = ACTIVITY_PARAMS.liberalSsi.tauxVL;

/**
 * Combine les paramètres par défaut de l'activité avec les overrides du profil
 * (slider URSSAF, seuil custom). Le profil a toujours la priorité.
 */
export function getFiscalParams(profile: UserProfile): ActivityParams {
  const base = ACTIVITY_PARAMS[profile.activity] ?? ACTIVITY_PARAMS.liberalSsi;
  return {
    ...base,
    urssafRate: profile.urssafRate ?? base.urssafRate,
    plafond: profile.seuilMicro ?? base.plafond,
  };
}

export const TRANCHES_IR = [
  { min: 0, max: 11_600, taux: 0 },
  { min: 11_601, max: 29_579, taux: 0.11 },
  { min: 29_580, max: 84_577, taux: 0.30 },
  { min: 84_578, max: 181_917, taux: 0.41 },
  { min: 181_918, max: Infinity, taux: 0.45 },
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// --- Fonctions de base ---

export function calcCAMensuel(tjm: number, jours: number): number {
  return tjm * jours;
}

export function calcCAannuel(tjm: number, joursMensuels: number, mois: number = 12): number {
  return tjm * joursMensuels * mois;
}

// --- Modèles de revenu pluggables (jours / forfait / flat) ---

/**
 * Retourne les `entries` effectives d'un mois. Si le mois est legacy (pas d'`entries`),
 * dérive virtuellement une ligne `days` depuis `workedDays`/`halfDays` — sans muter
 * le localStorage. Tant que l'utilisateur ne saisit rien dans le nouveau modèle, on
 * reste 100 % rétro-compatible.
 */
export function resolveEntries(month: CalendarMonth): RevenueEntry[] {
  if (month.entries && month.entries.length > 0) return month.entries;
  return [
    {
      kind: 'days',
      id: `legacy-${month.year}-${month.month}`,
      days: month.workedDays,
      halfDays: month.halfDays,
    },
  ];
}

export function entryAmount(entry: RevenueEntry, profile: UserProfile): number {
  switch (entry.kind) {
    case 'days': {
      const equiv = entry.days.length + (entry.halfDays?.length ?? 0) * 0.5;
      return equiv * (entry.tjmOverride ?? profile.tjm);
    }
    case 'forfait':
      return entry.amount;
    case 'flat':
      return entry.amount;
  }
}

/**
 * CA mensuel d'un mois, calculé selon ses entries (mode pluggable).
 * Mode `days` : `(jours pleins + demi × 0.5) × TJM`
 * Mode `forfait` : somme des montants
 * Mode `flat` : somme des montants
 * Mode `mixed` : somme de toutes les entries (toutes catégories confondues)
 */
export function calcCAFromEntries(month: CalendarMonth, profile: UserProfile): number {
  return resolveEntries(month).reduce((sum, e) => sum + entryAmount(e, profile), 0);
}

/** CA annuel = somme des `calcCAFromEntries` sur les 12 mois. */
export function calcCAYearFromEntries(months: CalendarMonth[], profile: UserProfile): number {
  return months.reduce((sum, m) => sum + calcCAFromEntries(m, profile), 0);
}

/**
 * CA réalisé à date : agrège les revenus jusqu'au jour `todayDate` du mois courant.
 *
 * Détail par type d'entry dans le mois courant :
 * - `days` : seuls les jours ≤ todayDate sont comptés
 * - `forfait` : seuls les forfaits dont la date (jour) est ≤ todayDate
 * - `flat` : prorata `todayDate / daysInMonth` (le mois agrégé est étalé linéairement)
 *
 * Les mois passés sont comptés intégralement, les mois futurs ignorés.
 */
export function calcCaRealiseFromEntries(
  months: CalendarMonth[],
  profile: UserProfile,
  currentMonthIndex: number,
  todayDate: number,
): { caRealise: number; joursRealises: number } {
  let total = 0;
  let jours = 0;
  for (const m of months) {
    if (m.month > currentMonthIndex) continue;
    const isCurrent = m.month === currentMonthIndex;
    for (const e of resolveEntries(m)) {
      switch (e.kind) {
        case 'days': {
          const tjm = e.tjmOverride ?? profile.tjm;
          if (!isCurrent) {
            const equiv = e.days.length + (e.halfDays?.length ?? 0) * 0.5;
            jours += equiv;
            total += equiv * tjm;
          } else {
            const fullCount = e.days.filter((d) => d <= todayDate).length;
            const halfCount = (e.halfDays ?? []).filter((d) => d <= todayDate).length;
            const equiv = fullCount + halfCount * 0.5;
            jours += equiv;
            total += equiv * tjm;
          }
          break;
        }
        case 'forfait': {
          if (!isCurrent) {
            total += e.amount;
          } else {
            const day = parseInt(e.date.slice(8, 10), 10);
            if (!isNaN(day) && day <= todayDate) total += e.amount;
          }
          break;
        }
        case 'flat': {
          if (!isCurrent) {
            total += e.amount;
          } else {
            const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
            total += e.amount * (todayDate / daysInMonth);
          }
          break;
        }
      }
    }
  }
  return { caRealise: total, joursRealises: jours };
}

/**
 * Date projetée de franchissement d'un seuil (micro, TVA basique...) en cumulant les
 * entries mois par mois. Pour `days`, précise au jour. Pour `forfait`, précise à la
 * date du forfait. Pour `flat`, on retourne le 15 du mois où le seuil est franchi.
 * Retourne null si le seuil n'est pas atteint sur l'année.
 */
export function calcSeuilDateFromEntries(
  months: CalendarMonth[],
  profile: UserProfile,
  seuil: number,
): Date | null {
  let cumul = 0;
  for (const m of months) {
    type Event = { day: number; amount: number };
    const events: Event[] = [];
    let flatTotal = 0;

    for (const e of resolveEntries(m)) {
      if (e.kind === 'days') {
        const tjm = e.tjmOverride ?? profile.tjm;
        const halfSet = new Set(e.halfDays ?? []);
        const allDays = [...new Set([...e.days, ...(e.halfDays ?? [])])].sort((a, b) => a - b);
        for (const day of allDays) {
          events.push({ day, amount: tjm * (halfSet.has(day) ? 0.5 : 1) });
        }
      } else if (e.kind === 'forfait') {
        const day = parseInt(e.date.slice(8, 10), 10);
        if (!isNaN(day)) events.push({ day, amount: e.amount });
      } else {
        flatTotal += e.amount;
      }
    }

    events.sort((a, b) => a.day - b.day);
    for (const ev of events) {
      cumul += ev.amount;
      if (cumul >= seuil) return new Date(m.year, m.month, ev.day);
    }
    if (flatTotal > 0) {
      cumul += flatTotal;
      if (cumul >= seuil) return new Date(m.year, m.month, 15);
    }
  }
  return null;
}

/** Indique si un mois contient au moins une entry productrice de revenu. */
export function monthHasRevenue(month: CalendarMonth): boolean {
  return resolveEntries(month).some((e) => {
    if (e.kind === 'days') return e.days.length > 0 || (e.halfDays?.length ?? 0) > 0;
    return e.amount > 0;
  });
}

// --- Multi-activité ---

/** Liste effective des activités du profil (fallback : dérivée de profile.activity). */
export function getActivities(profile: UserProfile): ActivityEntry[] {
  if (profile.activities && profile.activities.length > 0) return profile.activities;
  return [{ id: 'fallback-primary', type: profile.activity, isPrimary: true }];
}

/** L'activité primaire du profil — défaut pour les revenue entries sans activityId. */
export function getPrimaryActivity(profile: UserProfile): ActivityEntry {
  const acts = getActivities(profile);
  return acts.find((a) => a.isPrimary) ?? acts[0];
}

/** Type d'activité applicable à une revenue entry (via activityId ou activité primaire). */
export function resolveActivityType(entry: RevenueEntry, profile: UserProfile): Activity {
  if (entry.activityId) {
    const acts = getActivities(profile);
    const found = acts.find((a) => a.id === entry.activityId);
    if (found) return found.type;
  }
  return getPrimaryActivity(profile).type;
}

/** Ventile le CA annuel par type d'activité. Activités absentes du profil → 0. */
export function calcCAByActivity(
  months: CalendarMonth[],
  profile: UserProfile,
): Record<Activity, number> {
  const result: Record<Activity, number> = { vente: 0, serviceBic: 0, liberalSsi: 0, liberalCipav: 0 };
  for (const m of months) {
    for (const e of resolveEntries(m)) {
      const type = resolveActivityType(e, profile);
      result[type] += entryAmount(e, profile);
    }
  }
  return result;
}

/**
 * Indique si une activité relève du seuil TVA « vente » ou « services ».
 * `vente` est seul dans la catégorie vente ; les 3 autres sont services/BNC.
 */
export function activityCategory(activity: Activity): 'vente' | 'services' {
  return activity === 'vente' ? 'vente' : 'services';
}

export interface MixedTVASeuils {
  /** Seuil franchise TVA pour les ventes, si l'activité est présente. */
  vente?: { basique: number; majore: number };
  /** Seuil franchise TVA pour les services/BNC, si présent. */
  services?: { basique: number; majore: number };
}

/** Seuils TVA applicables selon les catégories d'activités présentes dans le profil. */
export function getMixedTVASeuils(profile: UserProfile): MixedTVASeuils {
  const cats = new Set(getActivities(profile).map((a) => activityCategory(a.type)));
  const out: MixedTVASeuils = {};
  if (cats.has('vente')) out.vente = TVA_FRANCHISE_2026.vente;
  if (cats.has('services')) out.services = TVA_FRANCHISE_2026.services;
  return out;
}

/**
 * Calcul fiscal multi-activité — boucle par type d'activité, applique le bon
 * URSSAF/CFP/taxe consulaire à chaque branche, et somme. L'IR au barème
 * progressif est calculé sur le revenu imposable global (somme des CA × (1 −
 * abattement_par_activité)). En VL, l'IR est CA × tauxVL_par_activité.
 *
 * `acreReduction` (annualisée) est ventilée au prorata du CA par activité,
 * borné par l'URSSAF brut de chaque branche.
 */
export function calcNetMicroMulti(
  profile: UserProfile,
  caByActivity: Record<Activity, number>,
  chargesFixes: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): FiscalResult {
  const cfpEnabled = profile.cfpEnabled ?? true;
  const taxeConsulaireEnabled = profile.taxeConsulaireEnabled ?? false;
  const acreTotal = Math.max(0, opts.acreReduction ?? 0);

  let chargesURSSAFBrutTotal = 0;
  for (const a of Object.keys(caByActivity) as Activity[]) {
    const ca = caByActivity[a];
    if (ca <= 0) continue;
    const params = ACTIVITY_PARAMS[a];
    chargesURSSAFBrutTotal += ca * (params.urssafRate / 100);
  }

  let chargesURSSAF = 0;
  let cfpAnnuel = 0;
  let taxeConsulaireAnnuelle = 0;
  let revenuImposableTotal = 0;
  let irVL = 0;
  let acreReductionApplied = 0;

  for (const a of Object.keys(caByActivity) as Activity[]) {
    const ca = caByActivity[a];
    if (ca <= 0) continue;
    const params = ACTIVITY_PARAMS[a];
    const urssafBrutBranche = ca * (params.urssafRate / 100);
    // Ventilation ACRE au prorata
    const acreBranche = chargesURSSAFBrutTotal > 0
      ? Math.min(urssafBrutBranche, acreTotal * (urssafBrutBranche / chargesURSSAFBrutTotal))
      : 0;
    chargesURSSAF += urssafBrutBranche - acreBranche;
    acreReductionApplied += acreBranche;

    if (cfpEnabled) cfpAnnuel += ca * params.cfpRate;
    if (taxeConsulaireEnabled) taxeConsulaireAnnuelle += ca * params.taxeConsulaireRate;

    if (versementLiberatoire) {
      irVL += ca * params.tauxVL;
    } else {
      revenuImposableTotal += ca * (1 - params.abattement);
    }
  }

  const totalChargesObligatoires = chargesURSSAF + cfpAnnuel + taxeConsulaireAnnuelle;
  const caTotal = Object.values(caByActivity).reduce((s, v) => s + v, 0);

  const tvaStatus: TVAStatus = opts.tvaStatus ?? 'safe';
  const tvaSeuilDate = opts.tvaSeuilDate ?? null;

  if (versementLiberatoire) {
    const netApresIR = caTotal - totalChargesObligatoires - chargesFixes - irVL;
    return {
      caAnnuel: caTotal,
      chargesURSSAF,
      chargesFixes,
      revenuImposable: caTotal,
      ir: irVL,
      netApresIR,
      cfpAnnuel,
      taxeConsulaireAnnuelle,
      acreReductionAnnuelle: acreReductionApplied,
      tvaStatus,
      tvaSeuilDate,
    };
  }

  const ir = calcIR(revenuImposableTotal);
  const netApresIR = caTotal - totalChargesObligatoires - chargesFixes - ir;
  return {
    caAnnuel: caTotal,
    chargesURSSAF,
    chargesFixes,
    revenuImposable: revenuImposableTotal,
    ir,
    netApresIR,
    cfpAnnuel,
    taxeConsulaireAnnuelle,
    acreReductionAnnuelle: acreReductionApplied,
    tvaStatus,
    tvaSeuilDate,
  };
}

/**
 * Net cumulé multi-activité — équivalent de `calcNetCumule` mais ventilé.
 * Les charges fixes sont pondérées par les mois avec activité.
 */
export function calcNetCumuleMulti(
  profile: UserProfile,
  caByActivity: Record<Activity, number>,
  chargesFixesMensuelles: number,
  monthsWithActivity: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): number {
  const caTotal = Object.values(caByActivity).reduce((s, v) => s + v, 0);
  if (caTotal <= 0) return 0;
  const chargesFixesTotal = chargesFixesMensuelles * Math.max(0, monthsWithActivity);
  const result = calcNetMicroMulti(profile, caByActivity, chargesFixesTotal, versementLiberatoire, opts);
  return Math.round(result.netApresIR);
}

export function calcChargesURSSAF(ca: number, taux: number): number {
  return ca * (taux / 100);
}

export function calcTotalChargesFixes(costs: UserProfile['fixedCosts']): number {
  return costs.reduce((acc, c) => acc + c.amount, 0);
}

// --- Impôt sur le revenu (barème progressif) ---

export function calcIR(revenuImposable: number, parts: number = 1): number {
  const revenuParPart = revenuImposable / parts;
  let impotParPart = 0;

  for (const tranche of TRANCHES_IR) {
    if (revenuParPart <= tranche.min) break;
    const base = Math.min(revenuParPart, tranche.max) - tranche.min;
    impotParPart += Math.max(0, base) * tranche.taux;
  }

  return Math.round(impotParPart * parts);
}

// --- CFP, taxe consulaire, ACRE, TVA ---

/**
 * Contribution Formation Professionnelle, prélevée mensuellement avec l'URSSAF.
 * Taux selon activité (commerçants 0,1 %, prestataires BIC 0,3 %, libéraux 0,2 %).
 */
export function calcCFP(ca: number, activity: Activity): number {
  if (ca <= 0) return 0;
  return ca * ACTIVITY_PARAMS[activity].cfpRate;
}

/**
 * Taxe pour frais de chambre consulaire (CCI/CMA). Libéraux exonérés.
 */
export function calcTaxeConsulaire(ca: number, activity: Activity): number {
  if (ca <= 0) return 0;
  return ca * ACTIVITY_PARAMS[activity].taxeConsulaireRate;
}

export interface ACREResult {
  reduction: number;     // montant absolu déduit de l'URSSAF brut
  applicable: boolean;
  rate: number;          // 0, 0.25 ou 0.50
}

/**
 * Réduction ACRE : 50 % d'URSSAF si création avant 01/05/2024, 25 % sinon,
 * pendant 12 mois à compter de la date de création.
 */
export function calcACRE(
  urssafBrut: number,
  creationDate: Date | null | undefined,
  periodDate: Date,
  enabled: boolean = true,
): ACREResult {
  if (!enabled || !creationDate) return { reduction: 0, applicable: false, rate: 0 };

  // Fin de la fenêtre 12 mois post-création
  const expiry = new Date(creationDate);
  expiry.setMonth(expiry.getMonth() + ACRE_DURATION_MONTHS);

  if (periodDate < creationDate || periodDate >= expiry) {
    return { reduction: 0, applicable: false, rate: 0 };
  }

  const rate = creationDate < ACRE_TRANSITION_DATE ? ACRE_RATE_BEFORE : ACRE_RATE_AFTER;
  return { reduction: urssafBrut * rate, applicable: true, rate };
}

/** Renvoie les seuils de franchise en base TVA pour une activité. */
export function getTVASeuils(activity: Activity): { basique: number; majore: number } {
  return activity === 'vente' ? TVA_FRANCHISE_2026.vente : TVA_FRANCHISE_2026.services;
}

/**
 * Statut TVA selon CA cumulé : `safe` (sous le seuil basique),
 * `warning` (entre basique et majoré, dépassement toléré 1 an),
 * `breach` (au-dessus du seuil majoré, bascule TVA obligatoire).
 */
export function calcTVAStatus(caCumule: number, activity: Activity): TVAStatus {
  const { basique, majore } = getTVASeuils(activity);
  if (caCumule >= majore) return 'breach';
  if (caCumule >= basique) return 'warning';
  return 'safe';
}

/**
 * Date projetée de bascule TVA (franchise → assujetti) en cumulant les jours travaillés.
 * Renvoie la date à laquelle le seuil basique est dépassé, ou null si non dépassé.
 */
export function calcTVASeuilDate(
  months: { month: number; year: number; workedDays: number[]; halfDays?: number[] }[],
  tjm: number,
  activity: Activity,
): Date | null {
  const { basique } = getTVASeuils(activity);
  return calcSeuilDate(months, tjm, basique);
}

// --- Net par statut ---

export interface FiscalCalcOptions {
  abattement?: number;             // défaut : ABATTEMENT_BNC (libéral SSI)
  tauxVL?: number;                 // défaut : TAUX_VL_BNC (libéral SSI)
  cfpRate?: number;                // défaut : 0
  taxeConsulaireRate?: number;     // défaut : 0
  /** Réduction ACRE absolue à déduire de l'URSSAF. Défaut : 0. */
  acreReduction?: number;
  tvaStatus?: TVAStatus;           // défaut : 'safe'
  tvaSeuilDate?: Date | null;      // défaut : null
}

export function calcNetMicro(
  ca: number,
  tauxURSSAF: number,
  chargesFixes: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): FiscalResult {
  const abattement = opts.abattement ?? ABATTEMENT_BNC;
  const tauxVL = opts.tauxVL ?? TAUX_VL_BNC;
  const cfpRate = opts.cfpRate ?? 0;
  const taxeConsulaireRate = opts.taxeConsulaireRate ?? 0;
  const acreReduction = Math.max(0, Math.min(opts.acreReduction ?? 0, ca * (tauxURSSAF / 100)));
  const tvaStatus: TVAStatus = opts.tvaStatus ?? 'safe';
  const tvaSeuilDate = opts.tvaSeuilDate ?? null;

  const chargesURSSAFBrutes = calcChargesURSSAF(ca, tauxURSSAF);
  const chargesURSSAF = chargesURSSAFBrutes - acreReduction;
  const cfpAnnuel = ca * cfpRate;
  const taxeConsulaireAnnuelle = ca * taxeConsulaireRate;
  const totalChargesObligatoires = chargesURSSAF + cfpAnnuel + taxeConsulaireAnnuelle;

  if (versementLiberatoire) {
    const ir = ca * tauxVL;
    const netApresIR = ca - totalChargesObligatoires - chargesFixes - ir;
    return {
      caAnnuel: ca,
      chargesURSSAF,
      chargesFixes,
      revenuImposable: ca, // base = CA brut pour le VL
      ir,
      netApresIR,
      cfpAnnuel,
      taxeConsulaireAnnuelle,
      acreReductionAnnuelle: acreReduction,
      tvaStatus,
      tvaSeuilDate,
    };
  }

  const revenuImposable = ca * (1 - abattement);
  const ir = calcIR(revenuImposable);
  const netApresIR = ca - totalChargesObligatoires - chargesFixes - ir;

  return {
    caAnnuel: ca,
    chargesURSSAF,
    chargesFixes,
    revenuImposable,
    ir,
    netApresIR,
    cfpAnnuel,
    taxeConsulaireAnnuelle,
    acreReductionAnnuelle: acreReduction,
    tvaStatus,
    tvaSeuilDate,
  };
}

// --- Ventilation mensuelle ---

export function calcMonthlyBreakdown(
  caMensuel: number,
  tauxURSSAF: number,
  chargesFixesMensuelles: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): MonthlyBreakdown {
  const cfpRate = opts.cfpRate ?? 0;
  const taxeConsulaireRate = opts.taxeConsulaireRate ?? 0;

  const urssafBrut = calcChargesURSSAF(caMensuel, tauxURSSAF);
  const acreReduction = Math.max(0, Math.min(opts.acreReduction ?? 0, urssafBrut));
  const urssaf = urssafBrut - acreReduction;
  const cfp = caMensuel * cfpRate;
  const taxeConsulaire = caMensuel * taxeConsulaireRate;

  // Projection annualisée (×12) pour estimer l'IR au barème progressif.
  // L'ACRE est passée en valeur annualisée pour rester cohérente sur l'année.
  const caAnnuelProjection = caMensuel * 12;
  const optsAnnuel: FiscalCalcOptions = {
    ...opts,
    acreReduction: acreReduction * 12,
  };
  const annualResult = calcNetMicro(caAnnuelProjection, tauxURSSAF, chargesFixesMensuelles * 12, versementLiberatoire, optsAnnuel);
  const ir = annualResult.ir / 12;

  const net = caMensuel - urssaf - cfp - taxeConsulaire - chargesFixesMensuelles - ir;
  const tauxNet = caMensuel > 0 ? net / caMensuel : 0;
  return {
    ca: caMensuel,
    urssaf,
    ir,
    chargesFixes: chargesFixesMensuelles,
    net,
    tauxNet,
    cfp,
    taxeConsulaire,
    acreReduction,
  };
}

export function calcReserveVacances(netMensuel: number, joursParMois: number): number {
  if (joursParMois <= 0) return 0;
  return Math.round((netMensuel / joursParMois) * 25 / 12);
}

/** Nombre de jours équivalents (plein + demi × 0.5) pour un mois. */
export function calcEquivDays(m: { workedDays: number[]; halfDays?: number[] }): number {
  return m.workedDays.length + (m.halfDays?.length ?? 0) * 0.5;
}

/**
 * Net cumulé estimé : applique URSSAF + IR (barème ou VL) au CA cumulé,
 * puis déduit `monthsWithActivity × chargesFixesMensuelles`.
 *
 * Le compte « mois avec activité » sert à pondérer les charges fixes
 * (un freelance qui n'a coché que 3 mois ne paye pas 12 mois de charges).
 */
export function calcNetCumule(
  caCumule: number,
  tauxURSSAF: number,
  chargesFixesMensuelles: number,
  monthsWithActivity: number,
  versementLiberatoire: boolean = false,
  opts: FiscalCalcOptions = {},
): number {
  if (caCumule <= 0) return 0;
  const chargesFixesTotal = chargesFixesMensuelles * Math.max(0, monthsWithActivity);
  const result = calcNetMicro(caCumule, tauxURSSAF, chargesFixesTotal, versementLiberatoire, opts);
  return Math.round(result.netApresIR);
}

/** Nombre de mois ayant au moins un jour plein ou demi saisi. */
export function countMonthsWithActivity(months: CalendarMonth[]): number {
  return months.reduce(
    (acc, m) => acc + (m.workedDays.length > 0 || (m.halfDays?.length ?? 0) > 0 ? 1 : 0),
    0,
  );
}

export function calcCaRealise(
  months: CalendarMonth[],
  tjm: number,
  currentMonthIndex: number,
  todayDate: number,
): { caRealise: number; joursRealises: number } {
  let jours = 0;
  for (const m of months) {
    const halfDays = m.halfDays ?? [];
    if (m.month < currentMonthIndex) {
      jours += m.workedDays.length + halfDays.length * 0.5;
    } else if (m.month === currentMonthIndex) {
      jours += m.workedDays.filter((d) => d <= todayDate).length;
      jours += halfDays.filter((d) => d <= todayDate).length * 0.5;
    }
  }
  return { caRealise: jours * tjm, joursRealises: jours };
}

// --- Utilitaires ---

/**
 * Calcule la date de franchissement du seuil en cumulant les jours travaillés mois par mois.
 * Retourne la date exacte du jour où le cumul dépasse le seuil, ou null si pas de dépassement.
 */
export function calcSeuilDate(
  months: { month: number; year: number; workedDays: number[]; halfDays?: number[] }[],
  tjm: number,
  seuil: number = SEUIL_MICRO,
): Date | null {
  if (tjm <= 0) return null;

  let cumul = 0;
  for (const m of months) {
    const halfSet = new Set(m.halfDays ?? []);
    const allDays = [...new Set([...m.workedDays, ...(m.halfDays ?? [])])].sort((a, b) => a - b);
    for (const day of allDays) {
      const fraction = halfSet.has(day) ? 0.5 : 1;
      cumul += tjm * fraction;
      if (cumul >= seuil) {
        return new Date(m.year, m.month, day);
      }
    }
  }
  return null;
}

export function generateChartData(profile: UserProfile): MonthlyChartData[] {
  const chargesFixesMensuelles = calcTotalChargesFixes(profile.fixedCosts);
  const params = getFiscalParams(profile);
  const brut = calcCAMensuel(profile.tjm, profile.workingDays);
  const breakdown = calcMonthlyBreakdown(
    brut,
    params.urssafRate,
    chargesFixesMensuelles,
    profile.versementLiberatoire,
    { abattement: params.abattement, tauxVL: params.tauxVL },
  );

  return MONTHS.map((month) => ({
    month, brut: Math.round(brut), net: Math.round(breakdown.net),
  }));
}
