import React from 'react';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { cn } from '~/utils';

export type GaugeTone = 'mint' | 'amber';
export type GaugeStatusKind = 'safe' | 'projected' | 'overflow';

interface ThresholdGaugeProps {
  realizedPct: number;
  projectedPct: number;
  tone: GaugeTone;
  status: {
    kind: GaugeStatusKind;
    label: string;
  };
  ariaLabel: string;
}

const TONE_BG: Record<GaugeTone, { projected: string; realized: string; legend: string }> = {
  mint: {
    projected: 'bg-secondary-container/45',
    realized: 'bg-secondary-container shadow-[0_0_12px_rgba(108,248,187,0.35)]',
    legend: 'text-secondary-container/70',
  },
  amber: {
    projected: 'bg-amber-300/40',
    realized: 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.35)]',
    legend: 'text-amber-200/70',
  },
};

const CHIP_BY_KIND: Record<GaugeStatusKind, string> = {
  safe: 'bg-secondary-container/15 text-secondary-container',
  projected: 'bg-amber-400/10 text-amber-200',
  overflow: 'bg-red-500/15 text-red-200',
};

export const ThresholdGauge: React.FC<ThresholdGaugeProps> = ({
  realizedPct,
  projectedPct,
  tone,
  status,
  ariaLabel,
}) => {
  const cls = TONE_BG[tone];
  const realized = Math.min(100, Math.max(0, realizedPct));
  const projected = Math.min(100, Math.max(0, projectedPct));

  return (
    <>
      <div className="mt-4 relative h-2.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', cls.projected)}
          style={{ width: `${projected}%` }}
          aria-hidden="true"
        />
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all', cls.realized)}
          style={{ width: `${realized}%` }}
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={Math.round(realized)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className={cn('mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold', cls.legend)}>
        <span>{Math.round(realized)}% réalisé</span>
        <span>{Math.round(projected)}% projeté</span>
      </div>
      <div className={cn('mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', CHIP_BY_KIND[status.kind])}>
        {status.kind === 'overflow' ? (
          <AlertTriangle className="w-3 h-3" />
        ) : (
          <CalendarClock className="w-3 h-3" />
        )}
        <span className="tracking-tight">{status.label}</span>
      </div>
    </>
  );
};
