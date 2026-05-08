import React from 'react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_PROFILE } from '~/constants';

interface SeuilInputProps {
  value: number;
  onChange: (next: number) => void;
  /** Seuil "par défaut" (typiquement le plafond de l'activité courante). */
  defaultValue?: number;
}

export const SeuilInput: React.FC<SeuilInputProps> = ({ value, onChange, defaultValue = DEFAULT_PROFILE.seuilMicro }) => {
  const isCustom = value !== defaultValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <label htmlFor="seuil-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">
            Seuil micro
          </label>
          {isCustom && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              aria-label="Réinitialiser le seuil par défaut"
              title={`Réinitialiser (${defaultValue.toLocaleString('fr-FR')} €)`}
              className="text-on-surface-variant hover:text-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <input
            id="seuil-input"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 0) onChange(v);
            }}
            className="font-headline font-black text-lg text-secondary bg-transparent border-b border-secondary/30 w-28 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors"
          />
          <span className="text-secondary font-bold text-xs">€</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Plafond annuel de chiffre d'affaires pour rester en micro-entreprise (services BIC/BNC).
      </p>
    </div>
  );
};
