import React, { useMemo, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { QuickEditModal } from '~/components/ui/QuickEditModal';
import { MONTH_SHORT, MONTH_NAMES } from '~/lib/calendar';
import { cn } from '~/utils';

interface TjmMonthlyEditorProps {
  open: boolean;
  onClose: () => void;
  year: number;
  defaultTjm: number;
  tjmByMonth: Record<number, number> | undefined;
  onChange: (next: { defaultTjm: number; tjmByMonth: Record<number, number> | undefined }) => void;
  /** Mois à pré-sélectionner dans l'inspector (0..11). */
  initialMonth?: number;
  tvaAssujetti: boolean;
  tvaRate: number;
}

const TJM_MIN_INPUT = 50;
const TJM_MAX_INPUT = 3000;
const TJM_MIN_SLIDER = 100;
const TJM_MAX_SLIDER = 2000;

/** Échelle visuelle pour la hauteur des barres de la timeline desktop. */
const BAR_SCALE_MAX = 2000;
const BAR_MIN_HEIGHT_PCT = 22;

function isCustom(tjmByMonth: Record<number, number> | undefined, monthIndex: number): boolean {
  return tjmByMonth !== undefined && tjmByMonth[monthIndex] !== undefined;
}

function resolveTjm(defaultTjm: number, tjmByMonth: Record<number, number> | undefined, monthIndex: number): number {
  return tjmByMonth?.[monthIndex] ?? defaultTjm;
}

function setMonthValue(
  tjmByMonth: Record<number, number> | undefined,
  monthIndex: number,
  value: number,
): Record<number, number> {
  return { ...(tjmByMonth ?? {}), [monthIndex]: value };
}

function unsetMonthValue(
  tjmByMonth: Record<number, number> | undefined,
  monthIndex: number,
): Record<number, number> | undefined {
  if (!tjmByMonth) return undefined;
  const next = { ...tjmByMonth };
  delete next[monthIndex];
  // Si plus aucune surcharge → repasser à undefined (état canonique).
  return Object.keys(next).length === 0 ? undefined : next;
}

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
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  // À chaque ouverture, on recale la sélection sur le mois courant fourni.
  useEffect(() => {
    if (open) setSelectedMonth(initialMonth);
  }, [open, initialMonth]);

  const customCount = useMemo(
    () => (tjmByMonth ? Object.keys(tjmByMonth).length : 0),
    [tjmByMonth],
  );

  const selectedValue = resolveTjm(defaultTjm, tjmByMonth, selectedMonth);
  const selectedIsCustom = isCustom(tjmByMonth, selectedMonth);
  const selectedDelta = selectedValue - defaultTjm;

  // Pour l'échelle des barres : on s'adapte à la valeur max parmi {défaut, toutes les surcharges, BAR_SCALE_MAX}.
  const barScaleMax = useMemo(() => {
    const values = [defaultTjm, ...(tjmByMonth ? Object.values(tjmByMonth) : [])];
    return Math.max(BAR_SCALE_MAX, ...values);
  }, [defaultTjm, tjmByMonth]);

  const handleDefaultChange = (next: number) => {
    if (Number.isNaN(next)) return;
    onChange({ defaultTjm: next, tjmByMonth });
  };

  const handleMonthChange = (monthIndex: number, next: number) => {
    if (Number.isNaN(next)) return;
    onChange({
      defaultTjm,
      tjmByMonth: setMonthValue(tjmByMonth, monthIndex, next),
    });
  };

  const handleMonthReset = (monthIndex: number) => {
    onChange({
      defaultTjm,
      tjmByMonth: unsetMonthValue(tjmByMonth, monthIndex),
    });
  };

  const handleResetAll = () => {
    onChange({ defaultTjm, tjmByMonth: undefined });
  };

  return (
    <QuickEditModal
      open={open}
      onClose={onClose}
      title={`TJM mensuel — ${year}`}
      description="Personnalise le TJM des mois où ton tarif change. Les mois non touchés gardent la valeur par défaut."
    >
      <div className="space-y-4">
        {/* Bandeau TJM par défaut */}
        <div className="flex items-center justify-between bg-surface-low rounded-2xl px-4 py-3">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-on-surface-variant">
              TJM HT par défaut
            </span>
            <span className="text-xs text-on-surface-variant">
              Appliqué aux mois non personnalisés
            </span>
          </div>
          <label className="flex items-baseline gap-1">
            <span className="sr-only">Modifier le TJM par défaut</span>
            <input
              type="number"
              inputMode="decimal"
              min={TJM_MIN_INPUT}
              max={TJM_MAX_INPUT}
              step={10}
              value={defaultTjm}
              onChange={(e) => handleDefaultChange(parseInt(e.target.value, 10))}
              className="w-20 font-headline font-black text-lg text-secondary bg-transparent border-b border-secondary/30 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors outline-none"
            />
            <span className="text-secondary font-bold text-xs">€/j</span>
          </label>
        </div>
        {tvaAssujetti && <p className="-mt-2 text-right text-[11px] font-bold text-tax">soit {(defaultTjm * (1 + tvaRate)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC / j</p>}

        {/* Vue mobile : grille 4×3 */}
        <div
          className="md:hidden grid grid-cols-4 gap-2"
          role="tablist"
          aria-label="Mois de l'année"
        >
          {MONTH_SHORT.map((label, m) => {
            const value = resolveTjm(defaultTjm, tjmByMonth, m);
            const custom = isCustom(tjmByMonth, m);
            const active = m === selectedMonth;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${MONTH_NAMES[m]} — ${value} euros par jour${custom ? ' (personnalisé)' : ''}`}
                onClick={() => setSelectedMonth(m)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 min-h-[80px]',
                  'border-2 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                  active
                    ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                    : custom
                      ? 'bg-secondary-container/30 border-secondary/40 text-on-surface hover:bg-secondary-container/45'
                      : 'bg-surface-low border-transparent text-on-surface hover:bg-secondary-container/15',
                )}
              >
                {custom && !active && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-secondary"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.12em]',
                    active ? 'text-on-secondary/80' : 'text-on-surface-variant',
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'font-headline font-black text-base tabular-nums leading-none',
                    active
                      ? 'text-on-secondary'
                      : custom
                        ? 'text-secondary'
                        : 'text-on-surface-variant',
                  )}
                >
                  {value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Vue desktop : timeline 12 segments avec barres proportionnelles */}
        <div
          className="hidden md:grid grid-cols-12 gap-1 bg-surface-low rounded-2xl p-2"
          role="tablist"
          aria-label="Évolution du TJM sur l'année"
        >
          {MONTH_SHORT.map((label, m) => {
            const value = resolveTjm(defaultTjm, tjmByMonth, m);
            const custom = isCustom(tjmByMonth, m);
            const active = m === selectedMonth;
            const barHeight = Math.max(
              BAR_MIN_HEIGHT_PCT,
              (value / barScaleMax) * 100,
            );
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${MONTH_NAMES[m]} — ${value} euros par jour${custom ? ' (personnalisé)' : ''}`}
                onClick={() => setSelectedMonth(m)}
                className={cn(
                  'relative flex flex-col items-center justify-end gap-1 rounded-xl bg-surface-lowest pt-2 pb-1.5 px-0.5 min-h-[100px]',
                  'border-2 transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                  active
                    ? 'border-secondary'
                    : 'border-transparent hover:-translate-y-0.5',
                  custom && !active && 'bg-secondary-container/20',
                )}
              >
                {custom && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-secondary"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={cn(
                    'w-3/5 rounded-t transition-[height] duration-300',
                    custom ? 'bg-secondary' : 'bg-surface-highest',
                  )}
                  style={{ height: `${barHeight}%` }}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'font-mono font-bold tabular-nums text-[11px] leading-none',
                    custom ? 'text-secondary' : 'text-on-surface',
                  )}
                >
                  {value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant leading-none">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inspector du mois sélectionné */}
        <div className="bg-surface-low rounded-2xl p-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-on-surface-variant">
                Mois sélectionné
              </span>
              <span className="font-headline font-black text-xl leading-none mt-1">
                {MONTH_NAMES[selectedMonth]}
              </span>
            </div>
            <label className="flex items-baseline gap-1">
              <span className="sr-only">Modifier le TJM de {MONTH_NAMES[selectedMonth]}</span>
              <input
                type="number"
                inputMode="decimal"
                min={TJM_MIN_INPUT}
                max={TJM_MAX_INPUT}
                step={10}
                value={selectedValue}
                onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value, 10))}
                className="w-20 font-headline font-black text-xl text-secondary bg-transparent border-b border-secondary/30 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors outline-none"
              />
              <span className="text-secondary font-bold text-xs">€/j</span>
            </label>
          </div>

          <input
            type="range"
            min={TJM_MIN_SLIDER}
            max={TJM_MAX_SLIDER}
            step={10}
            value={selectedValue}
            onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value, 10))}
            aria-label={`TJM de ${MONTH_NAMES[selectedMonth]} en euros par jour`}
            className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
          />
          {tvaAssujetti && <p className="text-right text-[11px] font-bold text-tax">soit {(selectedValue * (1 + tvaRate)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € TTC / j</p>}

          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-xs">
            <span className="text-on-surface-variant">
              {selectedIsCustom
                ? `Personnalisé • ${selectedDelta > 0 ? '+' : ''}${selectedDelta} € vs défaut`
                : 'Valeur par défaut'}
            </span>
            {selectedIsCustom && (
              <button
                type="button"
                onClick={() => handleMonthReset(selectedMonth)}
                className="inline-flex items-center gap-1 text-secondary font-bold hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded px-1 py-0.5 min-h-[28px]"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Footer : compteur + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
          <span className="text-xs text-on-surface-variant">
            {customCount === 0
              ? 'Aucun mois personnalisé'
              : `${customCount} mois personnalisé${customCount > 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1">
            {customCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3 min-h-[40px] rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-highest/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                Tout réinitialiser
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 min-h-[40px] rounded-xl text-sm font-bold bg-secondary text-on-secondary hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              Terminé
            </button>
          </div>
        </div>
      </div>
    </QuickEditModal>
  );
};
