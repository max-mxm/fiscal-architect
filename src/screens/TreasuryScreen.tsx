import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Settings2 } from 'lucide-react';
import { ScreenHead, Sheet } from '~/shell/AppShell';
import { NetBlock } from '~/components/viz/NetBlock';
import { VLSimulationBanner } from '~/components/fiscal/VLSimulationBanner';
import { Elevation } from '~/components/viz/Elevation';
import { Money, eur } from '~/ui/Money';
import { Dot, FAMILY, Pill, type Family } from '~/ui/families';
import { Segmented } from '~/ui/Segmented';
import { deMois, nbsp } from '~/ui/text';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useTreasuryView, useYearView } from '~/view/useFiscalView';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import type { UrssafDeclarationSource } from '~/lib/urssafDeclarations';
import type { DeclarationVM, TreasuryVM } from '~/view/types';
import { cn } from '~/utils';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/** Montant mis en avant ; l'autre reste affiché à côté, la TVA seulement en mode TTC. */
type AmountMode = 'ht' | 'ttc';

/** Pastille violette posée sur l'aplat bleu : un montant TTC reste reconnaissable partout. */
function OnBlockTtc({ children }: { children: React.ReactNode }) {
  return <span className={cn('whitespace-nowrap rounded-full px-1.5 py-0.5 font-extrabold tnum', FAMILY.tva.fill)}>{children}</span>;
}

export function TreasuryScreen() {
  const vm = useTreasuryView();
  const year = useYearView().year;
  const [storedMode, setMode] = useLocalStorage<AmountMode>('fiscal-treasury-amounts', 'ttc');
  // Sans TVA, HT et TTC se confondent : pas de bascule, tout est HT.
  const mode: AmountMode = vm.taxed ? storedMode : 'ht';
  const ttc = mode === 'ttc';
  const next = vm.projections[vm.nextIndex];
  const total = Math.max(1, ttc ? vm.invoiced : vm.invoicedHt);
  const w = (v: number) => `${(Math.max(0, v) / total) * 100}%`;
  const toCollectInYear = Math.max(0, vm.toCollect - vm.deferred);
  const toCollectInYearHt = Math.max(0, vm.toCollectHt - vm.deferredHt);
  const pick = (ttcValue: number, htValue: number) => (ttc ? ttcValue : htValue);

  return (
    <>
      <ScreenHead>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em] text-ink lg:text-[30px]">Trésorerie {year}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {vm.taxed && (
              <Segmented<AmountMode>
                label="Montant mis en avant"
                shape="pill"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'ht', label: 'HT', selectedClassName: FAMILY.ca.fill },
                  { value: 'ttc', label: 'TTC', selectedClassName: FAMILY.tva.fill },
                ]}
              />
            )}
            <Link
              to="/reglages/$section"
              params={{ section: 'facturation' }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-[14px] font-semibold text-ink-2 shadow-[var(--shadow-card)] transition-colors hover:text-ink"
            >
              <Settings2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Délai : {vm.termsLabel}
            </Link>
          </div>
        </div>

        <VLSimulationBanner className="mt-4" />
        {vm.hasData ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-12 lg:gap-5">
            <NetBlock
              className="lg:col-span-5"
              family="ca"
              label="Reste à encaisser"
              value={pick(vm.toCollect, vm.toCollectHt)}
              badge={
                vm.taxed ? (
                  <span className={cn('rounded-full px-3 py-1 text-[14px] font-extrabold', ttc ? FAMILY.tva.fill : 'bg-white/35')}>{ttc ? 'TTC' : 'HT'}</span>
                ) : undefined
              }
              footer={
                vm.taxed || next ? (
                  <div className="space-y-1.5">
                    {vm.taxed && vm.toCollect > 0 && (
                      <p>
                        {ttc ? (
                          <>
                            Soit <span className="whitespace-nowrap font-extrabold tnum">{eur(vm.toCollectHt)} HT</span> +{' '}
                            <OnBlockTtc>{eur(vm.toCollect - vm.toCollectHt)} de TVA</OnBlockTtc>
                          </>
                        ) : (
                          <>
                            Soit <OnBlockTtc>{eur(vm.toCollect)} TTC</OnBlockTtc> sur votre compte
                          </>
                        )}
                      </p>
                    )}
                    {next && (
                      <p>
                        Prochain paiement :{' '}
                        {next.taxAmount > 0 ? (
                          ttc ? (
                            <>
                              <OnBlockTtc>{eur(next.amountTtc)} TTC</OnBlockTtc> <span className="whitespace-nowrap tnum">({eur(next.amount)} HT)</span>
                            </>
                          ) : (
                            <>
                              <span className="whitespace-nowrap font-extrabold tnum">{eur(next.amount)} HT</span>, soit <OnBlockTtc>{eur(next.amountTtc)} TTC</OnBlockTtc>,
                            </>
                          )
                        ) : (
                          <span className="font-extrabold tnum">{eur(next.amount)}</span>
                        )}{' '}
                        au plus tard le {nbsp(dateFmt.format(next.dueDate))}
                      </p>
                    )}
                  </div>
                ) : undefined
              }
            />
            <section aria-label="Facturé et encaissé" className="card p-4 lg:col-span-7 lg:p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-[16px] font-bold text-ink">Vos factures {year}</h2>
                <p className="text-[14px] font-semibold tnum">
                  {vm.taxed ? (
                    <HtTtcInline ht={vm.invoicedHt} ttc={vm.invoiced} mode={mode} />
                  ) : (
                    <span className={FAMILY.ca.ink}>{eur(vm.invoicedHt)} HT</span>
                  )}
                </p>
              </div>
              <div
                className="flex h-4 w-full gap-[3px]"
                role="img"
                aria-label={`Sur ${eur(pick(vm.invoiced, vm.invoicedHt))} ${ttc ? 'TTC' : 'HT'} facturés : ${eur(pick(vm.collectedToDate, vm.collectedHt))} encaissés, ${eur(pick(toCollectInYear, toCollectInYearHt))} à encaisser en ${year}, ${eur(pick(vm.deferred, vm.deferredHt))} après ${year}.`}
              >
                <span className="h-full rounded-l-full bg-ca transition-[width] duration-500" style={{ width: w(pick(vm.collectedToDate, vm.collectedHt)) }} />
                <span
                  className={cn('h-full bg-ca-light transition-[width] duration-500', vm.deferred <= 0 && 'rounded-r-full')}
                  style={{ width: w(pick(toCollectInYear, toCollectInYearHt)) }}
                />
                {vm.deferred > 0 && (
                  <span className="h-full rounded-r-full border-2 border-dashed border-ca transition-[width] duration-500" style={{ width: w(pick(vm.deferred, vm.deferredHt)) }} />
                )}
              </div>
              <dl className="mt-3 grid grid-cols-3 items-start gap-3">
                <Legend swatch="bg-ca" label="Encaissé" ht={vm.collectedHt} ttc={vm.collectedToDate} taxed={vm.taxed} mode={mode} />
                <Legend swatch="bg-ca-light" label="À venir" ht={toCollectInYearHt} ttc={toCollectInYear} taxed={vm.taxed} mode={mode} />
                <Legend swatch="border-2 border-dashed border-ca" label={`En ${year + 1}`} ht={vm.deferredHt} ttc={vm.deferred} taxed={vm.taxed} mode={mode} />
              </dl>
              {ttc && vm.tvaTotal > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-[var(--radius-ctl)] bg-tva-soft px-3 py-2 text-[14px] text-tva-ink">
                  <Dot family="tva" />
                  <span>
                    Dont <strong className="font-extrabold tnum">{eur(vm.tvaTotal)} de TVA</strong>, à reverser : elle n’est pas à vous.
                  </span>
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="card mt-4 max-w-lg p-5">
            <p className="text-[17px] font-bold text-ink">Aucune facture à projeter pour l’instant.</p>
            <p className="mt-1 text-[15px] text-ink-2">Cochez des jours ou saisissez du chiffre d’affaires : les échéances de paiement apparaîtront ici.</p>
            <Link to="/" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-ctl)] bg-primary px-4 text-[15px] font-bold text-on-primary">
              Ouvrir le mois <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>
        )}
      </ScreenHead>

      <Sheet className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Provisions vm={vm} year={year} />
          <Declarations vm={vm} year={year} />
        </div>
        {vm.hasData && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <CashflowChart vm={vm} year={year} mode={mode} />
            <Schedule vm={vm} mode={mode} />
          </div>
        )}
        <p className="max-w-3xl text-[13px] leading-snug text-ink-3 text-pretty">
          Les dates sont des échéances contractuelles maximales, pas des garanties de paiement. Les montants d’impôt et de cotisations sont des
          estimations : vérifiez-les sur votre espace URSSAF et impots.gouv.fr.
        </p>
      </Sheet>
    </>
  );
}

/** « 12 600 € TTC · 10 500 € HT » : le montant mis en avant d'abord, chacun dans sa couleur. */
function HtTtcInline({ ht, ttc, mode }: { ht: number; ttc: number; mode: AmountMode }) {
  const htPart = <span className="text-ink-2">{nbsp(`${eur(ht)} HT`)}</span>;
  const ttcPart = <span className={FAMILY.tva.ink}>{nbsp(`${eur(ttc)} TTC`)}</span>;
  return mode === 'ttc' ? (
    <>
      {ttcPart} <span className="text-ink-3">·</span> {htPart}
    </>
  ) : (
    <>
      <span className="text-ink">{nbsp(`${eur(ht)} HT`)}</span> <span className="text-ink-3">·</span> {ttcPart}
    </>
  );
}

function Legend({ swatch, label, ht, ttc, taxed, mode }: { swatch: string; label: string; ht: number; ttc: number; taxed: boolean; mode: AmountMode }) {
  const ttcFirst = taxed && mode === 'ttc';
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="flex items-center gap-1.5 text-[13px] font-medium leading-tight text-ink-2">
        <span aria-hidden="true" className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', swatch)} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className={cn('text-[17px] font-bold tnum', ttcFirst ? FAMILY.tva.ink : 'text-ink')}>{eur(ttcFirst ? ttc : ht)}</dd>
      {taxed && (
        <dd className={cn('text-[12px] font-medium leading-tight tnum', ttcFirst ? 'text-ink-2' : FAMILY.tva.ink)}>
          {nbsp(ttcFirst ? `${eur(ht)} HT` : `${eur(ttc)} TTC`)}
        </dd>
      )}
    </div>
  );
}

function Provisions({ vm, year }: { vm: TreasuryVM; year: number }) {
  const p = vm.provisions;
  const totalToDate = p.cotisations.toDate + p.impot.toDate + p.tva.toDate + (p.regularisationVL ?? 0);
  const totalYear = p.cotisations.year + p.impot.year + p.tva.year + (p.regularisationVL ?? 0);
  const rows: Array<{ family: Family; label: string; note: string; toDate: number; year: number; to?: '/regularisation-vl' }> = [
    { family: 'cot', label: 'Cotisations et contributions', note: 'URSSAF, CFP, taxes, après ACRE', toDate: p.cotisations.toDate, year: p.cotisations.year },
    {
      family: 'impot',
      label: p.impot.mode === 'vl' ? 'Impôt (versement libératoire)' : 'Impôt sur le revenu',
      note: p.impot.mode === 'vl' ? 'Prélevé avec les cotisations' : 'Barème avec vos parts, payé l’année suivante',
      toDate: p.impot.toDate,
      year: p.impot.year,
    },
  ];
  if (p.tva.year > 0) rows.push({ family: 'tva', label: 'TVA à reverser', note: 'Collectée sur vos factures', toDate: p.tva.toDate, year: p.tva.year });
  if (p.regularisationVL != null && p.regularisationVL > 0) {
    rows.push({ family: 'impot', label: 'Rattrapage de versement libératoire', note: 'Écart barème − VL payé', toDate: p.regularisationVL, year: p.regularisationVL, to: '/regularisation-vl' });
  }

  return (
    <section aria-labelledby="provisions" className="card p-4 lg:p-5">
      <h2 id="provisions" className="text-[17px] font-bold text-ink">
        Sommes à prévoir
      </h2>
      <p className="mb-2 text-[14px] text-ink-2">Ce qui sortira de votre compte et ne vous appartient pas.</p>
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b-2 border-line">
            <th scope="col" className="label-col py-2 text-left">Poste</th>
            <th scope="col" className="label-col py-2 text-right">À date</th>
            <th scope="col" className="label-col py-2 pl-3 text-right">Fin {year}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-line">
              <th scope="row" className="py-2.5 pr-2 text-left font-normal">
                <span className="flex items-start gap-2.5">
                  <Dot family={r.family} className="mt-1.5" />
                  <span>
                    {r.to ? (
                      <Link to={r.to} className="font-semibold text-ink underline decoration-ink/30 hover:decoration-ink">
                        {r.label}
                      </Link>
                    ) : (
                      <span className={cn('font-semibold', r.family === 'tva' ? FAMILY.tva.ink : 'text-ink')}>{r.label}</span>
                    )}
                    <span className="block text-[13px] text-ink-3">{r.note}</span>
                  </span>
                </span>
              </th>
              <td className={cn('py-2.5 text-right font-bold tnum', r.family === 'tva' ? FAMILY.tva.ink : 'text-ink')}>{eur(r.toDate)}</td>
              <td className={cn('py-2.5 pl-3 text-right tnum', r.family === 'tva' ? FAMILY.tva.ink : 'text-ink-2')}>{eur(r.year)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="py-3 text-left font-bold">Total</th>
            <td className="py-3 text-right text-[17px] font-extrabold tnum">{eur(totalToDate)}</td>
            <td className="py-3 pl-3 text-right font-bold tnum text-ink-2">{eur(totalYear)}</td>
          </tr>
        </tfoot>
      </table>
      {p.vlCheck && (
        <p className="mt-2 text-[13px] leading-snug text-ink-2">
          Votre revenu fiscal de référence rend le versement libératoire indisponible. S’il a été prélevé cette année,{' '}
          <Link to="/regularisation-vl" className="font-semibold text-ca-ink underline">
            estimez le rattrapage
          </Link>
          .
        </p>
      )}
    </section>
  );
}

/** « Facture de janvier », « Facture d’août », « Facture de décembre 2025 » pour une facture de N-1. */
function invoiceLabel(src: UrssafDeclarationSource, year: number): string {
  return `Facture ${deMois(MONTH_NAMES[src.serviceMonth])}${src.serviceYear !== year ? ` ${src.serviceYear}` : ''}`;
}

/** Les paiements qui composent le CA d'une période, chacun avec sa facture d'origine. */
function DeclarationSources({ sources, year }: { sources: UrssafDeclarationSource[]; year: number }) {
  const now = Date.now();
  return (
    <ul aria-label="Paiements reçus sur la période" className="ml-[60px] mt-1.5 divide-y divide-line border-t border-line">
      {sources.map((src) => (
        <li key={src.invoiceDate.toISOString()} className="flex items-start justify-between gap-3 py-1.5 leading-tight">
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-ink">{invoiceLabel(src, year)}</span>
            <span className="block text-[12px] text-ink-3">
              {src.receivedDate.getTime() <= now ? 'encaissée' : 'attendue'} le {nbsp(shortFmt.format(src.receivedDate))}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[13px] font-bold text-ink tnum">{nbsp(`${eur(src.amount)} HT`)}</span>
            {src.amountTtc > src.amount && (
              <span className={cn('block text-[12px] font-medium tnum', FAMILY.tva.ink)}>{nbsp(`${eur(src.amountTtc)} TTC`)}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const monFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

function DeclarationRow({ d, year }: { d: DeclarationVM; year: number }) {
  const current = d.status === 'current';
  return (
    <li className={cn('rounded-[var(--radius-ctl)] px-2 py-2', current && 'bg-cot-soft')}>
      <div className="flex items-center gap-3">
        <span className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] leading-none', current ? FAMILY.cot.fill : FAMILY.cot.soft)}>
          <span className="text-[17px] font-extrabold tnum">{dayFmt.format(d.due)}</span>
          <span className="mt-0.5 text-[11px] font-bold">{monFmt.format(d.due)}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
            {d.label}
            {current && (
              <Pill family="cot" variant="solid" className="h-5 px-2 text-[11px]">
                à faire
              </Pill>
            )}
          </p>
          <p className="text-[13px] text-ink-2 tnum">CA encaissé {nbsp(`${eur(d.caEncaisse)} HT`)}</p>
        </div>
        <div className="text-right">
          <Money value={d.cotisations} className={cn('block text-[17px] font-bold', FAMILY.cot.ink)} />
          <span className="text-[12px] text-ink-3">à payer</span>
        </div>
      </div>
      {d.sources.length > 0 && <DeclarationSources sources={d.sources} year={year} />}
    </li>
  );
}

function Declarations({ vm, year }: { vm: TreasuryVM; year: number }) {
  const visible = vm.declarations.filter((d) => d.status !== 'past').slice(0, 4);
  const past = vm.declarations.filter((d) => d.status === 'past');
  return (
    <section aria-labelledby="declarations" className="card p-4 lg:p-5">
      <h2 id="declarations" className="text-[17px] font-bold text-ink">
        À déclarer à l’URSSAF
      </h2>
      <p className="mb-2 text-[14px] text-ink-2">
        Le CA à déclarer est le montant HT encaissé sur la période. Sous chaque période, les factures dont viennent les paiements.
      </p>
      {visible.length === 0 ? (
        <p className="py-3 text-[14px] text-ink-2">Aucune déclaration à venir cette année.</p>
      ) : (
        <ol className="space-y-1">
          {visible.map((d) => (
            <DeclarationRow key={d.key} d={d} year={year} />
          ))}
        </ol>
      )}
      {past.length > 0 && (
        <details className="group mt-2 border-t border-line pt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="tnum">
              {past.length} période{past.length > 1 ? 's' : ''} échue{past.length > 1 ? 's' : ''} ·{' '}
              <span className={FAMILY.cot.ink}>{eur(past.reduce((s, d) => s + d.cotisations, 0))}</span> de cotisations estimées
            </span>
            <span aria-hidden="true" className="shrink-0 text-[13px] text-ca-ink group-open:hidden">Afficher</span>
            <span aria-hidden="true" className="hidden shrink-0 text-[13px] text-ca-ink group-open:inline">Masquer</span>
          </summary>
          <ol className="space-y-1">
            {past.map((d) => (
              <DeclarationRow key={d.key} d={d} year={year} />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function CashflowChart({ vm, year, mode }: { vm: TreasuryVM; year: number; mode: AmountMode }) {
  const ttc = mode === 'ttc';
  const pts = vm.timeline;
  const invoiced = [0, ...pts.map((m) => (ttc ? m.cumulativeInvoicedTtc : m.cumulativeInvoiced))];
  const received = [0, ...pts.map((m) => (ttc ? m.cumulativeReceivedTtc : m.cumulativeReceived))];
  const ticks = ['', ...pts.map((m) => (m.year !== year ? `${MONTH_SHORT[m.month].charAt(0)}’${String(m.year).slice(2)}` : MONTH_SHORT[m.month].charAt(0)))];
  return (
    <section aria-labelledby="facture-encaisse" className="card p-4 lg:p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="facture-encaisse" className="text-[17px] font-bold text-ink">
          Facturé et encaissé
          {vm.taxed && <span className={cn('ml-1.5', ttc ? FAMILY.tva.ink : 'text-ink-2')}>{ttc ? 'TTC' : 'HT'}</span>}
        </h2>
        <p className="flex items-center gap-3 text-[13px] font-semibold text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-[3px] w-5 rounded-full bg-ca-light" /> Facturé
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-[3px] w-5 rounded-full bg-ca" /> Encaissé
          </span>
        </p>
      </div>
      <Elevation
        ticks={ticks}
        series={[
          { key: 'inv', label: 'Facturé', values: invoiced, line: 'solid', family: 'ca' },
          { key: 'rec', label: 'Encaissé', values: received, line: 'solid', step: true, weight: 'strong', family: 'ca', area: true },
        ]}
        height={240}
        ariaLabel={`Facturé ${eur(ttc ? vm.invoiced : vm.invoicedHt)}, encaissé à date ${eur(ttc ? vm.collectedToDate : vm.collectedHt)}${vm.taxed ? (ttc ? ', TTC' : ', HT') : ''}.`}
      />
    </section>
  );
}

/** Montant d'une échéance : le mode choisi en grand, l'autre dessous (et la TVA en mode TTC). */
function PaymentAmount({ p, taxed, mode, past }: { p: TreasuryVM['projections'][number]; taxed: boolean; mode: AmountMode; past: boolean }) {
  if (p.taxAmount <= 0) {
    return (
      <span className="shrink-0 text-right leading-tight">
        <Money value={p.amount} className={cn('block text-[16px] font-bold', past ? 'text-ink-3' : 'text-ink')} />
        {taxed && <span className="block text-[12px] text-ink-3">sans TVA</span>}
      </span>
    );
  }
  return (
    <span className="shrink-0 text-right leading-tight">
      {mode === 'ttc' ? (
        <>
          <span className={cn('block text-[16px] font-bold tnum', past ? 'text-ink-3' : FAMILY.tva.ink)}>{nbsp(`${eur(p.amountTtc)} TTC`)}</span>
          <span className="block text-[12px] text-ink-2 tnum">
            {nbsp(`${eur(p.amount)} HT`)} + <span className={FAMILY.tva.ink}>{nbsp(`${eur(p.taxAmount)} TVA`)}</span>
          </span>
        </>
      ) : (
        <>
          <span className={cn('block text-[16px] font-bold tnum', past ? 'text-ink-3' : 'text-ink')}>{nbsp(`${eur(p.amount)} HT`)}</span>
          <span className={cn('block text-[12px] font-medium tnum', FAMILY.tva.ink)}>{nbsp(`${eur(p.amountTtc)} TTC`)}</span>
        </>
      )}
    </span>
  );
}

function Schedule({ vm, mode }: { vm: TreasuryVM; mode: AmountMode }) {
  const past = vm.nextIndex < 0 ? vm.projections : vm.projections.slice(0, vm.nextIndex);
  const upcoming = vm.nextIndex < 0 ? [] : vm.projections.slice(vm.nextIndex);
  const pastHt = past.reduce((s, p) => s + p.amount, 0);
  const pastTtc = past.reduce((s, p) => s + p.amountTtc, 0);
  const Row = ({ p, state }: { p: (typeof vm.projections)[number]; state: 'past' | 'next' | 'later' }) => (
    <li className={cn('flex items-center justify-between gap-3 rounded-[var(--radius-ctl)] px-2 py-2.5', state === 'next' && 'bg-ca-soft')}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2">
          <span className={cn('text-[15px] font-bold tnum', state === 'next' ? FAMILY.ca.ink : state === 'past' ? 'text-ink-3' : 'text-ink')}>
            {nbsp(shortFmt.format(p.dueDate))}
          </span>
          <span className="text-[12px] text-ink-3">{state === 'next' ? 'prochain' : state === 'past' ? 'échu' : 'au plus tard'}</span>
        </p>
        <p className="text-[13px] text-ink-2">Facture du {nbsp(shortFmt.format(p.invoiceDate))}</p>
      </div>
      <PaymentAmount p={p} taxed={vm.taxed} mode={mode} past={state === 'past'} />
    </li>
  );
  return (
    <section aria-labelledby="echeancier" className="card p-4 lg:p-5">
      <h2 id="echeancier" className="text-[17px] font-bold text-ink">
        Échéancier des paiements
      </h2>
      <p className="mb-2 text-[14px] text-ink-2">
        Une facture récapitulative le dernier jour de chaque mois travaillé
        {vm.taxed ? (
          <>
            , montant <span className={cn('font-bold', mode === 'ttc' ? FAMILY.tva.ink : 'text-ink')}>{mode === 'ttc' ? 'TTC' : 'HT'}</span> en premier
          </>
        ) : (
          ''
        )}
        .
      </p>
      {upcoming.length > 0 ? (
        <ol className="space-y-0.5">
          {upcoming.map((p, i) => (
            <Row key={p.invoiceDate.toISOString()} p={p} state={i === 0 ? 'next' : 'later'} />
          ))}
        </ol>
      ) : (
        <p className="py-3 text-[14px] text-ink-2">Aucun paiement à venir sur cette année.</p>
      )}
      {past.length > 0 && (
        <details className="group mt-2 border-t border-line pt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-semibold text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="tnum">
              Paiements échus ({past.length}) ·{' '}
              {vm.taxed && pastTtc > pastHt ? <HtTtcInline ht={pastHt} ttc={pastTtc} mode={mode} /> : eur(pastHt)}
            </span>
            <span aria-hidden="true" className="shrink-0 text-[13px] text-ca-ink group-open:hidden">Afficher</span>
            <span aria-hidden="true" className="hidden shrink-0 text-[13px] text-ca-ink group-open:inline">Masquer</span>
          </summary>
          <ol className="space-y-0.5">
            {past.map((p) => (
              <Row key={p.invoiceDate.toISOString()} p={p} state="past" />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
