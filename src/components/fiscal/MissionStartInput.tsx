import React from 'react';

interface MissionStartInputProps {
  value: string;
  onChange: (next: string) => void;
  year: number;
}

export const MissionStartInput: React.FC<MissionStartInputProps> = ({ value, onChange, year }) => {
  const min = `${year}-01-01`;
  const max = `${year}-12-31`;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="mission-start-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">
          Début de mission
        </label>
      </div>
      <input
        id="mission-start-input"
        type="date"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium font-mono focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
      />
      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
        Borne basse pour le calcul du CA réalisé et du nombre de jours ouvrés disponibles.
      </p>
    </div>
  );
};
