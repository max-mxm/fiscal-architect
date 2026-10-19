import React, { useEffect, useMemo, useState } from 'react';
import { buildDefaultYearConfig, getLegalParamsForYear } from '~/constants';
import { previewInheritedConfig } from '~/lib/yearLifecycle';
import { Dialog } from '~/ui/Dialog';
import { Button } from '~/ui/Button';
import { eur, pct } from '~/ui/Money';
import { cn } from '~/utils';
import type { YearConfig } from '~/types';
import type { YearTransitionMode } from '~/context/FiscalYearContext';

interface YearTransitionModalProps {
  open: boolean;
  targetYear: number;
  sourceYear: number | null;
  onConfirm: (mode: YearTransitionMode) => void;
  onCancel: () => void;
}

function Summary({ config }: { config: YearConfig }) {
  const options = [config.acreEnabled && 'ACRE', config.versementLiberatoire && 'versement libératoire', config.tvaAssujetti && 'TVA']
    .filter(Boolean)
    .join(', ');
  const costs = config.fixedCosts.reduce((s, c) => s + c.amount, 0);
  return (
    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px]">
      <dt className="text-ink-2">TJM</dt>
      <dd className="font-medium text-ink tnum">{eur(config.tjm)}</dd>
      <dt className="text-ink-2">Rythme</dt>
      <dd className="font-medium text-ink tnum">{config.workingDays} jours par mois</dd>
      <dt className="text-ink-2">Charges fixes</dt>
      <dd className="font-medium text-ink tnum">{config.fixedCosts.length ? `${eur(costs)} par mois` : 'aucune'}</dd>
      <dt className="text-ink-2">Options</dt>
      <dd className="text-ink">{options || 'aucune'}</dd>
    </dl>
  );
}

/** Créer une nouvelle année : reprendre la précédente ou repartir des valeurs par défaut. */
export const YearTransitionModal: React.FC<YearTransitionModalProps> = ({ open, targetYear, sourceYear, onConfirm, onCancel }) => {
  const [mode, setMode] = useState<YearTransitionMode>(sourceYear != null ? 'inherit' : 'fresh');
  useEffect(() => {
    if (open) setMode(sourceYear != null ? 'inherit' : 'fresh');
  }, [open, sourceYear, targetYear]);

  const inherited = useMemo(() => (sourceYear != null ? previewInheritedConfig(targetYear, sourceYear) : null), [sourceYear, targetYear]);
  const fresh = useMemo(() => buildDefaultYearConfig(targetYear), [targetYear]);
  const legal = useMemo(() => getLegalParamsForYear(targetYear), [targetYear]);

  const options: Array<{ id: YearTransitionMode; title: string; text: string; config: YearConfig }> = [];
  if (sourceYear != null && inherited) {
    options.push({ id: 'inherit', title: `Reprendre ${sourceYear}`, text: 'Vos paramètres sont conservés ; le calendrier est vide.', config: inherited });
  }
  options.push({ id: 'fresh', title: 'Repartir de zéro', text: 'Valeurs par défaut, sans charges personnalisées.', config: fresh });

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      size="lg"
      title={`Ouvrir l’année ${targetYear}`}
      description="Comment démarrer cette nouvelle année fiscale ?"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => onConfirm(mode)}>
            Créer {targetYear}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Point de départ" className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const selected = mode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(o.id)}
              className={cn(
                'rounded-[var(--radius-card)] border-2 p-4 text-left transition-colors',
                selected ? 'border-primary bg-primary-soft' : 'border-line hover:border-line-2',
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={cn('inline-flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-primary' : 'border-line-3')}>
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="text-[17px] font-semibold text-ink">{o.title}</span>
              </span>
              <span className="mt-1 block text-[14px] text-ink-2">{o.text}</span>
              <Summary config={o.config} />
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[14px] text-ink-2">
        Paramètres légaux {targetYear} appliqués d’office : cotisations {pct(legal.urssafRate)}, plafond micro {eur(legal.seuilMicro)}.
      </p>
    </Dialog>
  );
};
