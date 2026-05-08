import React from 'react';
import type { ActivityEntry } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';

interface ActivityChipProps {
  activities: ActivityEntry[];
  /** id de l'activité courante. undefined = primaire. */
  value?: string;
  onChange: (id: string) => void;
  /** id pour htmlFor — utile quand un label externe est associé. */
  id?: string;
  ariaLabel?: string;
}

export const ActivityChip: React.FC<ActivityChipProps> = ({ activities, value, onChange, id, ariaLabel = 'Activité' }) => {
  const primary = activities.find((a) => a.isPrimary) ?? activities[0];
  const effective = value ?? primary?.id ?? '';

  return (
    <select
      id={id}
      value={effective}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary min-h-[36px]"
    >
      {activities.map((a) => {
        const params = ACTIVITY_PARAMS[a.type];
        const display = a.label?.trim() || params.label;
        return (
          <option key={a.id} value={a.id}>
            {display}
          </option>
        );
      })}
    </select>
  );
};
