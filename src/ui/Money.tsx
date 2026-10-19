import React, { useEffect, useRef, useState } from 'react';
import { formatEuro, formatInvoiceEuro } from '~/lib/format';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';
import { cn } from '~/utils';

const NBSP = ' ';

/** « 7 536 € » — espace insécable avant le symbole, partout pareil. */
export function eur(value: number, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const abs = Math.abs(value);
  const body = opts.cents ? formatInvoiceEuro(abs) : formatEuro(abs);
  const rounded = opts.cents ? abs : Math.round(abs);
  const negative = value < 0 && rounded !== 0;
  const prefix = negative ? '−' : opts.sign && rounded !== 0 ? '+' : '';
  return `${prefix}${body}${NBSP}€`;
}

/** « 25,6 % » */
export function pct(value: number, decimals = 1): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: decimals })}${NBSP}%`;
}

interface MoneyProps {
  value: number;
  cents?: boolean;
  sign?: boolean;
  /** Anime le passage d'une valeur à l'autre quand le montant change. */
  animate?: boolean;
  className?: string;
}

export function Money({ value, cents, sign, animate, className }: MoneyProps) {
  const shown = useAnimatedNumber(value, animate ? 420 : 0);
  return <span className={cn('tnum whitespace-nowrap', className)}>{eur(shown, { cents, sign })}</span>;
}

/** Interpolation exponentielle vers la nouvelle valeur, coupée en mouvement réduit. */
export function useAnimatedNumber(target: number, duration = 420): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const valueRef = useRef(target);
  valueRef.current = value;

  useEffect(() => {
    if (duration <= 0 || reduced) {
      setValue(target);
      return;
    }
    const from = valueRef.current;
    if (from === target) return;
    fromRef.current = from;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(t >= 1 ? target : from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return value;
}
