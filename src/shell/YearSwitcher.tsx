import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Dialog } from '~/ui/Dialog';
import { isYearEmpty } from '~/lib/yearLifecycle';
import { cn } from '~/utils';

interface YearSwitcherProps {
  years: number[];
  activeYear: number;
  onSelectYear: (year: number) => void;
  onRequestTransition: (year: number) => void;
  className?: string;
}

/** « 2026 ▾ » sur le tirage ; ouvre la liste des années et l'ajout d'une année. */
export function YearSwitcher({ years, activeYear, onSelectYear, onRequestTransition, className }: YearSwitcherProps) {
  const [open, setOpen] = useState(false);
  const systemYear = useMemo(() => new Date().getFullYear(), []);
  const sorted = useMemo(() => [...years].sort((a, b) => b - a), [years]);
  const min = years.length ? Math.min(...years) : activeYear;
  const max = years.length ? Math.max(...years) : activeYear;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Année ${activeYear}. Changer d'année`}
        className={cn(
          'inline-flex h-11 items-center gap-1 rounded-full px-3 text-[17px] font-extrabold text-ink tnum',
          'hover:bg-card-2 transition-colors',
          className,
        )}
      >
        {activeYear}
        <ChevronDown className="h-4 w-4 text-ink-3" strokeWidth={2.25} aria-hidden="true" />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Année fiscale"
        description="Chaque année garde son calendrier et ses paramètres."
        size="sm"
      >
        <ul className="space-y-1">
          {sorted.map((y) => {
            const active = y === activeYear;
            const empty = !active && isYearEmpty(y);
            return (
              <li key={y}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectYear(y);
                    setOpen(false);
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--radius-ctl)] px-3 text-left transition-colors',
                    active ? 'bg-primary-soft' : 'hover:bg-card-2',
                  )}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="text-[17px] font-bold tnum text-ink">{y}</span>
                    {y === systemYear && <span className="rounded-full bg-net-soft px-2 py-0.5 text-[12px] font-semibold text-net-ink">en cours</span>}
                    {empty && <span className="text-[13px] text-ink-3">vide</span>}
                  </span>
                  {active && <Check className="h-4 w-4 text-ca-ink" strokeWidth={2.5} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[min - 1, max + 1].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setOpen(false);
                onRequestTransition(y);
              }}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-ctl)] border border-dashed border-line-2 text-[14px] font-semibold text-ink-2 hover:border-primary hover:text-ca-ink transition-colors"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Ajouter <span className="tnum">{y}</span>
            </button>
          ))}
        </div>
      </Dialog>
    </>
  );
}
