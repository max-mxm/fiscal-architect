import React from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import type { Activity, ActivityEntry } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import type { FiscalTermId } from '~/lib/fiscalGlossary';
import { SelectInput, TextInput } from '~/ui/Field';
import { IconButton } from '~/ui/Button';
import { cn } from '~/utils';

const ORDER: Activity[] = ['liberalSsi', 'liberalCipav', 'serviceBic', 'vente'];
const HELP: Record<Activity, FiscalTermId> = {
  vente: 'bicBnc',
  serviceBic: 'bicBnc',
  liberalSsi: 'ssi',
  liberalCipav: 'cipav',
};

function newId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const pctFr = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

interface ActivityListProps {
  activities: ActivityEntry[];
  onChange: (next: ActivityEntry[]) => void;
  max?: number;
}

/** Jusqu'à 4 activités déclarées, une primaire (taux URSSAF, abattement, seuil). */
export function ActivityList({ activities, onChange, max = 4 }: ActivityListProps) {
  const add = () => {
    if (activities.length >= max) return;
    const used = new Set(activities.map((a) => a.type));
    const type = ORDER.find((t) => !used.has(t)) ?? 'serviceBic';
    onChange([...activities, { id: newId(), type, isPrimary: false }]);
  };
  const remove = (id: string) => {
    const rest = activities.filter((a) => a.id !== id);
    if (rest.length > 0 && !rest.some((a) => a.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
    onChange(rest);
  };
  const patch = (id: string, p: Partial<ActivityEntry>) =>
    onChange(activities.map((a) => (a.id === id ? { ...a, ...p } : a)));
  const setPrimary = (id: string) => onChange(activities.map((a) => ({ ...a, isPrimary: a.id === id })));

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line">
        {activities.map((a, i) => {
          const params = ACTIVITY_PARAMS[a.type];
          return (
            <li key={a.id} className="py-3 first:pt-0">
              <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr]">
                <SelectInput
                  value={a.type}
                  onChange={(e) => patch(a.id, { type: e.target.value as Activity })}
                  aria-label={`Type de l'activité ${i + 1}`}
                >
                  {ORDER.map((t) => (
                    <option key={t} value={t}>
                      {ACTIVITY_PARAMS[t].label}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  value={a.label ?? ''}
                  onChange={(e) => patch(a.id, { label: e.target.value || undefined })}
                  placeholder={`Libellé, ex. ${params.hint.split(',')[0]}`}
                  aria-label={`Libellé de l'activité ${i + 1}`}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[14px] text-ink-2 tnum">
                  URSSAF {pctFr(params.urssafRate)} % · abattement {Math.round(params.abattement * 100)} % · plafond{' '}
                  {params.plafond.toLocaleString('fr-FR')} €
                  <HelpTooltip termId={HELP[a.type]} />
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPrimary(a.id)}
                    aria-pressed={a.isPrimary}
                    className={cn(
                      'inline-flex min-h-9 pointer-coarse:min-h-11 items-center gap-1.5 rounded-[var(--radius-ctl)] px-2.5 text-[14px] font-medium transition-colors',
                      a.isPrimary ? 'bg-ca-soft text-ca-ink' : 'text-ink-2 hover:bg-card-2 hover:text-ink',
                    )}
                  >
                    <Star className={cn('h-3.5 w-3.5', a.isPrimary && 'fill-current')} strokeWidth={1.75} aria-hidden="true" />
                    {a.isPrimary ? 'Activité principale' : 'Rendre principale'}
                  </button>
                  {activities.length > 1 && (
                    <IconButton label={`Supprimer l'activité ${a.label || params.label}`} size="sm" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    </IconButton>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {activities.length < max && (
        <button
          type="button"
          onClick={add}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-ctl)] border-2 border-dashed border-line-2 text-[15px] font-semibold text-ink-2 transition-colors hover:border-primary hover:text-ca-ink"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Ajouter une activité
        </button>
      )}
    </div>
  );
}
