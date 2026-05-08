import React, { type ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '~/utils';

interface EditableFieldProps {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  /**
   * Place de l'icône :
   * - 'inline' : à droite du contenu (ligne flex)
   * - 'overlay' : en absolu en haut-droite (n'affecte pas le layout enfant)
   */
  iconPlacement?: 'inline' | 'overlay';
  className?: string;
}

/**
 * Wrapper cliquable signalant qu'une zone est modifiable.
 * Rend un button avec un focus ring + une icône Pencil discrète :
 * - Desktop : visible au hover/focus
 * - Mobile : toujours visible (pas de hover en touch)
 */
export const EditableField: React.FC<EditableFieldProps> = ({
  onClick,
  ariaLabel,
  children,
  iconPlacement = 'inline',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'group relative w-full text-left rounded-lg transition-colors',
        'hover:bg-surface-highest/30 active:bg-surface-highest/50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30',
        iconPlacement === 'inline' && 'flex items-center gap-2',
        className,
      )}
    >
      <span className={iconPlacement === 'inline' ? 'flex-1 min-w-0' : 'block'}>{children}</span>
      <Pencil
        aria-hidden="true"
        className={cn(
          'shrink-0 text-on-surface-variant transition-opacity',
          // Mobile : toujours visible. Desktop : au hover ou au focus.
          'w-3 h-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100',
          iconPlacement === 'overlay' && 'absolute top-2 right-2',
        )}
      />
    </button>
  );
};
