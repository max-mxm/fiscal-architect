import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { MONTH_NAMES, MONTH_SHORT } from '~/lib/calendar';
import { Dialog } from '~/ui/Dialog';
import { Button } from '~/ui/Button';
import { NumberInput } from '~/ui/Field';
import { eur } from '~/ui/Money';
import { cn } from '~/utils';

interface TjmMonthlyEditorProps {
  open: boolean;
  onClose: () => void;
  year: number;
  defaultTjm: number;
  tjmByMonth: Record<number, number> | undefined;
  onChange: (next: { defaultTjm: number; tjmByMonth: Record<number, number> | undefined }) => void;
  initialMonth?: number;
  tvaAssujetti: boolean;
  tvaRate: number;
  tvaEffectiveDate: string | null;
}

const MIN_INPUT = 50;
const MAX_INPUT = 3000;
const MIN_SLIDER = 100;
const MAX_SLIDER = 2000;

const resolve = (def: number, map: Record<number, number> | undefined, m: number) => map?.[m] ?? def;
const unset = (map: Record<number, number> | undefined, m: number) => {
  if (!map) return undefined;
  const next = { ...map };
  delete next[m];
  return Object.keys(next).length === 0 ? undefined : next;
};

/** TJM par défaut et exceptions mois par mois, appliqués en direct. */
export const TjmMonthlyEditor: React.FC<TjmMonthlyEditorProps> = ({
  open,
  onClose,
  year,
  defaultTjm,
  tjmByMonth,
  onChange,
  initialMonth = 0,
  tvaAssujetti,
  tvaRate,
  tvaEffectiveDate,
}) => {
  const [selected, setSelected] = useState(initialMonth);
  useEffect(() => {
    if (open) setSelected(initialMonth);
  }, [open, initialMonth]);

  const customCount = tjmByMonth ? Object.keys(tjmByMonth).length : 0;
  const value = resolve(defaultTjm, tjmByMonth, selected);
  const custom = tjmByMonth?.[selected] !== undefined;
  const scale = useMemo(() => Math.max(MAX_SLIDER, defaultTjm, ...(tjmByMonth ? Object.values(tjmByMonth) : [])), [defaultTjm, tjmByMonth]);
  const tvaApplies = (m: number) => {
    if (!tvaAssujetti) return false;
    const eff = tvaEffectiveDate ? new Date(`${tvaEffectiveDate}T12:00:00`) : null;
    return !eff || new Date(year, m + 1, 0, 12) >= eff;
  };
  const setMonth = (m: number, v: number) => {
    if (!Number.isFinite(v)) return;
    onChange({ defaultTjm, tjmByMonth: { ...(tjmByMonth ?? {}), [m]: v } });
  };
  const fill = `${((Math.min(MAX_SLIDER, Math.max(MIN_SLIDER, value)) - MIN_SLIDER) / (MAX_SLIDER - MIN_SLIDER)) * 100}%`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`TJM ${year}, mois par mois`}
      description="Donnez un TJM propre aux mois où votre tarif change. Les autres mois suivent le TJM par défaut."
      footer={
        <>
          <Button variant="ghost" disabled={customCount === 0} onClick={() => onChange({ defaultTjm, tjmByMonth: undefined })}>
            Retirer les {customCount > 0 ? customCount : ''} exceptions
          </Button>
          <Button variant="primary" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      <div className="border-y border-line py-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="tjm-defaut" className="text-[15px] font-medium text-ink">
          TJM par défaut <span className="block text-[13px] font-normal text-ink-2">hors taxes</span>
        </label>
        <NumberInput
          id="tjm-defaut"
          min={MIN_INPUT}
          max={MAX_INPUT}
          step={10}
          suffix="€/j"
          value={defaultTjm}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (Number.isFinite(v)) onChange({ defaultTjm: v, tjmByMonth });
          }}
          className="w-36"
        />
      </div>
      <input
        type="range"
        className="range-pill mt-2"
        min={MIN_SLIDER}
        max={MAX_SLIDER}
        step={10}
        value={Math.min(MAX_SLIDER, Math.max(MIN_SLIDER, defaultTjm))}
        onChange={(e) => onChange({ defaultTjm: Number(e.target.value), tjmByMonth })}
        aria-label="TJM par défaut"
        aria-valuetext={eur(defaultTjm)}
        style={{ ['--range-fill' as string]: `${((Math.min(MAX_SLIDER, Math.max(MIN_SLIDER, defaultTjm)) - MIN_SLIDER) / (MAX_SLIDER - MIN_SLIDER)) * 100}%` }}
      />
      {customCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-ctl)] bg-ca-soft px-3 py-2">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-ca-ink">
            {customCount === 1 ? 'Ce mois garde' : 'Ces mois gardent'} leur propre TJM et ne suivent pas ce curseur :{' '}
            <strong className="font-bold">
              {Object.keys(tjmByMonth ?? {})
                .map(Number)
                .sort((x, y) => x - y)
                .map((m) => MONTH_NAMES[m].toLowerCase())
                .join(', ')}
            </strong>
            .
          </p>
          <Button variant="secondary" size="sm" onClick={() => onChange({ defaultTjm, tjmByMonth: undefined })}>
            Appliquer à tous les mois
          </Button>
        </div>
      )}
      </div>

      <div className="mt-4 grid grid-cols-12 items-end gap-1" role="tablist" aria-label="Mois de l'année">
        {MONTH_SHORT.map((label, m) => {
          const v = resolve(defaultTjm, tjmByMonth, m);
          const isCustom = tjmByMonth?.[m] !== undefined;
          const active = m === selected;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${MONTH_NAMES[m]} : ${eur(v)} par jour${isCustom ? ', TJM propre' : ''}`}
              onClick={() => setSelected(m)}
              className="flex min-h-11 flex-col items-center gap-1"
            >
              <span className={cn('text-[11px] tnum', active ? 'font-semibold text-ca-ink' : isCustom ? 'text-ink' : 'text-ink-3')}>
                {v}
              </span>
              <span className="flex h-20 w-full items-end">
                <span
                  className={cn(
                    'block w-full transition-[height] duration-300',
                    active ? 'bg-ca' : isCustom ? 'bg-ca-light' : 'border-2 border-dashed border-ca-light',
                  )}
                  style={{ height: `${Math.max(12, (v / scale) * 100)}%` }}
                />
              </span>
              <span className={cn('text-[11px]', active ? 'font-semibold text-ca-ink' : 'text-ink-3')}>{label.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[12px] text-ink-3">Plein : TJM propre · tireté : TJM par défaut.</p>

      <div className="mt-4 rounded-[var(--radius-card)] border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="tjm-mois" className="text-[15px] font-semibold text-ink">
            {MONTH_NAMES[selected]}
            <span className="block text-[13px] font-normal text-ink-2">
              {custom ? `TJM propre, ${eur(value - defaultTjm, { sign: true })} par rapport au défaut` : 'Suit le TJM par défaut'}
            </span>
          </label>
          <NumberInput
            id="tjm-mois"
            min={MIN_INPUT}
            max={MAX_INPUT}
            step={10}
            suffix="€/j"
            value={value}
            onChange={(e) => setMonth(selected, parseInt(e.target.value, 10))}
            className="w-36"
          />
        </div>
        <input
          type="range"
          className="range-pill mt-2"
          min={MIN_SLIDER}
          max={MAX_SLIDER}
          step={10}
          value={Math.min(MAX_SLIDER, Math.max(MIN_SLIDER, value))}
          onChange={(e) => setMonth(selected, Number(e.target.value))}
          aria-label={`TJM de ${MONTH_NAMES[selected].toLowerCase()}`}
          aria-valuetext={eur(value)}
          style={{ ['--range-fill' as string]: fill }}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-[13px] text-ink-2">
            {tvaApplies(selected) ? (
              <>
                Soit <span className="font-bold text-tva-ink">{eur(value * (1 + tvaRate))} TTC</span> par jour.
              </>
            ) : (
              'Hors taxes.'
            )}
          </p>
          {custom && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              onClick={() => onChange({ defaultTjm, tjmByMonth: unset(tjmByMonth, selected) })}
            >
              Revenir au défaut
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
