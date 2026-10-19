import React from 'react';
import { Money, eur } from '~/ui/Money';
import { FAMILY, type Family } from '~/ui/families';
import { cn } from '~/utils';

export interface SplitSegment {
  family: Family;
  label: string;
  value: number;
}

interface SplitBarProps {
  /** Segments qui s'additionnent au CA hors taxes (net compris). */
  segments: SplitSegment[];
  /** TVA collectée, montrée à part : elle s'ajoute au CA sans en faire partie. */
  tva?: number;
  caption?: string;
  emptyLabel?: string;
  /** Masque la légende du net (déjà affiché à côté). */
  hideNetInLegend?: boolean;
  className?: string;
}

/** Barre empilée aux couleurs des familles, avec sa légende en pastilles. */
export function SplitBar({ segments, tva = 0, caption, emptyLabel, hideNetInLegend, className }: SplitBarProps) {
  const visible = segments.filter((s) => s.value > 0);
  const base = visible.reduce((s, x) => s + x.value, 0);
  const total = base + Math.max(0, tva);
  const w = (v: number) => `${total > 0 ? (v / total) * 100 : 0}%`;
  const legend = [...visible.filter((s) => !(hideNetInLegend && s.family === 'net')), ...(tva > 0 ? [{ family: 'tva' as Family, label: 'TVA', value: tva }] : [])];

  if (base <= 0) {
    return (
      <div className={cn('flex h-full min-h-24 items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-line-2 px-4 text-center text-[14px] text-ink-2', className)}>
        {emptyLabel ?? 'Rien à répartir pour l’instant.'}
      </div>
    );
  }

  return (
    <div className={className}>
      {caption && <p className="mb-2 text-[14px] font-semibold text-ink-2">{caption}</p>}
      <div
        className="flex h-4 w-full gap-[3px]"
        role="img"
        aria-label={`${segments.map((s) => `${s.label} ${eur(s.value)}`).join(', ')}${tva > 0 ? `, plus TVA ${eur(tva)}` : ''}.`}
      >
        {visible.map((s, i) => (
          <span
            key={s.family + s.label}
            className={cn(
              'h-full transition-[width] duration-500 ease-[var(--ease-out-expo)]',
              FAMILY[s.family].dot,
              i === 0 && 'rounded-l-full',
              i === visible.length - 1 && tva <= 0 && 'rounded-r-full',
            )}
            style={{ width: w(s.value) }}
          />
        ))}
        {tva > 0 && (
          <span className="ml-1 h-full rounded-r-full bg-tva transition-[width] duration-500 ease-[var(--ease-out-expo)]" style={{ width: w(tva) }} />
        )}
      </div>
      <dl className="mt-2.5 grid grid-cols-4 gap-x-2 gap-y-2 sm:gap-x-3">
        {legend.map((s) => (
          <div key={s.family + s.label} className="min-w-0">
            <dt className="flex items-center gap-1 text-[12px] font-medium text-ink-2 sm:gap-1.5 sm:text-[13px]">
              <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5', FAMILY[s.family].dot)} />
              <span className="truncate">{s.label}</span>
            </dt>
            <dd className={cn('text-[15px] font-bold tnum sm:text-[17px]', s.family === 'tva' ? FAMILY.tva.ink : s.family === 'net' ? FAMILY.net.ink : 'text-ink')}>
              <Money value={s.family === 'net' || s.family === 'tva' ? s.value : -s.value} sign={s.family === 'tva'} animate />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
