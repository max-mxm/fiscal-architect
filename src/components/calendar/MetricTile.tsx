import React from 'react';
import { cn } from '~/utils';

interface MetricTileProps {
  label: string;
  /** Valeur déjà formatée (incluant le suffixe €/jours/etc.). */
  value: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'negative';
  size?: 'sm' | 'md' | 'lg';
}

const TONE_CLASSES: Record<NonNullable<MetricTileProps['tone']>, string> = {
  neutral: 'text-slate-900',
  positive: 'text-secondary',
  negative: 'text-red-500',
};

const SIZE_CLASSES: Record<NonNullable<MetricTileProps['size']>, string> = {
  sm: 'text-base font-headline',
  md: 'text-xl font-mono',
  lg: 'text-2xl font-mono',
};

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  tone = 'neutral',
  size = 'md',
}) => {
  return (
    <div>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={cn('font-black', SIZE_CLASSES[size], TONE_CLASSES[tone])}>{value}</div>
    </div>
  );
};
