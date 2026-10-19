import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { ACTIVITY_PARAMS, getFiscalParams, getPrimaryActivity } from '~/lib/fiscal';
import { calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { MONTH_SHORT } from '~/lib/calendar';
import { ScreenHead, Sheet } from '~/shell/AppShell';
import { NetBlock } from '~/components/viz/NetBlock';
import { SplitBar } from '~/components/viz/SplitBar';
import { Elevation, type ElevationDatum } from '~/components/viz/Elevation';
import { TjmMonthlyEditor } from '~/components/fiscal/TjmMonthlyEditor';
import { VLSimulationBanner } from '~/components/fiscal/VLSimulationBanner';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import { Button, IconButton } from '~/ui/Button';
import { NumberInput } from '~/ui/Field';
import { Switch } from '~/ui/Switch';
import { Money, eur, pct } from '~/ui/Money';
import { FAMILY, Pill, type Family } from '~/ui/families';
import { useYearView } from '~/view/useFiscalView';
import type { YearVM } from '~/view/types';
import { cn } from '~/utils';

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Position fractionnaire d'une date sur l'axe des mois (0 = 1er janvier, 12 = fin décembre). */
function datePosition(d: Date, year: number): number {
  if (d.getFullYear() < year) return 0;
  if (d.getFullYear() > year) return 12;
  const days = new Date(year, d.getMonth() + 1, 0).getDate();
  return d.getMonth() + (d.getDate() - 0.5) / days;
}

export function YearScreen() {
  const { profile, setProfile } = useProfile();
  const fy = useFiscalYearCtx();
  const vm = useYearView();
  const navigate = useNavigate();
  const [tjmOpen, setTjmOpen] = useState(false);
  const showCalendar = profile.revenueModel === 'days' || profile.revenueModel === 'mixed';

  const sum = (k: 'cotisations' | 'charges') => vm.months.filter((m) => !m.projected).reduce((s, m) => s + m[k], 0);
  const cotisations = sum('cotisations');
  const charges = sum('charges');
  // L'impôt annuel est provisionné au rythme moyen : on le déduit pour que la barre s'additionne au net cumulé.
  const impot = Math.max(0, vm.caSaisi - cotisations - charges - vm.netCumule);
  const isCurrentYear = vm.year === new Date().getFullYear();
  const todayPos = isCurrentYear ? datePosition(new Date(), vm.year) : null;
  const currentMonth = isCurrentYear ? new Date().getMonth() : -1;

  const microFamily: Family = vm.seuil.status === 'crossed' ? 'alert' : vm.seuil.status === 'projected' || vm.seuil.status === 'near' ? 'warn' : 'charges';
  const datums: ElevationDatum[] = [
    {
      key: 'micro',
      label: 'Plafond micro',
      value: vm.seuilMicro,
      family: microFamily,
      crossing: vm.seuil.date ? { position: datePosition(vm.seuil.date, vm.year), label: dayMonth.format(vm.seuil.date) } : null,
    },
  ];
  if (!vm.tva.assujetti) {
    datums.push({
      key: 'tva',
      label: 'Franchise TVA',
      value: vm.tva.seuil,
      family: 'tva',
      crossing: vm.tva.date ? { position: datePosition(vm.tva.date, vm.year), label: dayMonth.format(vm.tva.date) } : null,
    });
  }

  const realise = [0, ...vm.cumul.map((c) => c.realise)];
  const projete = [0, ...vm.cumul.map((c) => c.projete)];
  const lastReal = realise.reduce<number>((acc, v, i) => (v != null ? i : acc), 0);
  const projectedLine = projete.map((v, i) => (i >= lastReal ? v : null));

  return (
    <>
      <ScreenHead>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em] text-ink lg:text-[30px]">Année {vm.year}</h1>
          <div className="flex flex-wrap gap-2">
            <Pill family="ca">{eur(vm.caRealise)} réalisés</Pill>
            <Pill family="ca" className="bg-card text-ca-ink shadow-[inset_0_0_0_1.5px_var(--color-ca-light)]">
              {eur(vm.caProjete)} projetés
            </Pill>
          </div>
        </div>
        <VLSimulationBanner className="mt-4" />
        <div className="mt-4 grid gap-3 lg:grid-cols-12 lg:gap-5">
          <NetBlock
            className="lg:col-span-5"
            label="Net cumulé sur les mois saisis"
            value={vm.netCumule}
            share={vm.caSaisi > 0 ? Math.round((vm.netCumule / vm.caSaisi) * 1000) / 10 : null}
            footer={vm.netProjete > vm.netCumule ? `Environ ${eur(vm.netProjete)} en fin d’année au rythme actuel` : undefined}
            invoice={
              vm.tva.assujetti && vm.tva.invoice.tva > 0
                ? { label: 'Facturé aux clients', amount: vm.tva.invoice.ttc, ttc: true }
                : { label: 'Facturé aux clients', amount: vm.caSaisi, ttc: false }
            }
          />
          <section aria-label="Répartition du CA de l'année" className="card p-4 lg:col-span-7 lg:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-bold text-ink">Où va votre CA</h2>
              <p className="text-[14px] font-semibold tnum">
                <span className={FAMILY.ca.ink}>{eur(vm.caSaisi)} HT</span>
                {vm.tva.assujetti && vm.tva.invoice.tva > 0 && <span className={cn('ml-2', FAMILY.tva.ink)}>{eur(vm.tva.invoice.ttc)} TTC</span>}
              </p>
            </div>
            <SplitBar
              hideNetInLegend
              segments={[
                { family: 'net', label: 'Net', value: Math.max(0, vm.netCumule) },
                { family: 'cot', label: 'Cotisations', value: cotisations },
                { family: 'impot', label: 'Impôt', value: impot },
                { family: 'charges', label: 'Charges', value: charges },
              ]}
              tva={vm.tva.assujetti ? vm.tva.invoice.tva : 0}
              emptyLabel="Aucun chiffre d’affaires saisi cette année."
            />
          </section>
        </div>
      </ScreenHead>

      <Sheet className="space-y-5">
        <section aria-labelledby="cumul" className="card p-4 lg:p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 id="cumul" className="text-[17px] font-bold text-ink">
              CA cumulé et seuils
            </h2>
            <p className="flex items-center gap-3 text-[13px] font-semibold text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-[3px] w-5 rounded-full bg-ca" /> Réalisé
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-[3px] w-5 rounded-full border-t-[3px] border-dotted border-ca" /> Projeté
              </span>
            </p>
          </div>
          <Elevation
            ticks={['', ...MONTH_SHORT.map((m) => m.charAt(0))]}
            series={[
              { key: 'proj', label: 'Projeté', values: projectedLine, line: 'dashed', family: 'ca' },
              { key: 'real', label: 'Réalisé', values: realise, line: 'solid', weight: 'strong', family: 'ca', area: true },
            ]}
            datums={datums}
            today={todayPos}
            height={250}
            ariaLabel={`CA cumulé ${vm.year} : ${eur(vm.caRealise)} réalisés, ${eur(vm.caProjete)} projetés, plafond micro ${eur(vm.seuilMicro)}.`}
          />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Thresholds vm={vm} />
          <Levers onOpenTjm={() => setTjmOpen(true)} showTjm={showCalendar} />
        </div>

        {vm.activities.length > 1 && <ByActivity vm={vm} />}

        <section aria-labelledby="mois-table" className="card p-4 lg:p-5">
          <h2 id="mois-table" className="mb-2 text-[17px] font-bold text-ink">
            Mois par mois
          </h2>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="border-b-2 border-line text-left">
                <th scope="col" className="label-col py-2 pr-3">Mois</th>
                <th scope="col" className="label-col hidden py-2 pr-3 text-right sm:table-cell">Jours</th>
                <th scope="col" className="label-col py-2 pr-3 text-right">CA HT</th>
                <th scope="col" className="label-col hidden py-2 pr-3 text-right sm:table-cell">Prélèvements</th>
                <th scope="col" className="label-col py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {vm.months.map((m) => (
                <tr
                  key={m.index}
                  className={cn('cursor-pointer border-b border-line hover:bg-card-2', m.projected && 'text-ink-2')}
                  onClick={() => navigate({ to: '/', search: { mois: m.index } })}
                >
                  <th scope="row" className="py-2.5 pr-3 text-left font-semibold">
                    <Link to="/" search={{ mois: m.index }} className="hover:underline">
                      {m.name}
                    </Link>
                    {m.index === currentMonth && (
                      <Pill family="ca" variant="solid" className="ml-2 h-5 px-2 text-[11px]">
                        en cours
                      </Pill>
                    )}
                    {m.projected && (
                      <Pill family="charges" variant="solid" className="ml-2 h-5 px-2 text-[11px]">
                        projeté
                      </Pill>
                    )}
                  </th>
                  <td className="hidden py-2.5 pr-3 text-right tnum sm:table-cell">{m.days ? m.days.toLocaleString('fr-FR') : '—'}</td>
                  <td className="py-2.5 pr-3 text-right tnum">{m.ca ? eur(m.ca) : '—'}</td>
                  <td className="hidden py-2.5 pr-3 text-right tnum text-ink-2 sm:table-cell">
                    {m.ca ? (
                      <span className="inline-flex items-center justify-end gap-3">
                        <DeductionBar cot={m.cotisations} impot={m.impot} charges={m.charges} />
                        <span className="inline-block w-[5.5rem] text-right">{eur(-(m.cotisations + m.impot + m.charges))}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={cn('py-2.5 text-right font-bold tnum', m.net < 0 ? FAMILY.alert.ink : m.projected ? 'text-ink-2' : FAMILY.net.ink)}>
                    {m.ca ? eur(m.net) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="py-3 pr-3 text-left font-bold">Saisi</th>
                <td className="hidden py-3 pr-3 text-right font-semibold tnum sm:table-cell">
                  {vm.months.filter((m) => !m.projected).reduce((s, m) => s + m.days, 0).toLocaleString('fr-FR')}
                </td>
                <td className={cn('py-3 pr-3 text-right font-bold tnum', FAMILY.ca.ink)}>{eur(vm.caSaisi)}</td>
                <td className="hidden sm:table-cell" />
                <td className={cn('py-3 text-right text-[17px] font-extrabold tnum', FAMILY.net.ink)}>{eur(vm.netCumule)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </Sheet>

      <TjmMonthlyEditor
        open={tjmOpen}
        onClose={() => setTjmOpen(false)}
        year={fy.year}
        defaultTjm={profile.tjm}
        tjmByMonth={profile.tjmByMonth}
        initialMonth={fy.currentMonthIndex}
        onChange={({ defaultTjm, tjmByMonth }) => setProfile((p) => ({ ...p, tjm: defaultTjm, tjmByMonth }))}
        tvaAssujetti={profile.tvaAssujetti}
        tvaRate={profile.tvaRate}
        tvaEffectiveDate={profile.tvaEffectiveDate}
      />
    </>
  );
}

/** Mini-barre des prélèvements d'un mois : cotisations, impôt, charges. */
function DeductionBar({ cot, impot, charges }: { cot: number; impot: number; charges: number }) {
  const total = Math.max(1, cot + impot + charges);
  return (
    <span aria-hidden="true" className="hidden h-2 w-20 gap-[2px] overflow-hidden rounded-full md:flex">
      <span className="h-full bg-cot" style={{ width: `${(cot / total) * 100}%` }} />
      <span className="h-full bg-impot" style={{ width: `${(impot / total) * 100}%` }} />
      <span className="h-full bg-charges" style={{ width: `${(charges / total) * 100}%` }} />
    </span>
  );
}

function Row({ title, status, family, children }: { title: string; status: string; family: Family; children?: React.ReactNode }) {
  return (
    <div className="py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        <Pill family={family} variant="solid">
          {status}
        </Pill>
      </div>
      {children && <div className="mt-1 text-[14px] leading-snug text-ink-2 text-pretty">{children}</div>}
    </div>
  );
}

function Thresholds({ vm }: { vm: YearVM }) {
  const s = vm.seuil;
  const microStatus = s.status === 'crossed' ? 'Dépassé' : s.status === 'projected' ? 'Franchissement prévu' : s.status === 'near' ? 'Proche' : 'Sous le plafond';
  const tvaStatus = vm.tva.status === 'breach' ? 'TVA obligatoire' : vm.tva.status === 'warning' ? 'Seuil dépassé' : 'En franchise';
  return (
    <section aria-labelledby="seuils" className="card p-4 lg:p-5">
      <h2 id="seuils" className="text-[17px] font-bold text-ink">
        Seuils
      </h2>
      <div className="divide-y divide-line">
        <Row title="Plafond micro-entreprise" status={microStatus} family={s.status === 'crossed' ? 'alert' : s.status === 'ok' ? 'net' : 'warn'}>
          {s.date
            ? s.status === 'crossed'
              ? `Plafond de ${eur(vm.seuilMicro)} atteint le ${longDate.format(s.date)}. Deux années de dépassement consécutives font sortir du régime micro.`
              : `Au rythme actuel, le plafond de ${eur(vm.seuilMicro)} sera atteint le ${longDate.format(s.date)}.`
            : `Marge restante : ${eur(s.marge)} sur ${eur(vm.seuilMicro)}, projection comprise.`}
        </Row>
        {vm.tva.assujetti ? (
          <Row title="TVA" status="Facturée" family="tva">
            <span className={cn('font-bold', FAMILY.tva.ink)}>{eur(vm.tva.invoice.tva)} de TVA</span> collectés sur {eur(vm.tva.invoice.ht)} hors taxes, soit{' '}
            <span className={cn('font-bold', FAMILY.tva.ink)}>{eur(vm.tva.invoice.ttc)} TTC</span> facturés.
          </Row>
        ) : (
          <Row title="Franchise en base de TVA" status={tvaStatus} family={vm.tva.status === 'breach' ? 'alert' : vm.tva.status === 'warning' ? 'warn' : 'tva'}>
            {vm.tva.status === 'breach' && vm.tva.date
              ? `Le seuil majoré de ${eur(vm.tva.seuilMajore)} est dépassé : TVA à facturer dès la facture du ${longDate.format(vm.tva.date)}.`
              : vm.tva.status === 'warning'
                ? `Au-dessus de ${eur(vm.tva.seuil)} : la TVA s’appliquera au 1er janvier ${vm.year + 1}, ou plus tôt si le seuil majoré de ${eur(vm.tva.seuilMajore)} est franchi.`
                : `Marge : ${eur(Math.max(0, vm.tva.seuil - vm.tva.projete))} avant le seuil de ${eur(vm.tva.seuil)} (projection comprise).`}
          </Row>
        )}
        <Row title="Compte bancaire dédié" status={vm.comptePro.exceeded ? 'Seuil franchi' : 'Pas encore requis'} family={vm.comptePro.exceeded ? 'warn' : 'charges'}>
          {vm.comptePro.exceeded
            ? `Plus de ${eur(vm.comptePro.threshold)} de CA cette année : si c’est aussi le cas l’an prochain (ou si ce l’était l’an dernier), un compte dédié à l’activité est obligatoire.`
            : `Requis au-delà de ${eur(vm.comptePro.threshold)} de CA deux années consécutives.`}
        </Row>
      </div>
    </section>
  );
}

function Levers({ onOpenTjm, showTjm }: { onOpenTjm: () => void; showTjm: boolean }) {
  const { profile, setProfile } = useProfile();
  const params = getFiscalParams(profile);
  const legalRate = ACTIVITY_PARAMS[getPrimaryActivity(profile).type].urssafRate;
  const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, profile.year);
  const vlBlocked = elig.motif === 'rfr-too-high';
  const customCount = profile.tjmByMonth ? Object.keys(profile.tjmByMonth).length : 0;
  const fill = `${((Math.min(2000, Math.max(100, profile.tjm)) - 100) / 1900) * 100}%`;

  return (
    <section aria-labelledby="leviers" className="card p-4 lg:p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="leviers" className="text-[17px] font-bold text-ink">
          Leviers
        </h2>
        <Link to="/reglages/$section" params={{ section: 'activite' }} className="inline-flex min-h-9 pointer-coarse:min-h-11 items-center gap-1 text-[14px] font-semibold text-ca-ink hover:underline">
          Tous les réglages <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>
      <div className="divide-y divide-line">
        {showTjm && (
          <div className="space-y-2 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="tjm-annee" className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ca" />
                TJM par défaut <HelpTooltip termId="tjm" />
              </label>
              <NumberInput
                id="tjm-annee"
                min={50}
                max={3000}
                step={10}
                suffix="€/j"
                value={profile.tjm}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v >= 0 && v <= 3000) setProfile((p) => ({ ...p, tjm: v }));
                }}
                className="w-36"
              />
            </div>
            <input
              type="range"
              className="range-pill"
              min={100}
              max={2000}
              step={10}
              value={Math.min(2000, Math.max(100, profile.tjm))}
              onChange={(e) => setProfile((p) => ({ ...p, tjm: Number(e.target.value) }))}
              aria-label="TJM par défaut"
              aria-valuetext={eur(profile.tjm)}
              style={{ ['--range-fill' as string]: fill }}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-ink-2">
                {customCount > 0 ? `${customCount} mois ont un TJM propre ; ils ne suivent pas ce curseur.` : 'S’applique aux mois sans TJM propre.'}
                {profile.tvaAssujetti && (
                  <>
                    {' '}
                    Soit <span className={cn('font-bold', FAMILY.tva.ink)}>{eur(profile.tjm * (1 + profile.tvaRate))} TTC</span> par jour.
                  </>
                )}
              </p>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {customCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setProfile((p) => ({ ...p, tjmByMonth: undefined }))}>
                    Appliquer à tous les mois
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={onOpenTjm}>
                  TJM mois par mois
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 py-3.5">
          <div>
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-cot" />
              Taux de cotisations
            </p>
            <p className="text-[13px] text-ink-2">Taux légal {pct(legalRate)} pour votre activité principale.</p>
          </div>
          <div className="flex items-center gap-1">
            {Math.abs(profile.urssafRate - legalRate) > 0.001 && (
              <IconButton label={`Revenir au taux légal (${pct(legalRate)})`} size="sm" onClick={() => setProfile((p) => ({ ...p, urssafRate: legalRate }))}>
                <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </IconButton>
            )}
            <NumberInput
              aria-label="Taux de cotisations URSSAF"
              min={0}
              max={50}
              step={0.1}
              suffix="%"
              value={profile.urssafRate}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 0 && v <= 50) setProfile((p) => ({ ...p, urssafRate: v }));
              }}
              className="w-28"
            />
          </div>
        </div>
        <div className="py-3.5">
          <Switch
            family="impot"
            checked={profile.versementLiberatoire}
            onChange={(v) => setProfile((p) => ({ ...p, versementLiberatoire: v }))}
            label="Versement libératoire"
            adornment={<HelpTooltip termId="vl" />}
            description={
              vlBlocked
                ? profile.versementLiberatoire
                  ? `Simulation hors droits : revenu fiscal de référence ${elig.rfrYear} au-dessus du plafond, l’impôt réel sera au barème.`
                  : `Pas de droit en ${profile.year} (revenu fiscal de référence ${elig.rfrYear} au-dessus du plafond). Activez-le pour simuler.`
                : `Impôt prélevé à ${pct(params.tauxVL * 100)} du CA chaque mois, au lieu du barème.`
            }
          />
        </div>
        <div className="py-3.5">
          <Switch
            family="tva"
            checked={profile.tvaAssujetti}
            onChange={(v) => setProfile((p) => ({ ...p, tvaAssujetti: v, tvaEffectiveDate: v ? p.tvaEffectiveDate ?? `${p.year}-01-01` : p.tvaEffectiveDate }))}
            label="Facturer la TVA"
            adornment={<HelpTooltip termId="franchiseEnBase" />}
            description="Taux et date de départ dans les réglages."
          />
        </div>
      </div>
    </section>
  );
}

function ByActivity({ vm }: { vm: YearVM }) {
  return (
    <section aria-labelledby="par-activite" className="card p-4 lg:p-5">
      <h2 id="par-activite" className="mb-2 text-[17px] font-bold text-ink">
        Par activité
      </h2>
      <ul className="divide-y divide-line">
        {vm.activities.map((a) => {
          const ca = vm.caByActivity[a.type] ?? 0;
          const plafond = ACTIVITY_PARAMS[a.type].plafond;
          const share = plafond > 0 ? Math.min(1, ca / plafond) : 0;
          return (
            <li key={a.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-semibold text-ink">
                  {a.label || ACTIVITY_PARAMS[a.type].label}
                  {a.isPrimary && <Pill family="ca" className="ml-2 h-5 px-2 text-[11px]">principale</Pill>}
                </span>
                <Money value={ca} className={cn('text-[17px] font-bold', FAMILY.ca.ink)} />
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card-2" aria-hidden="true">
                <div className="h-full rounded-full bg-ca" style={{ width: `${share * 100}%` }} />
              </div>
              <p className="mt-1 text-[13px] text-ink-2 tnum">
                {Math.round(share * 1000) / 10} % de son plafond de {eur(plafond)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
