import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '~/utils';

export type SettingsTabId = 'profile' | 'fiscal' | 'payments' | 'costs' | 'backup';

export interface TabDef {
  id: SettingsTabId;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface SettingsTabsProps {
  tabs: TabDef[];
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
}

/** A vertical secondary navigation: settings have too much information for tabs. */
export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  tabs,
  active,
  onChange,
}) => (
  <nav aria-label="Sections des réglages" className="space-y-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            id={`settings-nav-${tab.id}`}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-secondary/30',
              isActive
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-highest/40 hover:text-on-surface',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                isActive ? 'bg-white/15' : 'bg-surface-highest/45 text-secondary',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{tab.label}</span>
              <span className={cn('mt-0.5 block text-[11px] leading-snug', isActive ? 'text-on-secondary/75' : 'text-on-surface-variant')}>
                {tab.description}
              </span>
            </span>
          </button>
        );
      })}
  </nav>
);

interface SettingsMobileMenuProps extends SettingsTabsProps {
  getStatus?: (tab: TabDef) => string | undefined;
}

/** The mobile root view avoids hiding settings behind a horizontal tab bar. */
export const SettingsMobileMenu: React.FC<SettingsMobileMenuProps> = ({
  tabs,
  active,
  onChange,
  getStatus,
}) => (
  <nav aria-label="Sections des réglages" className="space-y-2">
    {tabs.map((tab) => {
      const Icon = tab.Icon;
      const status = getStatus?.(tab);
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className="group flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-outline-variant/25 bg-surface-low px-3 py-3 text-left transition-colors hover:border-secondary/35 hover:bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-secondary/30 active:bg-secondary/10"
        >
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-on-surface">{tab.label}</span>
              {tab.id === active && <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">En cours</span>}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-on-surface-variant">{status ?? tab.description}</span>
          </span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
        </button>
      );
    })}
  </nav>
);
