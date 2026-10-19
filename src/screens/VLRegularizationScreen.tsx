import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, ExternalLink, RotateCcw } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { calcCAFromEntries, monthHasRevenue } from '~/lib/fiscal';
import { VL_OFFICIAL_GUIDE_URL, calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { calcVLRegularization } from '~/lib/vlRegularization';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import { ScreenHead, Sheet } from '~/shell/AppShell';
import { NetBlock } from '~/components/viz/NetBlock';
import { Button } from '~/ui/Button';
import { Money, eur } from '~/ui/Money';
import { StatusNote } from '~/screens/settings/parts';
import { cn } from '~/utils';

export function VLRegularizationScreen() {
  const { profile, setProfile } = useProfile();
  const fy = useFiscalYearCtx();
  const months = fy.fiscalYear.months;
  const withRevenue = useMemo(() => months.filter(monthHasRevenue).map((m) => m.month), [months]);
  const selected = profile.vlRegularizationMonths ?? withRevenue;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const monthlyCa = useMemo(() => months.map((m) => calcCAFromEntries(m, profile)), [months, profile]);
  const estimate = useMemo(() => calcVLRegularization(months, profile, selected), [months, profile, selected]);
  const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, profile.year);

  const setMonths = (next: number[]) =>
    setProfile((p) => ({ ...p, vlRegularizationMonths: [...new Set(next)].sort((a, b) => a - b) }));
  const toggle = (m: number) => setMonths(selectedSet.has(m) ? selected.filter((x) => x !== m) : [...selected, m]);

  return (
    <>
      <ScreenHead>
        <Link to="/tresorerie" className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-ca-ink">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          Trésorerie
        </Link>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em] text-ink lg:text-[30px]">Rattrapage du versement libératoire</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-ink-2 text-pretty">
          Si le versement libératoire a été prélevé alors que votre foyer n’y avait pas droit, l’impôt sera recalculé au barème. Voici l’écart à
          prévoir.
        </p>
        <NetBlock
          className="mt-4 max-w-xl"
          family="impot"
          label={`À provisionner, ${estimate.selectedMonths.length} mois retenu${estimate.selectedMonths.length > 1 ? 's' : ''}`}
          value={Math.round(estimate.amountToProvision)}
        />
      </ScreenHead>

      <Sheet className="space-y-5">
        {elig.motif === 'rfr-too-high' ? (
          <StatusNote tone="alert" role="alert">
            Non éligible en {profile.year} : revenu fiscal de référence {elig.rfrYear} de {eur(profile.rfrN2 ?? 0)}, au-dessus du plafond de{' '}
            {eur(elig.threshold)} pour {profile.partsFiscales} part{profile.partsFiscales > 1 ? 's' : ''}.{' '}
            <a href={VL_OFFICIAL_GUIDE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline">
              Conditions officielles <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          </StatusNote>
        ) : (
          <StatusNote tone="neutral">
            Aucune inéligibilité détectée à partir de votre revenu fiscal de référence.{' '}
            <Link to="/reglages/$section" params={{ section: 'activite' }} hash="impot" className="font-medium text-ca-ink underline">
              Vérifier le montant
            </Link>
          </StatusNote>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <section aria-labelledby="mois-vl" className="card p-4 lg:p-5">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="mois-vl" className="text-[17px] font-bold text-ink">
                Mois prélevés à tort
              </h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />} onClick={() => setMonths(withRevenue)}>
                  Mois avec CA
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonths(selected.length === 12 ? [] : months.map((m) => m.month))}>
                  {selected.length === 12 ? 'Aucun' : 'Tous'}
                </Button>
              </div>
            </div>
            <p className="mb-3 text-[14px] text-ink-2">Les mois avec du chiffre d’affaires sont présélectionnés. Le choix est enregistré.</p>
            <fieldset className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
              <legend className="sr-only">Mois concernés</legend>
              {months.map((m) => {
                const on = selectedSet.has(m.month);
                const has = monthHasRevenue(m);
                return (
                  <button
                    key={m.month}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`${MONTH_NAMES[m.month]}, ${has ? eur(monthlyCa[m.month]) : 'aucun CA'}`}
                    onClick={() => toggle(m.month)}
                    className={cn(
                      'flex min-h-16 flex-col items-start justify-between rounded-[var(--radius-card)] border-2 px-2.5 py-2 text-left transition-colors',
                      on ? 'border-impot bg-impot text-impot-on' : 'border-line-3 text-ink hover:border-impot',
                    )}
                  >
                    <span className="text-[15px] font-bold">{MONTH_SHORT[m.month]}</span>
                    <span className={cn('text-[13px] tnum', on ? 'text-impot-on/80' : 'text-ink-3')}>{has ? eur(monthlyCa[m.month]) : 'aucun CA'}</span>
                  </button>
                );
              })}
            </fieldset>
          </section>

          <section aria-labelledby="calcul-vl" className="card p-4 lg:p-5">
            <h2 id="calcul-vl" className="mb-2 text-[17px] font-bold text-ink">
              Le calcul
            </h2>
            <dl className="divide-y divide-line text-[15px]">
              {[
                ['Chiffre d’affaires retenu', estimate.ca],
                ['Revenu imposable après abattement', estimate.taxableIncome],
                [`Impôt au barème (${profile.partsFiscales} part${profile.partsFiscales > 1 ? 's' : ''})`, estimate.estimatedIncomeTax],
                ['Versement libératoire déjà payé', -estimate.vlPaid],
              ].map(([label, v]) => (
                <div key={label as string} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="text-ink">{label}</dt>
                  <dd className="text-[17px] font-medium tnum">{eur(v as number)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t-2 border-line py-3">
                <dt className="font-semibold text-ink">Écart à provisionner</dt>
                <dd className="text-[22px] font-extrabold tnum text-impot-ink">{eur(Math.round(estimate.amountToProvision))}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[13px] leading-snug text-ink-2 text-pretty">
              Estimation sur le seul revenu de l’activité. Les autres revenus du foyer et le traitement définitif des versements déjà faits peuvent
              changer le montant réel.
            </p>
          </section>
        </div>

        {estimate.rows.length > 0 && (
          <section aria-labelledby="detail-vl" className="card p-4 lg:p-5">
            <h2 id="detail-vl" className="mb-2 text-[17px] font-bold text-ink">
              Détail par mois
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[15px]">
                <thead>
                  <tr className="border-b-2 border-line">
                    {['Mois', 'CA', 'VL payé', 'Impôt ventilé', 'Écart'].map((h, i) => (
                      <th key={h} scope="col" className={cn('label-col py-2 font-semibold text-ink-2', i === 0 ? 'text-left' : 'text-right')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estimate.rows.map((r) => (
                    <tr key={r.month} className="border-b border-line">
                      <th scope="row" className="py-2 text-left font-medium">{MONTH_NAMES[r.month]}</th>
                      <td className="py-2 text-right tnum">{eur(r.ca)}</td>
                      <td className="py-2 text-right tnum">{eur(r.vlPaid)}</td>
                      <td className="py-2 text-right tnum">{eur(r.estimatedIncomeTax)}</td>
                      <td className={cn('py-2 text-right font-bold tnum', r.difference > 0 ? 'text-impot-ink' : 'text-ink')}>{eur(r.difference, { sign: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[13px] text-ink-2">
              La ventilation suit la base imposable de chaque mois ; le barème reste calculé sur le total annuel retenu.
            </p>
          </section>
        )}
      </Sheet>
    </>
  );
}
