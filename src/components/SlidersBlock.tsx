import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TjmSlider } from '~/components/fiscal/TjmSlider';
import { UrssafSlider } from '~/components/fiscal/UrssafSlider';
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

      {showTjmSlider && <TjmSlider value={tjm} onChange={onTjmChange} />}
      <UrssafSlider value={urssafRate} onChange={onUrssafChange} defaultRate={urssafDefault} />

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
