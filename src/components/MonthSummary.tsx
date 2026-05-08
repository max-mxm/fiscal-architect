import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '~/utils';
import { formatEuro, formatPercent } from '~/lib/format';
import { formatDaysFR } from '~/lib/calendar';
import { VLToggle } from '~/components/fiscal/VLToggle';

interface MonthSummaryProps {
  monthName: string;
  workedDaysEquiv: number;
  caMensuel: number;
  urssafMensuel: number;
  urssafRate: number;
  chargesFixesMensuelles: number;
  irMensuel: number;
  netMensuel: number;
  versementLiberatoire: boolean;
  /** Taux VL effectif (0..1) à afficher sur le chip — issu de l'activité courante. */
  tauxVL?: number;
  onToggleVL: (next: boolean) => void;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  monthName,
  workedDaysEquiv,
  caMensuel,
  urssafMensuel,
  urssafRate,
  chargesFixesMensuelles,
  irMensuel,
  netMensuel,
  versementLiberatoire,
  tauxVL,
  onToggleVL,
}) => {
  const [showIrInfo, setShowIrInfo] = useState(false);
  const tauxNet = caMensuel > 0 ? (netMensuel / caMensuel) * 100 : 0;
  const irLabel = versementLiberatoire
    ? `IR (VL ${tauxVL !== undefined ? (tauxVL * 100).toFixed(1).replace('.', ',') : '2,2'} %)`
    : 'IR estimé';

  return (
    <section
      aria-labelledby="month-summary-title"
      className="bg-surface-lowest rounded-3xl shadow-sm p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="month-summary-title" className="font-headline text-lg font-bold text-slate-900">
            {monthName}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
            {workedDaysEquiv > 0
              ? `${formatDaysFR(workedDaysEquiv)} jour${workedDaysEquiv > 1 ? 's' : ''} travaillé${workedDaysEquiv > 1 ? 's' : ''}`
              : 'Aucun jour sélectionné'}
          </p>
        </div>
        <VLToggle value={versementLiberatoire} onChange={onToggleVL} tauxVL={tauxVL} variant="chip" />
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant">CA brut</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {formatEuro(caMensuel)}€
          </span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant">URSSAF ({formatPercent(urssafRate)} %)</span>
          <span className="font-mono font-bold text-red-500 tabular-nums">
            −{formatEuro(urssafMensuel)}€
          </span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant">Charges fixes</span>
          <span className="font-mono font-bold text-red-500 tabular-nums">
            −{formatEuro(chargesFixesMensuelles)}€
          </span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant inline-flex items-center gap-1">
            {irLabel}
            <button
              type="button"
              onClick={() => setShowIrInfo((v) => !v)}
              aria-label="À propos de l'IR mensualisé"
              aria-expanded={showIrInfo}
              className="text-slate-500 hover:text-secondary transition-colors p-0.5 rounded"
            >
              <Info className="w-3 h-3" />
            </button>
          </span>
          <span className="font-mono font-bold text-red-500 tabular-nums">
            −{formatEuro(irMensuel)}€
          </span>
        </li>
        {showIrInfo && (
          <li className="text-[11px] text-on-surface-variant bg-surface-highest/30 rounded-lg px-3 py-2 leading-relaxed">
            Estimation mensualisée — l'impôt sur le revenu est payé annuellement sur la base d'une projection ×12.
          </li>
        )}
      </ul>

      <div className="pt-3 border-t border-outline-variant/15 flex justify-between items-baseline">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Net après charges
        </span>
        <div className="text-right">
          <span className="font-headline font-black text-2xl text-secondary font-mono tabular-nums">
            {formatEuro(netMensuel)}€
          </span>
          <p
            className={cn(
              'text-[11px] font-bold mt-0.5 font-mono',
              tauxNet >= 60 ? 'text-secondary' : tauxNet >= 40 ? 'text-amber-600' : 'text-red-500',
            )}
          >
            taux de rétention {formatPercent(tauxNet)} %
          </p>
        </div>
      </div>
    </section>
  );
};
