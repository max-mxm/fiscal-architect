import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, Check, Pencil } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { ACRE_DURATION_MONTHS } from '~/lib/fiscal';
import { calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { FixedCostsEditor } from '~/components/fiscal/FixedCostsEditor';
import { Dialog } from '~/ui/Dialog';
import { Button } from '~/ui/Button';
import { eur } from '~/ui/Money';
import { FAMILY, type Family } from '~/ui/families';
import { dateLongue } from '~/ui/text';
import { cn } from '~/utils';

function ToggleChip({
  label,
  checked,
  family,
  onChange,
  disabled,
  hint,
  hintId,
  warning,
}: {
  label: string;
  checked: boolean;
  family: Family;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
  hintId?: string;
  /** Actif mais hors droits : la pastille passe en rouge avec une icône d'alerte. */
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-describedby={(disabled || warning) && hint ? hintId : undefined}
      title={hint}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full pl-2 pr-3.5 text-[14px] font-bold transition-[background-color,color,box-shadow] duration-150',
        disabled
          ? 'cursor-not-allowed bg-card-2 text-ink-3'
          : checked && warning
            ? FAMILY.alert.fill
            : checked
              ? FAMILY[family].fill
              : 'bg-card text-ink-2 shadow-[inset_0_0_0_1.5px_var(--color-line-3)] hover:text-ink',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full',
          checked && !disabled ? 'bg-white/35' : FAMILY[family].soft,
        )}
      >
        {checked && warning ? (
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={3} />
        ) : checked && !disabled ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          <span className={cn('h-2 w-2 rounded-full', FAMILY[family].dot)} />
        )}
      </span>
      {label}
    </button>
  );
}

function ActionChip({ label, value, family, onClick }: { label: string; value: string; family: Family; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('inline-flex h-11 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-3 text-[14px] font-bold transition-colors hover:brightness-95', FAMILY[family].soft)}
    >
      <span className="font-semibold">{label}</span>
      <span className="tnum">{value}</span>
      <Pencil className="h-3.5 w-3.5 opacity-70" strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}

interface QuickLeversProps {
  monthName: string;
  tjm: number;
  tjmCustom: boolean;
  showTjm: boolean;
  onOpenTjm: () => void;
}

/** Réglages qui changent le net du mois, à portée de pouce sur l'écran Mois. */
export function QuickLevers({ monthName, tjm, tjmCustom, showTjm, onOpenTjm }: QuickLeversProps) {
  const { profile, setProfile } = useProfile();
  const [chargesOpen, setChargesOpen] = useState(false);
  const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, profile.year);
  const vlBlocked = elig.motif === 'rfr-too-high';

  const created = profile.creationDate ? new Date(profile.creationDate) : null;
  const acreEnd = created ? new Date(created) : null;
  if (acreEnd) acreEnd.setMonth(acreEnd.getMonth() + ACRE_DURATION_MONTHS);
  // L'ACRE compte si sa fenêtre de 12 mois recoupe l'année affichée.
  const yearStart = new Date(profile.year, 0, 1);
  const yearEnd = new Date(profile.year, 11, 31, 23, 59);
  const acreAvailable = !!created && !!acreEnd && acreEnd > yearStart && created <= yearEnd;
  const acreReason = !created
    ? 'ACRE : renseignez la date de création de l’entreprise dans les réglages.'
    : !acreAvailable
      ? `ACRE : la période de 12 mois ne couvre pas ${profile.year} (fin le ${dateLongue(acreEnd!)}).`
      : null;
  const tvaFrom = profile.tvaEffectiveDate
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(`${profile.tvaEffectiveDate}T12:00:00`))
    : null;
  const charges = profile.fixedCosts.reduce((s, c) => s + c.amount, 0);

  return (
    <section aria-labelledby="reglages-rapides" className="card p-4">
      <h2 id="reglages-rapides" className="mb-3 text-[17px] font-bold text-ink">
        Réglages rapides
      </h2>
      <div className="flex flex-wrap gap-2">
        {showTjm && <ActionChip label={tjmCustom ? `TJM ${monthName.toLowerCase()}` : 'TJM'} value={`${eur(tjm)}/j`} family="ca" onClick={onOpenTjm} />}
        <ToggleChip
          label="Versement libératoire"
          family="impot"
          checked={profile.versementLiberatoire}
          warning={vlBlocked}
          hint={vlBlocked ? `Pas de droit en ${profile.year} : simulation uniquement.` : undefined}
          hintId="vl-raison"
          onChange={(v) => setProfile((p) => ({ ...p, versementLiberatoire: v }))}
        />
        <ToggleChip
          label="TVA"
          family="tva"
          checked={profile.tvaAssujetti}
          onChange={(v) => setProfile((p) => ({ ...p, tvaAssujetti: v, tvaEffectiveDate: v ? p.tvaEffectiveDate ?? `${p.year}-01-01` : p.tvaEffectiveDate }))}
        />
        <ToggleChip
          label="ACRE"
          family="cot"
          checked={profile.acreEnabled && acreAvailable}
          disabled={!acreAvailable}
          hint={acreReason ?? undefined}
          hintId="acre-raison"
          onChange={(v) => setProfile((p) => ({ ...p, acreEnabled: v }))}
        />
        <ActionChip label="Charges" value={`${eur(charges)}/mois`} family="charges" onClick={() => setChargesOpen(true)} />
      </div>
      <div className="mt-2 space-y-1 text-[13px] leading-snug text-ink-2">
        {profile.tvaAssujetti && tvaFrom && (
          <p>
            <span className={cn('font-bold', FAMILY.tva.ink)}>TVA</span> appliquée aux factures à partir de {tvaFrom}.{' '}
            <Link to="/reglages/$section" params={{ section: 'activite' }} hash="tva" className="font-semibold text-ca-ink hover:underline">
              Modifier
            </Link>
          </p>
        )}
        {vlBlocked &&
          (profile.versementLiberatoire ? (
            <p id="vl-raison" className="font-semibold text-alert-ink">
              Versement libératoire simulé hors droits : en {profile.year}, l’impôt réel sera calculé au barème.
            </p>
          ) : (
            <p id="vl-raison">
              Pas de droit au versement libératoire en {profile.year} (revenu fiscal de référence {elig.rfrYear} au-dessus du plafond) : vous pouvez
              l’activer pour simuler.
            </p>
          ))}
        {acreReason && <p id="acre-raison">{acreReason}</p>}
      </div>

      <Dialog
        open={chargesOpen}
        onClose={() => setChargesOpen(false)}
        title="Charges fixes mensuelles"
        description="Abonnements et frais récurrents, déduits chaque mois de votre net."
        footer={
          <Button variant="primary" onClick={() => setChargesOpen(false)}>
            Terminé
          </Button>
        }
      >
        <FixedCostsEditor costs={profile.fixedCosts} onChange={(next) => setProfile((p) => ({ ...p, fixedCosts: next }))} />
      </Dialog>
    </section>
  );
}
