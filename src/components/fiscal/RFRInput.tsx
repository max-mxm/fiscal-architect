import React from 'react';
import { Info } from 'lucide-react';
import { VL_RFR_PLAFOND_PER_PART, calcVLEligibility } from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';
import { cn } from '~/utils';

interface RFRInputProps {
  rfrN2: number | undefined;
  partsFiscales: number;
  onRFRChange: (next: number | undefined) => void;
  onPartsChange: (next: number) => void;
}

export const RFRInput: React.FC<RFRInputProps> = ({ rfrN2, partsFiscales, onRFRChange, onPartsChange }) => {
  const eligibility = calcVLEligibility(rfrN2, partsFiscales);
  const showStatus = rfrN2 !== undefined && rfrN2 >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label
            htmlFor="rfr-input"
            className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Revenu fiscal de référence N-2
          </label>
          <div className="flex items-baseline gap-1">
            <input
              id="rfr-input"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              placeholder="—"
              value={rfrN2 ?? ''}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v === '') {
                  onRFRChange(undefined);
                  return;
                }
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 0) onRFRChange(n);
              }}
              className="font-mono font-bold text-base text-on-surface bg-surface-lowest border border-outline-variant rounded-lg w-full py-2 px-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none min-h-[44px]"
            />
            <span className="text-secondary font-bold text-sm">€</span>
          </div>
        </div>
        <div>
          <label
            htmlFor="parts-input"
            className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Parts
          </label>
          <input
            id="parts-input"
            type="number"
            inputMode="decimal"
            min={1}
            max={10}
            step={0.5}
            value={partsFiscales}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= 1) onPartsChange(v);
            }}
            className="font-mono font-bold text-base text-on-surface bg-surface-lowest border border-outline-variant rounded-lg w-20 py-2 px-3 focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none min-h-[44px] text-center"
          />
        </div>
      </div>

      {showStatus ? (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl px-3 py-2 text-[11px] leading-relaxed',
            eligibility.eligible
              ? 'bg-secondary-container/15 text-secondary border border-secondary/20'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
          )}
        >
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {eligibility.eligible ? (
              <>Éligible au versement libératoire — RFR sous le plafond <strong>{formatEuro(eligibility.threshold)}€</strong>.</>
            ) : (
              <>Inéligible au VL : RFR supérieur au plafond <strong>{formatEuro(eligibility.threshold)}€</strong> ({partsFiscales} part{partsFiscales > 1 ? 's' : ''}).</>
            )}
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          Plafond {formatEuro(VL_RFR_PLAFOND_PER_PART)}€ par part. Renseignez votre RFR N-2 (avis d'imposition) pour vérifier l'éligibilité au VL.
        </p>
      )}
    </div>
  );
};
