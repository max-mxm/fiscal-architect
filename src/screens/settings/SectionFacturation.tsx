import React from 'react';
import { useProfile } from '~/context/ProfileContext';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import { Field, NumberInput, SelectInput, TextInput } from '~/ui/Field';
import { Segmented } from '~/ui/Segmented';
import { SettingsBlock, SettingsRow } from './parts';
import type { EndOfMonthCalculation, PaymentDelayMode, RevenueModel, UserProfile } from '~/types';
import { cn } from '~/utils';

type PresetId = 'cash' | 'net30' | 'eom45' | 'net60' | 'custom';

function presetOf(days: number, mode: PaymentDelayMode): PresetId {
  if (days === 0) return 'cash';
  if (mode === 'net' && days === 30) return 'net30';
  if (mode === 'endOfMonth' && days === 45) return 'eom45';
  if (mode === 'net' && days === 60) return 'net60';
  return 'custom';
}

const PRESETS: Array<{ id: PresetId; label: string; hint: string }> = [
  { id: 'cash', label: 'Comptant', hint: 'à la facture' },
  { id: 'net30', label: '30 jours', hint: 'nets' },
  { id: 'eom45', label: '45 jours', hint: 'fin de mois' },
  { id: 'net60', label: '60 jours', hint: 'nets' },
  { id: 'custom', label: 'Autre', hint: 'sur mesure' },
];

export function SectionFacturation() {
  const { profile, setProfile } = useProfile();
  const update = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));
  const days = profile.paymentDelayDays;
  const mode = profile.paymentDelayMode;
  const eom = profile.endOfMonthCalculation;
  const preset = presetOf(days, mode);
  const year = profile.year;

  const choose = (id: PresetId) => {
    if (id === 'cash') update({ paymentDelayDays: 0, paymentDelayMode: 'net' });
    if (id === 'net30') update({ paymentDelayDays: 30, paymentDelayMode: 'net' });
    if (id === 'eom45') update({ paymentDelayDays: 45, paymentDelayMode: 'endOfMonth', endOfMonthCalculation: 'monthEndThenDelay' });
    if (id === 'net60') update({ paymentDelayDays: 60, paymentDelayMode: 'net' });
    if (id === 'custom') update({ paymentDelayDays: days || 45 });
  };

  return (
    <div className="space-y-5">
      <SettingsBlock
        id="saisie"
        title="Saisie du chiffre d’affaires"
        description="Le calendrier de jours est le mode conseillé pour une activité au TJM."
      >
        <SettingsRow>
          <Segmented<RevenueModel>
            label="Mode de saisie du chiffre d'affaires"
            layout="stack"
            value={profile.revenueModel}
            onChange={(v) => update({ revenueModel: v })}
            options={[
              { value: 'days', label: 'Jours travaillés', description: 'TJM × jours cochés dans le calendrier.' },
              { value: 'forfait', label: 'Prestations au forfait', description: 'Devis ou factures datés, à montant fixe.' },
              { value: 'flat', label: 'CA mensuel', description: 'Un montant par mois (vente en ligne, VTC, location).' },
              { value: 'mixed', label: 'Mixte', description: 'Jours, forfaits et montants mensuels ensemble.' },
            ]}
          />
        </SettingsRow>
        <SettingsRow>
          <Field
            label="Début de mission"
            help="Les jours ouvrés disponibles et le CA réalisé sont comptés à partir de cette date."
          >
            {({ inputId, describedBy }) => (
              <TextInput
                id={inputId}
                aria-describedby={describedBy}
                type="date"
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                value={profile.missionStart}
                onChange={(e) => e.target.value && update({ missionStart: e.target.value })}
                className="sm:max-w-xs"
              />
            )}
          </Field>
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock
        id="delais"
        title="Délai de paiement"
        description="Délai contractuel maximum : il date l’encaissement de chaque facture mensuelle."
      >
        <SettingsRow className="space-y-4">
          <div role="radiogroup" aria-label="Délai de paiement habituel" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PRESETS.map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => choose(p.id)}
                  className={cn(
                    'flex min-h-14 flex-col items-start justify-center rounded-[var(--radius-ctl)] border px-3 text-left transition-colors',
                    active ? 'border-primary bg-primary text-on-primary' : 'border-line-3 text-ink hover:border-ink-2',
                  )}
                >
                  <span className="text-[16px] font-semibold">{p.label}</span>
                  <span className={cn('text-[13px]', active ? 'text-on-primary/80' : 'text-ink-2')}>{p.hint}</span>
                </button>
              );
            })}
          </div>

          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <Field label="Nombre de jours">
                {({ inputId }) => (
                  <NumberInput
                    id={inputId}
                    min={0}
                    max={120}
                    suffix="j"
                    value={days}
                    onChange={(e) => update({ paymentDelayDays: Math.min(120, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                )}
              </Field>
              <Field label="Calcul">
                {({ inputId }) => (
                  <SelectInput
                    id={inputId}
                    value={mode}
                    onChange={(e) => update({ paymentDelayMode: e.target.value as PaymentDelayMode })}
                  >
                    <option value="net">Jours nets</option>
                    <option value="endOfMonth">Fin de mois</option>
                  </SelectInput>
                )}
              </Field>
            </div>
          )}

          {mode === 'endOfMonth' && days > 0 && (
            <div className="space-y-1.5">
              <p className="text-[14px] font-medium text-ink">Méthode inscrite au contrat</p>
              <Segmented<EndOfMonthCalculation>
                label="Méthode de calcul fin de mois"
                layout="stack"
                value={eom}
                onChange={(v) => update({ endOfMonthCalculation: v })}
                options={[
                  {
                    value: 'monthEndThenDelay',
                    label: `Fin du mois d’émission, puis ${days} jours`,
                    description: days === 45 ? 'Facture du 31 janvier : échéance le 17 mars.' : 'Le délai part de la fin du mois d’émission.',
                  },
                  {
                    value: 'delayThenMonthEnd',
                    label: `${days} jours, puis fin de mois`,
                    description: days === 45 ? 'Facture du 31 janvier : échéance le 31 mars.' : 'L’échéance est reportée à la fin du mois obtenu.',
                  },
                ]}
              />
            </div>
          )}
          <p className="text-[13px] text-ink-2">
            Hypothèse : une facture récapitulative est émise le dernier jour de chaque mois travaillé.
          </p>
        </SettingsRow>
      </SettingsBlock>

      <p className="px-1 text-[13px] text-ink-2">
        Le TJM se règle depuis l’écran Année, mois par mois si besoin.{' '}
        <HelpTooltip termId="tjm" className="inline-flex align-middle" />
      </p>
    </div>
  );
}
