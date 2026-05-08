import React from 'react';
import { CalendarDays, FileText, Coins, Layers, Check } from 'lucide-react';
import type { RevenueModel } from '~/types';
import { cn } from '~/utils';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import type { FiscalTermId } from '~/lib/fiscalGlossary';

interface RevenueModeSelectorProps {
  value: RevenueModel;
  onChange: (next: RevenueModel) => void;
}

const ORDER: RevenueModel[] = ['days', 'forfait', 'flat', 'mixed'];

const ICONS: Record<RevenueModel, React.ComponentType<{ className?: string }>> = {
  days: CalendarDays,
  forfait: FileText,
  flat: Coins,
  mixed: Layers,
};

const META: Record<RevenueModel, { label: string; hint: string; tag: string; helpTermId?: FiscalTermId }> = {
  days: {
    label: 'Jours travaillés',
    hint: 'Freelance / consultant — TJM × jours via calendrier',
    tag: 'TJM',
    helpTermId: 'tjm',
  },
  forfait: {
    label: 'Prestations au forfait',
    hint: 'Artisan / projet — devis ponctuels datés',
    tag: 'Forfait',
  },
  flat: {
    label: 'CA mensuel agrégé',
    hint: 'E-commerce / VTC — un montant total par mois',
    tag: 'Mensuel',
  },
  mixed: {
    label: 'Mixte',
    hint: 'Combine plusieurs modes au sein d\'un même mois',
    tag: 'Mixte',
  },
};

export const RevenueModeSelector: React.FC<RevenueModeSelectorProps> = ({ value, onChange }) => {
  return (
    <fieldset
      role="radiogroup"
      aria-label="Mode de saisie du chiffre d'affaires"
      className="flex flex-col gap-2 p-0 m-0 border-0"
    >
      {ORDER.map((m) => {
        const Icon = ICONS[m];
        const meta = META[m];
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m)}
            className={cn(
              'flex items-center gap-3 min-h-[64px] w-full rounded-2xl border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              active
                ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
                : 'border-outline-variant/30 bg-surface-lowest hover:bg-surface-highest/30 active:bg-surface-highest/50',
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
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold text-on-surface truncate">{meta.label}</span>
                {meta.helpTermId && <HelpTooltip termId={meta.helpTermId} />}
              </span>
              <span className="text-[11px] text-on-surface-variant truncate">{meta.hint}</span>
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                active ? 'bg-secondary text-on-secondary' : 'bg-surface-highest/60 text-on-surface-variant',
              )}
            >
              {meta.tag}
              {active && <Check className="w-3 h-3" aria-hidden="true" />}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
};
