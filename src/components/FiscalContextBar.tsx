import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { CalendarDays, Receipt, WalletCards } from 'lucide-react';
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="bg-surface border-b border-outline-variant/10">
      <div
        className="px-4 sm:px-6 lg:px-10 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="Contexte fiscal"
      >
        <YearStepper
          years={years}
          activeYear={activeYear}
          onSelectYear={onSelectYear}
          onRequestTransition={onRequestYearTransition}
        />
        <nav aria-label="Vues principales" className="flex shrink-0 items-center rounded-full bg-surface-highest/40 p-0.5">
          {[
            { to: '/' as const, label: 'Planning', Icon: CalendarDays },
            { to: '/encaissements' as const, label: 'Encaissements', Icon: WalletCards },
          ].map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30',
                  active ? 'bg-surface-lowest text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
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
