import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { formatEuro } from '~/lib/format';
import { cn } from '~/utils';
import { HelpTooltip } from '~/components/ui/HelpTooltip';
import { Link } from '@tanstack/react-router';
import { VL_OFFICIAL_GUIDE_URL, calcVLEligibilityForYear, getVLRfrThresholdPerPart } from '~/lib/vlEligibility';

interface RFRInputProps {
  rfrN2: number | null;
  partsFiscales: number;
  onRFRChange: (next: number | null) => void;
  onPartsChange: (next: number) => void;
  showRegularizationAction?: boolean;
  year: number;
}

export const RFRInput: React.FC<RFRInputProps> = ({ rfrN2, partsFiscales, onRFRChange, onPartsChange, showRegularizationAction = false, year }) => {
  const eligibility = calcVLEligibilityForYear(rfrN2, partsFiscales, year);
  const thresholdPerPart = getVLRfrThresholdPerPart(year);
  const showStatus = rfrN2 !== null && rfrN2 >= 0;
  const helpId = `rfr-help-${year}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label
              htmlFor="rfr-input"
              className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Revenu fiscal de référence (RFR) · revenus {eligibility.rfrYear}
            </label>
            <HelpTooltip termId="rfr" />
          </div>
          <div className="flex items-baseline gap-1">
            <input
              id="rfr-input"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              placeholder="—"
              value={rfrN2 ?? ''}
              aria-describedby={helpId}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v === '') {
                  onRFRChange(null);
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
          <div className="flex items-center gap-1.5 mb-1.5">
            <label
              htmlFor="parts-input"
              className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
            >
              Parts
            </label>
            <HelpTooltip termId="parts" />
          </div>
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
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            {eligibility.eligible ? (
              <>Éligible au versement libératoire pour {year} — votre revenu fiscal de référence {eligibility.rfrYear} reste sous le plafond de <strong>{formatEuro(eligibility.threshold)}€</strong>.</>
            ) : (
              <>
                <span>Inéligible au versement libératoire pour {year} : votre revenu fiscal de référence {eligibility.rfrYear} dépasse le plafond de <strong>{formatEuro(eligibility.threshold)}€</strong> ({partsFiscales} part{partsFiscales > 1 ? 's' : ''}).</span>
                {showRegularizationAction && (
                  <Link
                    to="/regularisation-vl"
                    className="mt-2 inline-flex min-h-[36px] items-center rounded-lg border border-current/25 px-3 py-2 font-bold hover:bg-red-100/70 dark:hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-colors"
                  >
                    Estimer le rattrapage
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      <div id={helpId} className="rounded-xl bg-surface-low px-3 py-3 text-[13px] leading-relaxed text-on-surface-variant">
        <p>
          Pour l’année fiscale <strong className="text-on-surface">{year}</strong>, saisissez le <strong className="text-on-surface">revenu fiscal de référence {eligibility.rfrYear}</strong>, indiqué sur votre avis d’impôt reçu en {eligibility.taxNoticeYear}.
        </p>
        <p className="mt-1.5">
          Plafond {thresholdPerPart.known ? 'officiel' : 'indicatif, dernier seuil connu'} : <strong className="text-on-surface">{formatEuro(thresholdPerPart.amount)} € par part</strong>.
        </p>
        <a
          href={VL_OFFICIAL_GUIDE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 py-1 font-bold text-secondary underline decoration-secondary/30 underline-offset-2 hover:decoration-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30"
        >
          Consulter les conditions sur impots.gouv.fr
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(s’ouvre dans un nouvel onglet)</span>
        </a>
      </div>
    </div>
  );
};
