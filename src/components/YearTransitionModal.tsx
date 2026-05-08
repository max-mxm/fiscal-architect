import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Sparkles, Calendar, Wallet, Briefcase, Check, ShieldCheck } from 'lucide-react';
import { QuickEditModal } from '~/components/ui/QuickEditModal';
import { buildDefaultYearConfig, getLegalParamsForYear } from '~/constants';
import { previewInheritedConfig } from '~/lib/yearLifecycle';
import { formatEuro } from '~/lib/format';
import { cn } from '~/utils';
import type { YearConfig } from '~/types';
import type { YearTransitionMode } from '~/context/FiscalYearContext';

interface YearTransitionModalProps {
  open: boolean;
  targetYear: number;
  sourceYear: number | null;
  onConfirm: (mode: YearTransitionMode) => void;
  onCancel: () => void;
}

interface CardProps {
  selected: boolean;
  onSelect: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  preview: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ selected, onSelect, Icon, title, subtitle, preview }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={cn(
      'group relative w-full text-left p-4 rounded-2xl border transition-all',
      'focus:outline-none focus:ring-2 focus:ring-secondary/30',
      selected
        ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/40 shadow-sm'
        : 'border-outline-variant/40 bg-surface-lowest hover:bg-surface-highest/30 hover:border-outline-variant',
    )}
  >
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-xl inline-flex items-center justify-center transition-colors',
          selected ? 'bg-secondary text-on-secondary' : 'bg-surface-highest/60 text-on-surface-variant',
        )}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-headline text-sm font-bold text-on-surface">{title}</h4>
          <span
            className={cn(
              'shrink-0 w-5 h-5 rounded-full border-2 inline-flex items-center justify-center transition-colors',
              selected
                ? 'border-secondary bg-secondary'
                : 'border-outline-variant/60 bg-transparent',
            )}
            aria-hidden="true"
          >
            {selected && <Check className="w-3 h-3 text-on-secondary" strokeWidth={3} />}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{subtitle}</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-1.5">{preview}</div>
  </button>
);

const PreviewLine: React.FC<{
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}> = ({ Icon, label, value }) => (
  <div className="flex items-center gap-2 text-xs">
    <Icon className="w-3.5 h-3.5 text-on-surface-variant shrink-0" aria-hidden="true" />
    <span className="text-on-surface-variant flex-1 truncate">{label}</span>
    <span className="font-bold text-on-surface tabular-nums">{value}</span>
  </div>
);

function buildPreviewLines(config: YearConfig): React.ReactElement[] {
  const lines: React.ReactElement[] = [
    <PreviewLine
      key="tjm"
      Icon={Wallet}
      label="TJM"
      value={`${formatEuro(config.tjm)} €`}
    />,
    <PreviewLine
      key="days"
      Icon={Calendar}
      label="Jours / mois"
      value={`${config.workingDays}`}
    />,
    <PreviewLine
      key="costs"
      Icon={Briefcase}
      label="Charges fixes"
      value={`${config.fixedCosts.length}`}
    />,
  ];
  const flags: string[] = [];
  if (config.acreEnabled) flags.push('ACRE');
  if (config.versementLiberatoire) flags.push('VL');
  if (config.tvaAssujetti) flags.push('TVA');
  if (flags.length > 0) {
    lines.push(
      <PreviewLine
        key="flags"
        Icon={ShieldCheck}
        label="Options"
        value={flags.join(' · ')}
      />,
    );
  }
  return lines;
}

/**
 * Popup de transition d'année. Quand on demande à passer à une année non
 * encore créée (via flèche du stepper, navigation depuis décembre, ou auto au
 * démarrage), l'utilisateur choisit explicitement entre :
 *
 * - **Reprendre** : clone des préférences perso de l'année source + patch légal
 * - **Repartir de zéro** : valeurs par défaut, calendrier vide
 *
 * Si `sourceYear` est null (aucune année antérieure connue), seule l'option
 * "Repartir de zéro" est proposée.
 */
export const YearTransitionModal: React.FC<YearTransitionModalProps> = ({
  open,
  targetYear,
  sourceYear,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<YearTransitionMode>(sourceYear != null ? 'inherit' : 'fresh');

  // Reset le choix quand la cible change ou quand la modal rouvre.
  useEffect(() => {
    if (open) setMode(sourceYear != null ? 'inherit' : 'fresh');
  }, [open, sourceYear, targetYear]);

  const inheritedConfig = useMemo(
    () => (sourceYear != null ? previewInheritedConfig(targetYear, sourceYear) : null),
    [sourceYear, targetYear],
  );
  const freshConfig = useMemo(() => buildDefaultYearConfig(targetYear), [targetYear]);
  const legal = useMemo(() => getLegalParamsForYear(targetYear), [targetYear]);

  return (
    <QuickEditModal
      open={open}
      onClose={onCancel}
      title={`Passer à ${targetYear} ?`}
      description="Comment voulez-vous démarrer cette nouvelle année fiscale ?"
      primaryAction={{
        label: `Créer ${targetYear}`,
        onClick: () => onConfirm(mode),
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sourceYear != null && inheritedConfig && (
          <Card
            selected={mode === 'inherit'}
            onSelect={() => setMode('inherit')}
            Icon={Copy}
            title={`Reprendre ${sourceYear}`}
            subtitle="Vos paramètres sont conservés, le calendrier reste à remplir."
            preview={buildPreviewLines(inheritedConfig)}
          />
        )}
        <Card
          selected={mode === 'fresh'}
          onSelect={() => setMode('fresh')}
          Icon={Sparkles}
          title="Repartir de zéro"
          subtitle="Valeurs par défaut, aucune charge personnalisée, calendrier vide."
          preview={buildPreviewLines(freshConfig)}
        />
      </div>

      <div className="mt-4 px-3 py-2.5 rounded-xl bg-surface-highest/40 text-[11px] text-on-surface-variant flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Paramètres légaux {targetYear} appliqués automatiquement : URSSAF&nbsp;
          <span className="font-bold tabular-nums text-on-surface">{legal.urssafRate.toFixed(1)}%</span>, seuil micro&nbsp;
          <span className="font-bold tabular-nums text-on-surface">{formatEuro(legal.seuilMicro)} €</span>.
        </span>
      </div>
    </QuickEditModal>
  );
};
