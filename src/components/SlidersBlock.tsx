import React from 'react';
import { ChevronRight, CalendarRange } from 'lucide-react';
import { TjmSlider } from '~/components/fiscal/TjmSlider';
import { UrssafSlider } from '~/components/fiscal/UrssafSlider';
import { TjmMonthChip } from '~/components/fiscal/TjmMonthChip';
import { formatEuro } from '~/lib/format';
import { cn } from '~/utils';

interface SlidersBlockProps {
  tjm: number;
  urssafRate: number;
  /** Taux URSSAF par défaut pour le bouton reset (issu de l'activité courante). */
  urssafDefault: number;
  workedDaysEquiv: number;
  caMensuel: number;
  netMensuel: number;
  onTjmChange: (next: number) => void;
  onUrssafChange: (next: number) => void;
  onOpenAdvanced: () => void;
  /** Affiche le slider TJM. Défaut true (pertinent uniquement en mode 'days'/'mixed'). */
  showTjmSlider?: boolean;
  /** Nombre de mois ayant une surcharge de TJM (sparse `tjmByMonth`). */
  customTjmMonthCount?: number;
  /** Ouvre l'éditeur de TJM mensuel (timeline d'évolution sur l'année). */
  onOpenMonthlyTjm?: () => void;
  /** TJM applicable au mois courant (résolu via resolveMonthlyTjm). */
  tjmMois?: number;
  /** Le mois courant a-t-il une surcharge dans tjmByMonth ? */
  isCustomTjmMois?: boolean;
  /** Nom du mois courant (pour l'aria-label du chip). */
  monthName?: string;
}

const Mini: React.FC<{ label: string; value: string; tone?: 'neutral' | 'positive' }> = ({
  label,
  value,
  tone = 'neutral',
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{label}</span>
    <span
      className={cn(
        'text-sm font-mono font-black tabular-nums',
        tone === 'positive' ? 'text-secondary' : 'text-on-surface',
      )}
    >
      {value}
    </span>
  </div>
);

function shortEuro(value: number): string {
  if (value >= 1000) {
    const k = Math.round(value / 100) / 10;
    return `${k.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k€`;
  }
  return `${formatEuro(value)}€`;
}

export const SlidersBlock: React.FC<SlidersBlockProps> = ({
  tjm,
  urssafRate,
  urssafDefault,
  workedDaysEquiv,
  caMensuel,
  netMensuel,
  onTjmChange,
  onUrssafChange,
  onOpenAdvanced,
  showTjmSlider = true,
  customTjmMonthCount = 0,
  onOpenMonthlyTjm,
  tjmMois,
  isCustomTjmMois = false,
  monthName,
}) => {
  return (
    <section
      aria-labelledby="sliders-block-title"
      className="bg-surface-lowest rounded-3xl shadow-sm p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2
          id="sliders-block-title"
          className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant"
        >
          Leviers fiscaux
        </h2>
        <button
          type="button"
          onClick={onOpenAdvanced}
          aria-label="Ouvrir les réglages fiscaux"
          className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:opacity-80 transition-opacity min-h-[28px] px-1"
        >
          Régler <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {showTjmSlider && (
        <div className="space-y-2">
          <TjmSlider value={tjm} onChange={onTjmChange} />
          {onOpenMonthlyTjm && (
            <button
              type="button"
              onClick={onOpenMonthlyTjm}
              aria-label="Ouvrir l'éditeur de TJM mensuel"
              className={cn(
                'w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl',
                'border border-dashed border-secondary/40 bg-secondary-container/20 hover:bg-secondary-container/30',
                'text-xs font-semibold text-on-surface min-h-[40px] transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
                {customTjmMonthCount === 0
                  ? 'Voir évolution sur l\'année'
                  : `${customTjmMonthCount} mois personnalisé${customTjmMonthCount > 1 ? 's' : ''}`}
              </span>
              <span className="inline-flex items-center gap-0.5 text-secondary font-bold">
                Ouvrir <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      )}
      <UrssafSlider value={urssafRate} onChange={onUrssafChange} defaultRate={urssafDefault} />

      {showTjmSlider && tjmMois !== undefined && (
        <TjmMonthChip
          tjm={tjmMois}
          isCustom={isCustomTjmMois}
          defaultTjm={tjm}
          onClick={onOpenMonthlyTjm}
          variant="compact"
          monthName={monthName}
        />
      )}

      <div
        className={cn(
          'pt-4 border-t border-outline-variant/15 grid gap-3',
          showTjmSlider ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        {showTjmSlider && (
          <Mini label="Jours/mois" value={workedDaysEquiv.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} />
        )}
        <Mini label="CA brut" value={shortEuro(caMensuel)} />
        <Mini label="Net mensuel" value={shortEuro(netMensuel)} tone="positive" />
      </div>
    </section>
  );
};
