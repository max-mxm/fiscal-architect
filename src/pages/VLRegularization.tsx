import React, { useMemo } from 'react';
import { AlertTriangle, ArrowLeft, Check, Info, Landmark, RotateCcw } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { calcCAFromEntries, monthHasRevenue } from '~/lib/fiscal';
import { VL_OFFICIAL_GUIDE_URL, calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { calcVLRegularization } from '~/lib/vlRegularization';
import { formatEuro } from '~/lib/format';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import { cn } from '~/utils';

export const VLRegularization: React.FC = () => {
  const { profile, setProfile } = useProfile();
  const fy = useFiscalYearCtx();
  const monthsWithRevenue = useMemo(
    () => fy.fiscalYear.months.filter(monthHasRevenue).map((month) => month.month),
    [fy.fiscalYear.months],
  );
  const selectedMonths = profile.vlRegularizationMonths ?? monthsWithRevenue;
  const monthlyCa = useMemo(
    () => fy.fiscalYear.months.map((month) => calcCAFromEntries(month, profile)),
    [fy.fiscalYear.months, profile],
  );
  const selectedSet = useMemo(() => new Set(selectedMonths), [selectedMonths]);
  const estimate = useMemo(
    () => calcVLRegularization(fy.fiscalYear.months, profile, selectedMonths),
    [fy.fiscalYear.months, profile, selectedMonths],
  );
  const eligibility = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, profile.year);

  const updateMonths = (next: number[]) => {
    setProfile((current) => ({
      ...current,
      vlRegularizationMonths: [...new Set(next)].sort((a, b) => a - b),
    }));
  };

  const toggleMonth = (month: number) => {
    updateMonths(selectedSet.has(month)
      ? selectedMonths.filter((candidate) => candidate !== month)
      : [...selectedMonths, month]);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-bold text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>

      <header className="hero-panel overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-container/85">
              Estimation {profile.year}
            </span>
            <h1 className="mt-2 max-w-2xl font-headline text-2xl font-black tracking-tight text-balance sm:text-3xl">
              Rattrapage du versement libératoire
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary-container/85">
              Sélectionnez les mois pendant lesquels le versement libératoire a été payé alors que vous n’étiez pas éligible.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 lg:min-w-64">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary-container/85">À provisionner</span>
            <strong className="mt-1 block font-mono text-3xl font-black tabular-nums text-white">
              ≈ {formatEuro(Math.round(estimate.amountToProvision))} €
            </strong>
            <span className="mt-1 block text-xs text-secondary-container/80">
              {estimate.selectedMonths.length} mois sélectionné{estimate.selectedMonths.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {eligibility.motif === 'rfr-too-high' ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <p className="font-bold">Inéligibilité détectée depuis votre revenu fiscal de référence {eligibility.rfrYear}</p>
            <p className="mt-1 text-xs leading-relaxed">
              Pour l’année fiscale {profile.year}, le revenu fiscal de référence (RFR) à utiliser est celui de {eligibility.rfrYear}, indiqué sur l’avis d’impôt reçu en {eligibility.taxNoticeYear}. Montant renseigné : <strong>{formatEuro(profile.rfrN2 ?? 0)} €</strong> · plafond pour {profile.partsFiscales} part{profile.partsFiscales > 1 ? 's' : ''} : <strong>{formatEuro(eligibility.threshold)} €</strong>.
            </p>
            <a href={VL_OFFICIAL_GUIDE_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-[36px] items-center font-bold underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-red-400/40">Voir les conditions officielles sur impots.gouv.fr<span className="sr-only"> (nouvel onglet)</span></a>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 text-on-surface-variant">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-bold text-on-surface">Aucune inéligibilité liée au revenu fiscal de référence détectée</p>
            <p className="mt-1 text-xs">Pour {profile.year}, vérifiez le revenu fiscal de référence (RFR) {eligibility.rfrYear} sur l’avis d’impôt reçu en {eligibility.taxNoticeYear}. <Link to="/" search={{ settings: 'fiscal' }} className="font-bold text-secondary underline underline-offset-2">Modifier le montant</Link>.</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-12">
        <section aria-labelledby="months-title" className="rounded-3xl bg-surface-lowest p-5 shadow-sm lg:col-span-7 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Étape 1</span>
              <h2 id="months-title" className="mt-1 font-headline text-lg font-bold">Mois concernés</h2>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">Les mois avec du chiffre d’affaires sont présélectionnés. La sélection est enregistrée automatiquement.</p>
            </div>
            <button
              type="button"
              onClick={() => updateMonths(monthsWithRevenue)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-secondary hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Mois avec CA
            </button>
          </div>

          <fieldset className="mt-5 grid grid-cols-3 gap-2 border-0 p-0 sm:grid-cols-4 md:grid-cols-6">
            <legend className="sr-only">Sélection des mois à régulariser</legend>
            {fy.fiscalYear.months.map((month) => {
              const selected = selectedSet.has(month.month);
              const hasRevenue = monthHasRevenue(month);
              return (
                <button
                  key={month.month}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleMonth(month.month)}
                  className={cn(
                    'relative min-h-[58px] rounded-2xl border px-2 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
                    selected
                      ? 'border-secondary bg-secondary/10 text-secondary ring-1 ring-secondary/30'
                      : 'border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-highest/30',
                  )}
                >
                  {selected && <Check className="absolute right-2 top-2 h-3.5 w-3.5" aria-hidden="true" />}
                  <span className="block text-xs font-bold">{MONTH_SHORT[month.month]}</span>
                  <span className="mt-0.5 block text-[10px] font-mono tabular-nums opacity-75">
                    {hasRevenue ? `${formatEuro(Math.round(monthlyCa[month.month]))} €` : 'Aucun CA'}
                  </span>
                </button>
              );
            })}
          </fieldset>
          <button
            type="button"
            onClick={() => updateMonths(selectedMonths.length === 12 ? [] : fy.fiscalYear.months.map((month) => month.month))}
            className="mt-3 min-h-[44px] rounded-xl px-3 text-xs font-bold text-secondary hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
          >
            {selectedMonths.length === 12 ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </section>

        <aside aria-labelledby="summary-title" className="rounded-3xl bg-surface-lowest p-5 shadow-sm lg:col-span-5 sm:p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">Étape 2</span>
          <h2 id="summary-title" className="mt-1 font-headline text-lg font-bold">Estimation</h2>
          <dl className="mt-5 space-y-3">
            <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant/20 pb-3 text-sm"><dt className="text-on-surface-variant">CA concerné</dt><dd className="font-mono font-bold tabular-nums">{formatEuro(Math.round(estimate.ca))} €</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant/20 pb-3 text-sm"><dt className="text-on-surface-variant">Base après abattement</dt><dd className="font-mono font-bold tabular-nums">{formatEuro(Math.round(estimate.taxableIncome))} €</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant/20 pb-3 text-sm"><dt className="text-on-surface-variant">IR estimé au barème</dt><dd className="font-mono font-bold tabular-nums">{formatEuro(Math.round(estimate.estimatedIncomeTax))} €</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant/20 pb-3 text-sm"><dt className="text-on-surface-variant">VL déjà payé</dt><dd className="font-mono font-bold tabular-nums">− {formatEuro(Math.round(estimate.vlPaid))} €</dd></div>
          </dl>
          <div className="mt-5 rounded-2xl bg-surface-low p-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Écart estimé</span>
            <strong className="mt-1 block font-mono text-2xl font-black tabular-nums text-on-surface">≈ {formatEuro(Math.round(estimate.amountToProvision))} €</strong>
          </div>
          <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-on-surface-variant">
            <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            Estimation indicative sur les revenus de l’activité seule. Les autres revenus du foyer et le traitement définitif des versements déjà effectués peuvent modifier le montant réel.
          </p>
        </aside>
      </div>

      {estimate.rows.length > 0 && (
        <section aria-labelledby="detail-title" className="overflow-hidden rounded-3xl bg-surface-lowest shadow-sm">
          <div className="border-b border-outline-variant/20 px-5 py-4 sm:px-6"><h2 id="detail-title" className="font-headline text-base font-bold">Détail mensuel explicatif</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="bg-surface-low text-[10px] uppercase tracking-wider text-on-surface-variant"><tr><th className="px-5 py-3 text-left">Mois</th><th className="px-5 py-3 text-right">CA</th><th className="px-5 py-3 text-right">VL payé</th><th className="px-5 py-3 text-right">IR ventilé</th><th className="px-5 py-3 text-right">Écart</th></tr></thead>
              <tbody>
                {estimate.rows.map((row) => (
                  <tr key={row.month} className="border-t border-outline-variant/15">
                    <th scope="row" className="px-5 py-3 text-left font-bold">{MONTH_NAMES[row.month]}</th>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">{formatEuro(Math.round(row.ca))} €</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">{formatEuro(Math.round(row.vlPaid))} €</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">{formatEuro(Math.round(row.estimatedIncomeTax))} €</td>
                    <td className={cn('px-5 py-3 text-right font-mono font-bold tabular-nums', row.difference > 0 ? 'text-red-700 dark:text-red-300' : 'text-secondary')}>{row.difference > 0 ? '+' : ''}{formatEuro(Math.round(row.difference))} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-outline-variant/20 px-5 py-4 text-[11px] leading-relaxed text-on-surface-variant sm:px-6">La ventilation mensuelle est proportionnelle à la base imposable. Le barème progressif reste calculé sur le total annuel sélectionné.</p>
        </section>
      )}
    </div>
  );
};
