import React from 'react';
import { Package, Wrench, Briefcase, Scale, Check } from 'lucide-react';
import type { Activity } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import { cn } from '~/utils';

interface ActivitySelectorProps {
  value: Activity;
  onChange: (next: Activity) => void;
}

const ORDER: Activity[] = ['vente', 'serviceBic', 'liberalSsi', 'liberalCipav'];

const ICONS: Record<Activity, React.ComponentType<{ className?: string }>> = {
  vente: Package,
  serviceBic: Wrench,
  liberalSsi: Briefcase,
  liberalCipav: Scale,
};

function shortPlafond(value: number): string {
  if (value >= 100_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({ value, onChange }) => {
  return (
    <fieldset
      role="radiogroup"
      aria-label="Activité"
      className="flex flex-col gap-2 p-0 m-0 border-0"
    >
      {ORDER.map((a) => {
        const params = ACTIVITY_PARAMS[a];
        const Icon = ICONS[a];
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(a)}
            className={cn(
              'flex items-center gap-3 min-h-[64px] w-full rounded-2xl border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              active
                ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
                : 'border-outline-variant/30 bg-white hover:bg-surface-highest/30 active:bg-surface-highest/50',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                active ? 'bg-secondary/10 text-secondary' : 'bg-surface-highest/60 text-on-surface-variant',
              )}
            >
              <Icon className="w-5 h-5" />
            </span>
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{params.label}</span>
              <span className="text-[11px] text-on-surface-variant truncate">
                {params.hint} · plafond {shortPlafond(params.plafond)}€
              </span>
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                active ? 'bg-secondary text-white' : 'bg-surface-highest/60 text-on-surface-variant',
              )}
            >
              {params.urssafRate.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              {active && <Check className="w-3 h-3" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
};
