import React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '~/utils';
import { DEFAULT_PROFILE } from '~/constants';
import type { UserProfile } from '~/types';

const OPTIONS: UserProfile['status'][] = ['micro', 'sasu', 'eurl'];

const LABELS: Record<UserProfile['status'], string> = {
  micro: 'Micro',
  sasu: 'SASU',
  eurl: 'EURL',
};

interface StatusPillsProps {
  value: UserProfile['status'];
  onChange: (next: UserProfile['status']) => void;
}

export const StatusPills: React.FC<StatusPillsProps> = ({ value, onChange }) => {
  const isCustom = value !== DEFAULT_PROFILE.status;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Statut</span>
        {isCustom && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PROFILE.status)}
            aria-label="Réinitialiser au statut par défaut"
            title={`Réinitialiser (${LABELS[DEFAULT_PROFILE.status]})`}
            className="text-on-surface-variant hover:text-secondary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Statut juridique">
        {OPTIONS.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s)}
              className={cn(
                'flex-1 min-h-[44px] rounded-xl text-sm font-bold transition-all',
                active
                  ? 'bg-secondary text-white shadow-md'
                  : 'bg-surface-highest/40 text-on-surface-variant hover:bg-surface-highest/60'
              )}
            >
              {LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
