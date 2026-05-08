import React, { useState } from 'react';
import { Calendar, ChevronDown, Plus } from 'lucide-react';
import { QuickEditModal } from '~/components/ui/QuickEditModal';
import { cn } from '~/utils';

interface YearSwitcherProps {
  years: number[];
  activeYear: number;
  onSelect: (year: number) => void;
  onAdd: (year: number) => void;
}

/**
 * Sélecteur d'année — chip déclencheur dans `FiscalContextBar`. À l'ouverture,
 * affiche une popup (bottom sheet mobile / modale centrée desktop, via
 * `QuickEditModal`) qui liste les années saisies + permet d'ajouter la
 * suivante / la précédente. La création d'année déclenche automatiquement le
 * clone de config (cf. `useYearConfig`).
 */
export const YearSwitcher: React.FC<YearSwitcherProps> = ({
  years,
  activeYear,
  onSelect,
  onAdd,
}) => {
  const [open, setOpen] = useState(false);

  const sortedYears = [...years].sort((a, b) => b - a);
  const minKnown = years.length > 0 ? Math.min(...years) : activeYear;
  const maxKnown = years.length > 0 ? Math.max(...years) : activeYear;
  const nextYear = maxKnown + 1;
  const prevYear = minKnown - 1;

  const handleSelect = (year: number) => {
    onSelect(year);
    setOpen(false);
  };
  const handleAddNext = () => {
    onAdd(nextYear);
    onSelect(nextYear);
    setOpen(false);
  };
  const handleAddPrev = () => {
    onAdd(prevYear);
    onSelect(prevYear);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Année ${activeYear}. Cliquer pour changer.`}
        className={cn(
          'group inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[32px]',
          'rounded-full bg-surface-highest/40 hover:bg-secondary/10',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Année
        </span>
        <span className="text-xs font-bold text-on-surface tabular-nums">
          {activeYear}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-on-surface-variant transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      <QuickEditModal
        open={open}
        onClose={() => setOpen(false)}
        title="Choisir une année"
        description="Sélectionnez l'année à consulter ou ajoutez-en une nouvelle."
      >
        <ul className="py-1 -mx-2">
          {sortedYears.map((y) => (
            <li key={y}>
              <button
                type="button"
                onClick={() => handleSelect(y)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between min-h-[44px]',
                  y === activeYear
                    ? 'text-secondary bg-secondary/5'
                    : 'text-on-surface hover:bg-surface-highest/30',
                )}
              >
                <span className="tabular-nums">{y}</span>
                {y === activeYear && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Active
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-outline-variant/20 mt-2 pt-2 -mx-2 space-y-1">
          <button
            type="button"
            onClick={handleAddPrev}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-highest/30 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter <span className="tabular-nums">{prevYear}</span></span>
          </button>
          <button
            type="button"
            onClick={handleAddNext}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-highest/30 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter <span className="tabular-nums">{nextYear}</span></span>
          </button>
        </div>
      </QuickEditModal>
    </>
  );
};
