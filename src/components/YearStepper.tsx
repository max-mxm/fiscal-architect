import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { QuickEditModal } from '~/components/ui/QuickEditModal';
import { isYearEmpty } from '~/lib/yearLifecycle';
import { cn } from '~/utils';

interface YearStepperProps {
  years: number[];
  activeYear: number;
  /** Sélection directe d'une année déjà existante (depuis la modal liste). */
  onSelectYear: (year: number) => void;
  /** Demande de transition (popup gérée en amont via FiscalYearContext). */
  onRequestTransition: (targetYear: number) => void;
}

const stepButton = (disabled: boolean) =>
  cn(
    'inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all',
    'focus:outline-none focus:ring-2 focus:ring-secondary/30',
    disabled
      ? 'text-on-surface-variant/30 cursor-not-allowed'
      : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/10 active:scale-95',
  );

/**
 * Sélecteur d'année compact `‹ 2026 ›`. Les flèches naviguent entre années
 * existantes ; cliquer sur la flèche droite vers une année non encore créée
 * (ou vide) déclenche la popup de transition (via `onRequestTransition`).
 *
 * Tap sur l'année centrale : ouvre la liste complète (avec ajout d'années
 * éloignées). Identique sur mobile/tablette/desktop — déjà compact à 44px.
 */
export const YearStepper: React.FC<YearStepperProps> = ({
  years,
  activeYear,
  onSelectYear,
  onRequestTransition,
}) => {
  const [listOpen, setListOpen] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentSystemYear = useMemo(() => new Date().getFullYear(), []);

  const sortedYears = useMemo(() => [...years].sort((a, b) => b - a), [years]);
  const minKnown = years.length > 0 ? Math.min(...years) : activeYear;
  const maxKnown = years.length > 0 ? Math.max(...years) : activeYear;
  const hasPrev = years.some((y) => y < activeYear);
  const targetNext = activeYear + 1;
  const targetPrev = activeYear - 1;

  const goNext = () => {
    setDirection(1);
    onRequestTransition(targetNext);
  };

  const goPrev = () => {
    if (!hasPrev) return;
    setDirection(-1);
    onRequestTransition(targetPrev);
  };

  const handleListSelect = (year: number) => {
    setDirection(year > activeYear ? 1 : -1);
    onSelectYear(year);
    setListOpen(false);
  };

  const handleAdd = (year: number) => {
    setListOpen(false);
    setDirection(year > activeYear ? 1 : -1);
    onRequestTransition(year);
  };

  return (
    <>
      <div
        className="inline-flex items-center gap-0.5 rounded-2xl bg-surface-highest/40 p-0.5"
        role="group"
        aria-label="Sélecteur d'année"
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label={hasPrev ? `Aller à ${targetPrev}` : 'Aucune année antérieure'}
          className={stepButton(!hasPrev)}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setListOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Année ${activeYear}. Ouvrir la liste des années.`}
          className={cn(
            'relative px-3 min-w-[64px] h-10 rounded-xl inline-flex items-center justify-center gap-1.5',
            'bg-surface-lowest text-on-surface',
            'hover:bg-surface-lowest/80 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-secondary/30',
          )}
        >
          <span className="sr-only">Année active : {activeYear}</span>
          <div className="relative h-5 overflow-hidden flex items-center" aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={activeYear}
                initial={{ x: direction * 12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -12, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="text-sm font-bold tabular-nums"
              >
                {activeYear}
              </motion.span>
            </AnimatePresence>
          </div>
          {activeYear === currentSystemYear && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-secondary"
              aria-label="Année en cours"
            />
          )}
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label={`Aller à ${targetNext}`}
          className={stepButton(false)}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <QuickEditModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        title="Choisir une année"
        description="Naviguez vers une année déjà saisie ou créez-en une nouvelle."
      >
        <ul className="py-1 -mx-2">
          {sortedYears.map((y) => {
            const isActive = y === activeYear;
            const empty = !isActive && isYearEmpty(y);
            return (
              <li key={y}>
                <button
                  type="button"
                  onClick={() => handleListSelect(y)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between min-h-[44px]',
                    isActive
                      ? 'text-secondary bg-secondary/5'
                      : 'text-on-surface hover:bg-surface-highest/30',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{y}</span>
                    {y === currentSystemYear && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        En cours
                      </span>
                    )}
                    {empty && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                        Vide
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                      Active
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-outline-variant/20 mt-2 pt-2 -mx-2 space-y-1">
          <button
            type="button"
            onClick={() => handleAdd(minKnown - 1)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-highest/30 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Ajouter <span className="tabular-nums">{minKnown - 1}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAdd(maxKnown + 1)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-highest/30 transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              Ajouter <span className="tabular-nums">{maxKnown + 1}</span>
            </span>
          </button>
        </div>
      </QuickEditModal>
    </>
  );
};
