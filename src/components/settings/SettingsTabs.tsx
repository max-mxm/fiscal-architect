import React, { useRef } from 'react';
import { cn } from '~/utils';

export type SettingsTabId = 'profile' | 'fiscal' | 'costs';

export interface TabDef {
  id: SettingsTabId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface SettingsTabsProps {
  tabs: TabDef[];
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
  panelIdPrefix: string;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  tabs,
  active,
  onChange,
  panelIdPrefix,
}) => {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex((t) => t.id === active);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + tabs.length) % tabs.length;
      onChange(tabs[next].id);
      buttonsRef.current[next]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(tabs[0].id);
      buttonsRef.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = tabs.length - 1;
      onChange(tabs[last].id);
      buttonsRef.current[last]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Sections des réglages"
      onKeyDown={handleKey}
      className="flex gap-1 px-4 md:px-6 -mx-1 overflow-x-auto scrollbar-none"
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${panelIdPrefix}-tab-${tab.id}`}
            aria-controls={`${panelIdPrefix}-panel-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px]',
              'text-sm font-bold whitespace-nowrap rounded-xl transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-secondary/30',
              isActive
                ? 'text-secondary bg-secondary/10'
                : 'text-on-surface-variant hover:text-slate-900 hover:bg-surface-highest/40',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
