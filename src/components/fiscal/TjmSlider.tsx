import React from 'react';

interface TjmSliderProps {
  value: number;
  onChange: (next: number) => void;
}

export const TjmSlider: React.FC<TjmSliderProps> = ({ value, onChange }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="tjm-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">
          TJM
        </label>
        <div className="flex items-baseline gap-1">
          <input
            id="tjm-input"
            type="number"
            inputMode="decimal"
            min={50}
            max={3000}
            step={10}
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onChange(v);
            }}
            className="font-headline font-black text-lg text-secondary bg-transparent border-b border-secondary/30 w-20 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors"
          />
          <span className="text-secondary font-bold text-xs">€/j</span>
        </div>
      </div>
      <input
        type="range"
        min={100}
        max={2000}
        step={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label="TJM en euros par jour"
        className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
      />
    </div>
  );
};
