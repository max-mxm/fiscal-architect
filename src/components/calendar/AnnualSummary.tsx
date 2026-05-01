import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatEuro } from '~/lib/format';
import { MetricTile } from './MetricTile';

interface AnnualSummaryProps {
  caCumule: number;
  netAvantIR: number;
  netApresIR: number;
}

export const AnnualSummary: React.FC<AnnualSummaryProps> = ({ caCumule, netAvantIR, netApresIR }) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-secondary" /> Annuel cumulé
      </h4>
      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="CA brut" value={`${formatEuro(caCumule)}€`} size="sm" />
        <MetricTile
          label="Net avant IR"
          value={`${formatEuro(netAvantIR)}€`}
          tone={netAvantIR >= 0 ? 'positive' : 'negative'}
          size="sm"
        />
        <MetricTile
          label="Net après IR"
          value={`${formatEuro(netApresIR)}€`}
          tone={netApresIR >= 0 ? 'positive' : 'negative'}
          size="sm"
        />
      </div>
    </div>
  );
};
