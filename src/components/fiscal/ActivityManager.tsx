import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Wrench, Briefcase, Scale, Plus, Trash2, Star } from 'lucide-react';
import type { Activity, ActivityEntry } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import { cn } from '~/utils';

interface ActivityManagerProps {
  activities: ActivityEntry[];
  onChange: (next: ActivityEntry[]) => void;
  /** Plafond maximal d'activités (défaut 4 — au-delà la maintenance est trop lourde). */
  max?: number;
}

const ICONS: Record<Activity, React.ComponentType<{ className?: string }>> = {
  vente: Package,
  serviceBic: Wrench,
  liberalSsi: Briefcase,
  liberalCipav: Scale,
};

const ACTIVITY_ORDER: Activity[] = ['vente', 'serviceBic', 'liberalSsi', 'liberalCipav'];

function newId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const ActivityManager: React.FC<ActivityManagerProps> = ({ activities, onChange, max = 4 }) => {
  const handleAdd = useCallback(() => {
    if (activities.length >= max) return;
    const used = new Set(activities.map((a) => a.type));
    const nextType = ACTIVITY_ORDER.find((t) => !used.has(t)) ?? 'serviceBic';
    onChange([
      ...activities,
      { id: newId(), type: nextType, isPrimary: false },
    ]);
  }, [activities, max, onChange]);

  const handleRemove = useCallback(
    (id: string) => {
      const remaining = activities.filter((a) => a.id !== id);
      // S'assurer qu'il reste au moins une primaire
      if (remaining.length > 0 && !remaining.some((a) => a.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      onChange(remaining);
    },
    [activities, onChange],
  );

  const handlePatch = useCallback(
    (id: string, patch: Partial<ActivityEntry>) => {
      onChange(activities.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [activities, onChange],
  );

  const handleSetPrimary = useCallback(
    (id: string) => {
      onChange(activities.map((a) => ({ ...a, isPrimary: a.id === id })));
    },
    [activities, onChange],
  );

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {activities.map((activity) => {
          const params = ACTIVITY_PARAMS[activity.type];
          const Icon = ICONS[activity.type];
          const canRemove = activities.length > 1;
          return (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  'rounded-2xl border p-3 transition-colors',
                  activity.isPrimary
                    ? 'border-secondary bg-secondary/5'
                    : 'border-outline-variant/30 bg-surface-lowest',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      activity.isPrimary ? 'bg-secondary/10 text-secondary' : 'bg-surface-highest/60 text-on-surface-variant',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <select
                      value={activity.type}
                      onChange={(e) => handlePatch(activity.id, { type: e.target.value as Activity })}
                      aria-label="Type d'activité"
                      className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2 px-2 text-sm font-bold text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary min-h-[40px]"
                    >
                      {ACTIVITY_ORDER.map((t) => (
                        <option key={t} value={t}>
                          {ACTIVITY_PARAMS[t].label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={activity.label ?? ''}
                      onChange={(e) => handlePatch(activity.id, { label: e.target.value || undefined })}
                      placeholder={`ex. ${params.hint.split(',')[0]}`}
                      aria-label="Libellé de l'activité"
                      className="w-full bg-surface-lowest border border-outline-variant rounded-lg py-2 px-2 text-sm text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary min-h-[40px]"
                    />
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-on-surface-variant tabular-nums font-mono">
                        URSSAF {params.urssafRate.toFixed(1).replace('.', ',')} % · plafond {(params.plafond / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k€
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(activity.id)}
                          aria-pressed={activity.isPrimary}
                          aria-label={activity.isPrimary ? 'Activité primaire' : 'Définir comme primaire'}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-colors min-h-[32px]',
                            activity.isPrimary
                              ? 'bg-secondary text-on-secondary'
                              : 'bg-surface-highest/40 text-on-surface-variant hover:bg-surface-highest/60',
                          )}
                        >
                          <Star className={cn('w-3 h-3', activity.isPrimary && 'fill-current')} />
                          {activity.isPrimary ? 'Primaire' : 'Définir primaire'}
                        </button>
                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => handleRemove(activity.id)}
                            aria-label={`Supprimer l'activité ${params.label}`}
                            className="text-on-surface-variant hover:text-red-500 p-1.5 min-h-[32px] rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activities.length < max && (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 text-secondary text-sm font-bold hover:bg-secondary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter une activité
        </button>
      )}
    </div>
  );
};
