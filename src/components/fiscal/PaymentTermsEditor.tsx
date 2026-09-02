import React from 'react';
import { CalendarClock, Info } from 'lucide-react';
import type { EndOfMonthCalculation, PaymentDelayMode } from '~/types';

interface PaymentTermsEditorProps {
  days: number;
  mode: PaymentDelayMode;
  endOfMonthCalculation: EndOfMonthCalculation;
  onChange: (next: {
    paymentDelayDays: number;
    paymentDelayMode: PaymentDelayMode;
    endOfMonthCalculation: EndOfMonthCalculation;
  }) => void;
}

type PresetId = 'cash' | 'net30' | 'eom45' | 'net60' | 'custom';

function getPreset(days: number, mode: PaymentDelayMode): PresetId {
  if (days === 0) return 'cash';
  if (mode === 'net' && days === 30) return 'net30';
  if (mode === 'endOfMonth' && days === 45) return 'eom45';
  if (mode === 'net' && days === 60) return 'net60';
  return 'custom';
}

const PRESETS: Array<{ id: PresetId; label: string; hint: string }> = [
  { id: 'cash', label: 'Comptant', hint: '0 jour' },
  { id: 'net30', label: '30 jours', hint: 'nets' },
  { id: 'eom45', label: '45 jours', hint: 'fin de mois' },
  { id: 'net60', label: '60 jours', hint: 'nets' },
  { id: 'custom', label: 'Autre', hint: 'personnalisé' },
];

export const PaymentTermsEditor: React.FC<PaymentTermsEditorProps> = ({
  days,
  mode,
  endOfMonthCalculation,
  onChange,
}) => {
  const preset = getPreset(days, mode);

  const selectPreset = (id: PresetId) => {
    if (id === 'cash') onChange({ paymentDelayDays: 0, paymentDelayMode: 'net', endOfMonthCalculation });
    if (id === 'net30') onChange({ paymentDelayDays: 30, paymentDelayMode: 'net', endOfMonthCalculation });
    if (id === 'eom45') onChange({
      paymentDelayDays: 45,
      paymentDelayMode: 'endOfMonth',
      endOfMonthCalculation: 'monthEndThenDelay',
    });
    if (id === 'net60') onChange({ paymentDelayDays: 60, paymentDelayMode: 'net', endOfMonthCalculation });
    if (id === 'custom') onChange({ paymentDelayDays: days || 45, paymentDelayMode: mode, endOfMonthCalculation });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline-variant/25 bg-surface-low p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Délai contractuel maximum</h4>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Utilisé pour projeter la date d’encaissement la plus tardive de chaque facture mensuelle.
            </p>
          </div>
        </div>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          Convention habituelle
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((item) => {
            const active = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectPreset(item.id)}
                className={
                  'min-h-[56px] rounded-2xl border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30 ' +
                  (active
                    ? 'border-secondary bg-secondary/8 text-secondary ring-1 ring-secondary/20'
                    : 'border-outline-variant/30 bg-surface-lowest text-on-surface hover:bg-surface-highest/30')
                }
              >
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="block text-[11px] text-on-surface-variant">{item.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {preset === 'custom' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="payment-delay-days" className="mb-2 block text-xs font-bold text-on-surface">
              Nombre de jours
            </label>
            <input
              id="payment-delay-days"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              value={days}
              onChange={(event) => onChange({
                paymentDelayDays: Math.min(120, Math.max(0, Number(event.target.value) || 0)),
                paymentDelayMode: mode,
                endOfMonthCalculation,
              })}
              className="min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-lowest px-3 py-2.5 text-base font-bold text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label htmlFor="payment-delay-mode" className="mb-2 block text-xs font-bold text-on-surface">
              Mode de calcul
            </label>
            <select
              id="payment-delay-mode"
              value={mode}
              onChange={(event) => onChange({
                paymentDelayDays: days,
                paymentDelayMode: event.target.value as PaymentDelayMode,
                endOfMonthCalculation,
              })}
              className="min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-lowest px-3 py-2.5 text-base font-medium text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="net">Jours nets</option>
              <option value="endOfMonth">Fin de mois</option>
            </select>
          </div>
        </div>
      )}

      {mode === 'endOfMonth' && days > 0 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-xs font-bold text-on-surface">Méthode inscrite au contrat</legend>
          <div className="space-y-2">
            {([
              [
                'monthEndThenDelay',
                `Fin du mois d’émission + ${days} jours`,
                days === 45 ? 'Exemple : facture du 31 janvier → échéance le 17 mars.' : 'Le délai part de la fin du mois d’émission.',
              ],
              [
                'delayThenMonthEnd',
                `${days} jours après la facture, puis fin du mois`,
                days === 45 ? 'Exemple : facture du 31 janvier → échéance le 31 mars.' : 'L’échéance est reportée à la fin du mois obtenu.',
              ],
            ] as const).map(([value, label, hint]) => (
              <label
                key={value}
                className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest px-3 py-3 hover:bg-surface-highest/25"
              >
                <input
                  type="radio"
                  name="end-of-month-calculation"
                  value={value}
                  checked={endOfMonthCalculation === value}
                  onChange={() => onChange({
                    paymentDelayDays: days,
                    paymentDelayMode: mode,
                    endOfMonthCalculation: value,
                  })}
                  className="mt-0.5 h-4 w-4 accent-secondary"
                />
                <span>
                  <span className="block text-sm font-bold text-on-surface">{label}</span>
                  <span className="block text-[11px] leading-relaxed text-on-surface-variant">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-on-surface-variant">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Les délais sont calculés depuis une facture émise en fin de mois. Adaptez la méthode à la clause exacte de votre contrat.
      </p>
    </div>
  );
};
