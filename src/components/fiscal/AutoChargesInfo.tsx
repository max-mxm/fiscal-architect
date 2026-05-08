import React from 'react';
import type { Activity } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import { formatPercent } from '~/lib/format';

interface AutoChargesInfoProps {
  activity: Activity;
}

export const AutoChargesInfo: React.FC<AutoChargesInfoProps> = ({ activity }) => {
  const params = ACTIVITY_PARAMS[activity];
  const cfpPct = params.cfpRate * 100;
  const taxePct = params.taxeConsulaireRate * 100;
  const exonere = params.taxeConsulaireRate === 0;

  return (
    <div className="flex flex-wrap gap-2 text-[11px] font-mono tabular-nums">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-highest/40 text-on-surface-variant">
        <span className="font-bold uppercase tracking-wider">CFP</span>
        <span>{formatPercent(cfpPct)} %</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-highest/40 text-on-surface-variant">
        <span className="font-bold uppercase tracking-wider">Taxe consulaire</span>
        <span>{exonere ? 'exonéré' : `${formatPercent(taxePct)} %`}</span>
      </span>
    </div>
  );
};
