import React from 'react';
import { Receipt } from 'lucide-react';
import type { UserProfile } from '~/types';
import type { SettingsTabId } from '~/components/settings/SettingsTabs';
import { formatEuro } from '~/lib/format';
import { YearStepper } from '~/components/YearStepper';
import { cn } from '~/utils';

interface FiscalContextBarProps {
  profile: UserProfile;
  years: number[];
  activeYear: number;
  onSelectYear: (year: number) => void;
  onRequestYearTransition: (year: number) => void;
  onOpenTab: (tab: SettingsTabId) => void;
}

interface ChipProps {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ariaLabel: string;
  onClick: () => void;
}

const Chip: React.FC<ChipProps> = ({ Icon, label, value, ariaLabel, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      'group inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[32px]',
      'rounded-full bg-surface-highest/40 hover:bg-secondary/10',
      'transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
    )}
  >
    <Icon className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" aria-hidden="true" />
    <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
      {label}
    </span>
    <span className="text-xs font-bold text-on-surface truncate max-w-[160px]">
      {value}
    </span>
  </button>
);

export const FiscalContextBar: React.FC<FiscalContextBarProps> = ({
  profile,
  years,
  activeYear,
  onSelectYear,
  onRequestYearTransition,
  onOpenTab,
}) => {
  return (
    <div className="bg-surface border-b border-outline-variant/10">
      <div
        className="px-4 sm:px-6 lg:px-10 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none"
        role="group"
        aria-label="Contexte fiscal"
      >
        <YearStepper
          years={years}
          activeYear={activeYear}
          onSelectYear={onSelectYear}
          onRequestTransition={onRequestYearTransition}
        />
        <Chip
          Icon={Receipt}
          label="Seuil"
          value={`${formatEuro(profile.seuilMicro)} €`}
          ariaLabel={`Seuil micro-entreprise : ${formatEuro(profile.seuilMicro)} euros. Cliquer pour modifier.`}
          onClick={() => onOpenTab('fiscal')}
        />
      </div>
    </div>
  );
};
