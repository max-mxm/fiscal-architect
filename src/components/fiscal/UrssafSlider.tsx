import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_PROFILE } from '~/constants';
import { formatPercent } from '~/lib/format';

interface UrssafSliderProps {
  value: number;
  onChange: (next: number) => void;
  /** Taux "par défaut" pour le bouton reset (typiquement le taux de l'activité courante). */
  defaultRate?: number;
}

export const UrssafSlider: React.FC<UrssafSliderProps> = ({ value, onChange, defaultRate = DEFAULT_PROFILE.urssafRate }) => {
  const [expanded, setExpanded] = useState(false);
  const isCustom = value !== defaultRate;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">URSSAF</span>
          {isCustom && (
            <button
              type="button"
              title={`Réinitialiser (${defaultRate}%)`}
              onClick={() => onChange(defaultRate)}
              aria-label="Réinitialiser le taux URSSAF par défaut"
              className="text-on-surface-variant hover:text-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="urssaf-slider-row"
          className="px-2 py-0.5 rounded-full bg-secondary/5 text-secondary text-xs font-bold tracking-tight hover:bg-secondary/10 transition-colors min-h-[28px] flex items-center"
          title={expanded ? 'Masquer le réglage' : 'Modifier le taux'}
        >
          {formatPercent(value)}%
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="urssaf-slider-row"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <input
                type="range"
                min={0}
                max={50}
                step={0.1}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                aria-label="Taux URSSAF en pourcentage"
                className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
