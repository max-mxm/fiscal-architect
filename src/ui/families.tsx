import React, { type ReactNode } from 'react';
import { cn } from '~/utils';

/**
 * Familles de données : chaque type de montant garde la même couleur dans
 * toute l'application. La TVA (et le TTC) a sa couleur à elle, le violet.
 */
export type Family = 'net' | 'ca' | 'tva' | 'cot' | 'impot' | 'charges' | 'alert' | 'warn';

interface FamilyStyle {
  /** Pastille ou aplat plein. */
  fill: string;
  /** Fond teinté + texte lisible. */
  soft: string;
  /** Texte coloré lisible sur carte blanche. */
  ink: string;
  dot: string;
  border: string;
  /** Valeur CSS de l'aplat, pour SVG et curseurs. */
  color: string;
  /** Texte posé sur l'aplat (SVG). */
  onColor: string;
  /** Texte coloré lisible sur carte (SVG). */
  inkColor: string;
}

export const FAMILY: Record<Family, FamilyStyle> = {
  net: { fill: 'bg-net text-net-on', soft: 'bg-net-soft text-net-ink', ink: 'text-net-ink', dot: 'bg-net', border: 'border-net', color: 'var(--color-net)', onColor: 'var(--color-net-on)', inkColor: 'var(--color-net-ink)' },
  ca: { fill: 'bg-ca text-ca-on', soft: 'bg-ca-soft text-ca-ink', ink: 'text-ca-ink', dot: 'bg-ca', border: 'border-ca', color: 'var(--color-ca)', onColor: 'var(--color-ca-on)', inkColor: 'var(--color-ca-ink)' },
  tva: { fill: 'bg-tva-strong text-tva-on', soft: 'bg-tva-soft text-tva-ink', ink: 'text-tva-ink', dot: 'bg-tva', border: 'border-tva', color: 'var(--color-tva)', onColor: 'var(--color-tva-on)', inkColor: 'var(--color-tva-ink)' },
  cot: { fill: 'bg-cot text-cot-on', soft: 'bg-cot-soft text-cot-ink', ink: 'text-cot-ink', dot: 'bg-cot', border: 'border-cot', color: 'var(--color-cot)', onColor: 'var(--color-cot-on)', inkColor: 'var(--color-cot-ink)' },
  impot: { fill: 'bg-impot text-impot-on', soft: 'bg-impot-soft text-impot-ink', ink: 'text-impot-ink', dot: 'bg-impot', border: 'border-impot', color: 'var(--color-impot)', onColor: 'var(--color-impot-on)', inkColor: 'var(--color-impot-ink)' },
  charges: { fill: 'bg-charges text-charges-on', soft: 'bg-charges-soft text-charges-ink', ink: 'text-charges-ink', dot: 'bg-charges', border: 'border-charges', color: 'var(--color-charges)', onColor: 'var(--color-charges-on)', inkColor: 'var(--color-charges-ink)' },
  alert: { fill: 'bg-alert-strong text-alert-on', soft: 'bg-alert-soft text-alert-ink', ink: 'text-alert-ink', dot: 'bg-alert', border: 'border-alert', color: 'var(--color-alert)', onColor: 'var(--color-alert-on)', inkColor: 'var(--color-alert-ink)' },
  warn: { fill: 'bg-warn text-warn-on', soft: 'bg-warn-soft text-warn-ink', ink: 'text-warn-ink', dot: 'bg-warn', border: 'border-warn', color: 'var(--color-warn)', onColor: 'var(--color-warn-on)', inkColor: 'var(--color-warn-ink)' },
};

export function Dot({ family, className }: { family: Family; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', FAMILY[family].dot, className)} />;
}

/** Étiquette de statut façon tableau coloré : pleine ou teintée. */
export function Pill({
  family,
  children,
  variant = 'soft',
  className,
}: {
  family: Family;
  children: ReactNode;
  variant?: 'soft' | 'solid';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold',
        variant === 'solid' ? FAMILY[family].fill : FAMILY[family].soft,
        className,
      )}
    >
      {children}
    </span>
  );
}
