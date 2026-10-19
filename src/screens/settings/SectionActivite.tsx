import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import {
  ACRE_DURATION_MONTHS,
  ACRE_RATE_AFTER,
  ACRE_RATE_BEFORE,
  ACRE_TRANSITION_DATE,
  ACTIVITY_PARAMS,
  IJ_RATE_LIBERAL,
  getActivities,
  getPrimaryActivity,
} from '~/lib/fiscal';
import { VL_OFFICIAL_GUIDE_URL, calcVLEligibilityForYear, getVLRfrThresholdPerPart } from '~/lib/vlEligibility';
import { primaryActivityPatch } from './patches';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import { Field, NumberInput, TextInput } from '~/ui/Field';
import { Switch } from '~/ui/Switch';
import { Segmented } from '~/ui/Segmented';
import { IconButton } from '~/ui/Button';
import { eur, pct } from '~/ui/Money';
import { ActivityList } from './ActivityList';
import { dateLongue } from '~/ui/text';
import { SettingsBlock, SettingsRow, StatusNote } from './parts';
import type { UserProfile } from '~/types';

const longDate = dateLongue;
const monthLabel = (iso: string | null) => {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(+m[1], +m[2] - 1, 1, 12));
};

export function SectionActivite() {
  const { profile, setProfile } = useProfile();
  const year = profile.year;
  const update = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));
  const primary = getPrimaryActivity(profile).type;
  const params = ACTIVITY_PARAMS[primary];

  // TVA
  const tvaPct = Math.round(profile.tvaRate * 10000) / 100;
  const tvaFrom = monthLabel(profile.tvaEffectiveDate);

  // Impôt
  const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, year);
  const perPart = getVLRfrThresholdPerPart(year);
  const vlBlocked = elig.motif === 'rfr-too-high';

  // ACRE
  const created = profile.creationDate ? new Date(profile.creationDate) : null;
  const acreEnd = created ? new Date(created) : null;
  if (acreEnd) acreEnd.setMonth(acreEnd.getMonth() + ACRE_DURATION_MONTHS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const acreExpired = !!(acreEnd && today >= acreEnd);
  const acreRate = created && created < ACRE_TRANSITION_DATE ? ACRE_RATE_BEFORE : ACRE_RATE_AFTER;
  const hasLiberal = getActivities(profile).some((a) => a.type === 'liberalSsi' || a.type === 'liberalCipav');

  return (
    <div className="space-y-5">
      <SettingsBlock
        id="activite"
        title="Votre activité"
        description="L’activité principale fixe le taux de cotisations, l’abattement et le plafond micro."
      >
        <SettingsRow>
          <ActivityList activities={profile.activities} onChange={(next) => update(primaryActivityPatch(profile, next))} />
        </SettingsRow>
        <SettingsRow>
          <p className="text-[14px] text-ink-2">
            Contributions ajoutées automatiquement : formation professionnelle (CFP) {pct(params.cfpRate * 100, 2)}
            {params.taxeConsulaireRate > 0
              ? `, taxe consulaire ${pct(params.taxeConsulaireRate * 100, 3)}`
              : ', taxe consulaire non due'}
            .
          </p>
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock id="tva" title="TVA" description="Vos montants restent saisis hors taxes ; le TTC est calculé pour vous.">
        <SettingsRow>
          <Switch
            checked={profile.tvaAssujetti}
            onChange={(v) =>
              update({ tvaAssujetti: v, tvaEffectiveDate: v ? profile.tvaEffectiveDate ?? `${year}-01-01` : profile.tvaEffectiveDate })
            }
            family="tva"
            label="Je facture la TVA"
            adornment={<HelpTooltip termId="franchiseEnBase" />}
            description={
              profile.tvaAssujetti
                ? 'Vos factures portent la TVA à partir du mois choisi ci-dessous.'
                : 'Désactivé : franchise en base, aucune TVA sur vos factures.'
            }
          />
        </SettingsRow>
        <SettingsRow className="space-y-4">
          {profile.tvaAssujetti ? (
            <>
              <p className="flex items-start gap-2.5 rounded-[var(--radius-ctl)] bg-tva-soft px-3 py-2.5 text-[14px] leading-snug text-tva-ink">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tva" />
                <span>TVA à {pct(tvaPct, 2)} sur les factures émises {tvaFrom ? `à partir de ${tvaFrom}` : 'toute l’année'}. Elle reste
                exclue du CA et des seuils.</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="À partir de" help="Les factures émises avant ce mois restent hors taxes.">
                  {({ inputId, describedBy }) => (
                    <TextInput
                      id={inputId}
                      aria-describedby={describedBy}
                      type="month"
                      min={`${year}-01`}
                      max={`${year}-12`}
                      value={profile.tvaEffectiveDate?.slice(0, 7) ?? `${year}-01`}
                      onChange={(e) => e.target.value && update({ tvaEffectiveDate: `${e.target.value}-01` })}
                    />
                  )}
                </Field>
                <Field label="Taux facturé" help="20 % est le taux normal.">
                  {({ inputId, describedBy }) => (
                    <NumberInput
                      id={inputId}
                      aria-describedby={describedBy}
                      min={0}
                      max={100}
                      step={0.1}
                      suffix="%"
                      value={tvaPct}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v >= 0 && v <= 100) update({ tvaRate: v / 100 });
                      }}
                    />
                  )}
                </Field>
              </div>
            </>
          ) : (
            <StatusNote tone="neutral">
              Mention à porter sur vos factures : « TVA non applicable, art. 293 B du CGI ».
            </StatusNote>
          )}
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock
        id="impot"
        title="Impôt sur le revenu"
        description="Votre revenu fiscal de référence décide de l’accès au versement libératoire."
      >
        <SettingsRow className="space-y-4">
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Field
              label={`Revenu fiscal de référence ${elig.rfrYear}`}
              adornment={<HelpTooltip termId="rfr" />}
            >
              {({ inputId }) => (
                <NumberInput
                  id={inputId}
                  min={0}
                  step={100}
                  inputMode="numeric"
                  placeholder="Non renseigné"
                  suffix="€"
                  value={profile.rfrN2 ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (v === '') return update({ rfrN2: null });
                    const n = parseInt(v, 10);
                    if (!Number.isNaN(n) && n >= 0) update({ rfrN2: n });
                  }}
                />
              )}
            </Field>
            <Field label="Parts" adornment={<HelpTooltip termId="parts" />}>
              {({ inputId }) => (
                <NumberInput
                  id={inputId}
                  min={1}
                  max={10}
                  step={0.5}
                  value={profile.partsFiscales}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 1 && v <= 10) update({ partsFiscales: v });
                  }}
                />
              )}
            </Field>
          </div>
          {profile.rfrN2 != null && (
            <StatusNote tone={elig.eligible ? 'ok' : 'alert'}>
              {elig.eligible
                ? `Éligible au versement libératoire en ${year} : sous le plafond de ${eur(elig.threshold)}.`
                : `Non éligible au versement libératoire en ${year} : au-dessus du plafond de ${eur(elig.threshold)} pour ${profile.partsFiscales} part${profile.partsFiscales > 1 ? 's' : ''}.`}
            </StatusNote>
          )}
          <details className="group text-[14px] text-ink-2">
            <summary className="flex min-h-9 pointer-coarse:min-h-11 cursor-pointer list-none items-center gap-1.5 font-semibold text-ca-ink [&::-webkit-details-marker]:hidden">
              Où trouver ce montant ?
            </summary>
            <div className="mt-1 space-y-1.5 rounded-[var(--radius-ctl)] bg-card-2 p-3">
              <p>
                Pour {year}, c’est le revenu fiscal de référence {elig.rfrYear}, en haut de l’avis d’impôt reçu en{' '}
                {elig.taxNoticeYear}. Le plafond est multiplié par le nombre de parts du foyer.
              </p>
              <p>
                Plafond {perPart.known ? 'officiel' : 'indicatif (dernier connu)'} : {eur(perPart.amount)} par part.
              </p>
              <a
                href={VL_OFFICIAL_GUIDE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 pointer-coarse:min-h-11 items-center gap-1.5 font-semibold text-ca-ink hover:underline"
              >
                Conditions sur impots.gouv.fr
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </div>
          </details>
        </SettingsRow>
        <SettingsRow className="space-y-3">
          <Switch
            checked={profile.versementLiberatoire}
            onChange={(v) => update({ versementLiberatoire: v })}
            family="impot"
            label="Versement libératoire"
            adornment={<HelpTooltip termId="vl" />}
            description={`L’impôt est prélevé chaque mois à ${pct(params.tauxVL * 100)} du CA, au lieu du barème progressif.`}
          />
          {vlBlocked && (
            <StatusNote tone="alert" role="alert">
              {profile.versementLiberatoire
                ? `Simulation hors droits : votre revenu fiscal de référence ${elig.rfrYear} dépasse le plafond, l’impôt réel de ${year} sera calculé au barème. Pensez à désactiver le VL et à estimer le rattrapage.`
                : `Pas de droit en ${year} (revenu fiscal de référence ${elig.rfrYear} au-dessus du plafond). Vous pouvez l’activer pour simuler.`}
            </StatusNote>
          )}
          <Link
            to="/regularisation-vl"
            className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-ctl)] bg-impot-soft px-3 py-2 text-[15px] font-semibold text-ink transition-colors hover:brightness-95"
          >
            <span>
              Estimer un rattrapage de versement libératoire
              <span className="block text-[13px] font-normal text-ink-2">Si le VL a été payé sur des mois non éligibles.</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock id="acre" title="ACRE et protection" description="Vos droits dépendent de la date de création et de l’activité.">
        <SettingsRow>
          <Field label="Création de l’entreprise" help="Date d’immatriculation. Sert au calcul de l’ACRE (12 mois).">
            {({ inputId, describedBy }) => (
              <TextInput
                id={inputId}
                aria-describedby={describedBy}
                type="date"
                value={profile.creationDate}
                onChange={(e) => update({ creationDate: e.target.value })}
                className="sm:max-w-xs"
              />
            )}
          </Field>
        </SettingsRow>
        <SettingsRow>
          <Switch
            checked={profile.acreEnabled && !acreExpired && !!created}
            onChange={(v) => update({ acreEnabled: v })}
            disabled={!created || acreExpired}
            family="cot"
            label="ACRE"
            adornment={<HelpTooltip termId="acre" />}
            description={
              !created
                ? 'Renseignez la date de création pour activer l’ACRE.'
                : acreExpired
                  ? `Période de 12 mois terminée le ${longDate(acreEnd!)}.`
                  : `Cotisations réduites de ${Math.round(acreRate * 100)} % jusqu’au ${longDate(acreEnd!)}.`
            }
          />
        </SettingsRow>
        <SettingsRow>
          <Switch
            checked={profile.ijOption && hasLiberal}
            onChange={(v) => update({ ijOption: v })}
            disabled={!hasLiberal}
            family="cot"
            label="Indemnités journalières"
            adornment={<HelpTooltip termId="ij" />}
            description={
              hasLiberal
                ? `Cotisation de ${pct(IJ_RATE_LIBERAL * 100, 2)} du CA libéral pour ouvrir des droits en cas d’arrêt.`
                : 'Réservé aux activités libérales (SSI ou CIPAV).'
            }
          />
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock id="declaration" title="Déclaration et seuils">
        <SettingsRow>
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-ink">Déclaration URSSAF</p>
            <Segmented
              label="Périodicité de déclaration URSSAF"
              value={profile.declarationPeriod}
              onChange={(v) => update({ declarationPeriod: v })}
              options={[
                { value: 'monthly', label: 'Mensuelle' },
                { value: 'quarterly', label: 'Trimestrielle' },
              ]}
            />
            <p className="text-[13px] text-ink-2">Sert au calendrier « À déclarer » de l’écran Trésorerie.</p>
          </div>
        </SettingsRow>
        <SettingsRow>
          <Field
            label="Plafond micro-entreprise"
            help={`Plafond légal pour votre activité principale : ${eur(params.plafond)}.`}
            adornment={
              profile.seuilMicro !== params.plafond ? (
                <IconButton label={`Revenir à ${eur(params.plafond)}`} size="sm" onClick={() => update({ seuilMicro: params.plafond })}>
                  <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </IconButton>
              ) : null
            }
          >
            {({ inputId, describedBy }) => (
              <NumberInput
                id={inputId}
                aria-describedby={describedBy}
                min={0}
                step={100}
                suffix="€"
                value={profile.seuilMicro}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v >= 0) update({ seuilMicro: v });
                }}
                className="sm:max-w-xs"
              />
            )}
          </Field>
        </SettingsRow>
        <SettingsRow>
          <Field
            label="Jours travaillés par mois"
            help="Rythme utilisé pour projeter les mois à venir encore vides."
          >
            {({ inputId, describedBy }) => (
              <NumberInput
                id={inputId}
                aria-describedby={describedBy}
                min={0}
                max={23}
                step={1}
                suffix="j"
                value={profile.workingDays}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value));
                  if (Number.isFinite(v) && v >= 0 && v <= 23) update({ workingDays: v });
                }}
                className="sm:max-w-[10rem]"
              />
            )}
          </Field>
        </SettingsRow>
      </SettingsBlock>
    </div>
  );
}
