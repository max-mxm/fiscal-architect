import React, { useId, type ReactNode } from 'react';
import { FAMILY, type Family } from '~/ui/families';
import { cn } from '~/utils';

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Couleur de la famille concernée quand l'option est active (TVA en violet…). */
  family?: Family;
  adornment?: ReactNode;
  className?: string;
}

/** Interrupteur arrondi, coloré selon la famille de donnée qu'il change. */
export function Switch({ checked, onChange, label, description, disabled, family, adornment, className }: SwitchProps) {
  const id = useId();
  const descId = useId();
  const on = family ? FAMILY[family].dot : 'bg-primary';
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className={cn('text-[15px] font-semibold text-ink', disabled && 'text-ink-3')}>
            {label}
          </label>
          {adornment}
        </div>
        {description && (
          <div id={descId} className="mt-0.5 text-[13px] leading-snug text-ink-2 text-pretty">
            {description}
          </div>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? on : 'bg-line-3',
          disabled && 'cursor-not-allowed opacity-45',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_3px_rgb(20_24_52/0.3)] transition-[left] duration-200 ease-[var(--ease-out-expo)]',
            checked ? 'left-[24px]' : 'left-[4px]',
          )}
        />
      </button>
    </div>
  );
}
