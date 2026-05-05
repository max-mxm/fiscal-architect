import { createFileRoute } from '@tanstack/react-router'
import { Home } from '~/pages/Home'

export type SettingsParam = 'profile' | 'fiscal' | 'costs'

interface IndexSearch {
  settings?: SettingsParam
  confirm?: 'reset-all' | 'clear-year' | 'fill-year' | 'fill-month'
}

const SETTINGS_VALUES: ReadonlyArray<SettingsParam> = ['profile', 'fiscal', 'costs']

export const Route = createFileRoute('/')({
  validateSearch: (raw: Record<string, unknown>): IndexSearch => {
    const out: IndexSearch = {}
    if (typeof raw.settings === 'string' && (SETTINGS_VALUES as readonly string[]).includes(raw.settings)) {
      out.settings = raw.settings as SettingsParam
    }
    if (raw.confirm === 'reset-all' || raw.confirm === 'clear-year' || raw.confirm === 'fill-year' || raw.confirm === 'fill-month') {
      out.confirm = raw.confirm
    }
    return out
  },
  component: HomeRoute,
})

function HomeRoute() {
  return <Home />
}
