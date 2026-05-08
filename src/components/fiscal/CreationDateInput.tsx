import React from 'react';

interface CreationDateInputProps {
  value: string | undefined;
  onChange: (next: string) => void;
}

export const CreationDateInput: React.FC<CreationDateInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="creation-date-input" className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">
          Création de l'activité
        </label>
      </div>
      <input
        id="creation-date-input"
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium font-mono focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
      />
      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
        Date d'immatriculation de votre micro-entreprise. Sert au calcul de l'ACRE (12 mois post-création).
      </p>
    </div>
  );
};
