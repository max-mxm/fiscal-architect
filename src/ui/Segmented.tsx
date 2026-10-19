import React, { useRef, type ReactNode } from 'react';
import { cn } from '~/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  /** Aplat de l'option choisie, dans la couleur de la famille qu'elle affiche (inline). */
  selectedClassName?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  label: string;
  layout?: 'inline' | 'stack';
  /** `pill` : piste blanche et options rondes, pour un sélecteur posé sur le fond d'écran. */
  shape?: 'segment' | 'pill';
  className?: string;
}

/** Groupe radio au clavier (flèches) : onglets arrondis, ou liste avec description. */
export function Segmented<T extends string>({ value, onChange, options, label, layout = 'inline', shape = 'segment', className }: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const move = (delta: number) => {
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
      className={cn(
        layout === 'stack'
          ? 'flex flex-col gap-2'
          : shape === 'pill'
            ? 'inline-flex gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-card)]'
            : 'inline-flex w-full gap-1 rounded-[var(--radius-ctl)] bg-card-2 p-1',
        className,
      )}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              'transition-[background-color,box-shadow,color] duration-150',
              layout === 'inline'
                ? cn(
                    'flex flex-1 items-center justify-center gap-1.5 px-3 text-[14px] font-semibold',
                    shape === 'pill' ? 'min-h-9 rounded-full pointer-coarse:min-h-11' : 'min-h-11 rounded-[4px]',
                    selected ? 'bg-card text-ink shadow-[0_1px_3px_rgb(20_24_52/0.14)]' : 'text-ink-2 hover:text-ink',
                    selected && opt.selectedClassName,
                  )
                : cn(
                    'flex min-h-14 items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 text-left',
                    selected ? 'border-primary bg-primary-soft' : 'border-line bg-card hover:border-line-2',
                  ),
            )}
          >
            {layout === 'stack' && (
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-primary' : 'border-line-3',
                )}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            )}
            {opt.icon}
            {layout === 'stack' ? (
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{opt.label}</span>
                {opt.description && <span className="mt-0.5 block text-[13px] text-ink-2">{opt.description}</span>}
              </span>
            ) : (
              <span>{opt.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
