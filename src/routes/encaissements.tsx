import { createFileRoute } from '@tanstack/react-router';
import { Cashflow } from '~/pages/Cashflow';
import type { SettingsParam } from '~/routes/index';

interface CashflowSearch {
  settings?: SettingsParam;
  confirm?: 'reset-all';
}

const SETTINGS_VALUES: ReadonlyArray<SettingsParam> = ['profile', 'fiscal', 'payments', 'costs'];

export const Route = createFileRoute('/encaissements')({
  validateSearch: (raw: Record<string, unknown>): CashflowSearch => {
    const out: CashflowSearch = {};
    if (typeof raw.settings === 'string' && (SETTINGS_VALUES as readonly string[]).includes(raw.settings)) {
      out.settings = raw.settings as SettingsParam;
    }
    if (raw.confirm === 'reset-all') out.confirm = 'reset-all';
    return out;
  },
  component: Cashflow,
});

