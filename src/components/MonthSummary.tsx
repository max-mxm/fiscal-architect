import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '~/utils';
import { formatEuro, formatPercent } from '~/lib/format';
import { formatDaysFR } from '~/lib/calendar';
import { VLToggle } from '~/components/fiscal/VLToggle';
import { EditableField } from '~/components/ui/EditableField';
import { QuickEditModal } from '~/components/ui/QuickEditModal';
import { FixedCostsList } from '~/components/fiscal/FixedCostsList';
import type { UserProfile } from '~/types';

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
  /** CFP mensuel (€). Affiché si > 0. */
  cfpMensuel: number;
  /** Taux CFP en pourcentage (0..1) — utilisé pour le label. */
  cfpRate: number;
  /** Taxe consulaire mensuelle (€). Cachée si = 0. */
  taxeConsulaireMensuelle: number;
  /** Taux taxe consulaire (0..1). */
  taxeConsulaireRate: number;
  /** Réduction ACRE mensuelle déduite de l'URSSAF (€). 0 si non applicable. */
  acreReductionMensuelle: number;
  /** Taux ACRE appliqué (0, 0.25 ou 0.5). */
  acreRate: number;
  /** Charges fixes du profil — éditables via popup au clic sur la ligne. */
  costs: UserProfile['fixedCosts'];
  onCostsChange: (next: UserProfile['fixedCosts']) => void;
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
  cfpMensuel,
  cfpRate,
  taxeConsulaireMensuelle,
  taxeConsulaireRate,
  acreReductionMensuelle,
  acreRate,
  costs,
  onCostsChange,
}) => {
  const [showIrInfo, setShowIrInfo] = useState(false);
  const [showAcreInfo, setShowAcreInfo] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  const tauxNet = caMensuel > 0 ? (netMensuel / caMensuel) * 100 : 0;
  const irLabel = versementLiberatoire
    ? `IR (VL ${tauxVL !== undefined ? (tauxVL * 100).toFixed(1).replace('.', ',') : '2,2'} %)`
    : 'IR estimé';
  const acreActive = acreReductionMensuelle > 0 && acreRate > 0;
  const acrePct = Math.round(acreRate * 100);
  const taxeConsulaireVisible = taxeConsulaireRate > 0;

  return (
    <section
      aria-labelledby="month-summary-title"
      className="bg-surface-lowest rounded-3xl shadow-sm p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="month-summary-title" className="font-headline text-lg font-bold text-on-surface">
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
          <span className="font-mono font-bold text-on-surface tabular-nums">
            {formatEuro(caMensuel)}€
          </span>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant inline-flex items-center gap-1">
            URSSAF ({formatPercent(urssafRate)} %)
            {acreActive && (
              <>
                <span className="text-secondary font-bold"> · ACRE −{acrePct} %</span>
                <button
                  type="button"
                  onClick={() => setShowAcreInfo((v) => !v)}
                  aria-label="À propos de la réduction ACRE"
                  aria-expanded={showAcreInfo}
                  className="text-on-surface-variant hover:text-secondary transition-colors p-0.5 rounded"
                >
                  <Info className="w-3 h-3" />
                </button>
              </>
            )}
          </span>
          <span className="font-mono font-bold text-red-500 tabular-nums">
            −{formatEuro(urssafMensuel)}€
          </span>
        </li>
        {showAcreInfo && (
          <li className="text-[11px] text-on-surface-variant bg-surface-highest/30 rounded-lg px-3 py-2 leading-relaxed">
            Réduction ACRE de {acrePct} % sur l'URSSAF, applicable pendant 12 mois après la création de l'activité.
          </li>
        )}
        {cfpMensuel > 0 && (
          <li className="flex justify-between items-center">
            <span className="text-on-surface-variant">CFP ({formatPercent(cfpRate * 100, 2)} %)</span>
            <span className="font-mono font-bold text-red-500 tabular-nums">
              −{formatEuro(cfpMensuel)}€
            </span>
          </li>
        )}
        {taxeConsulaireVisible && (
          <li className="flex justify-between items-center">
            <span className="text-on-surface-variant">Taxe consulaire ({formatPercent(taxeConsulaireRate * 100, 3)} %)</span>
            <span className="font-mono font-bold text-red-500 tabular-nums">
              −{formatEuro(taxeConsulaireMensuelle)}€
            </span>
          </li>
        )}
        <li>
          <EditableField
            ariaLabel="Modifier les charges fixes mensuelles"
            onClick={() => setEditingCosts(true)}
            className="flex justify-between items-center px-1 py-0.5 -mx-1"
          >
            <span className="flex justify-between items-center w-full">
              <span className="text-on-surface-variant">Charges fixes</span>
              <span className="font-mono font-bold text-red-500 tabular-nums">
                −{formatEuro(chargesFixesMensuelles)}€
              </span>
            </span>
          </EditableField>
        </li>
        <li className="flex justify-between items-center">
          <span className="text-on-surface-variant inline-flex items-center gap-1">
            {irLabel}
            <button
              type="button"
              onClick={() => setShowIrInfo((v) => !v)}
              aria-label="À propos de l'IR mensualisé"
              aria-expanded={showIrInfo}
              className="text-on-surface-variant hover:text-secondary transition-colors p-0.5 rounded"
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

      <QuickEditModal
        open={editingCosts}
        onClose={() => setEditingCosts(false)}
        title="Charges fixes mensuelles"
        description="Vos abonnements et frais récurrents — déduits du net pour estimer votre revenu réel."
      >
        <FixedCostsList costs={costs} onChange={onCostsChange} />
      </QuickEditModal>

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
