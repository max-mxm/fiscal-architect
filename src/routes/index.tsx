import { createFileRoute } from '@tanstack/react-router'
import { Home } from '~/pages/Home'

interface IndexSearch {
  sheet?: 'advanced'
  settings?: 1
  confirm?: 'reset-all' | 'clear-year' | 'fill-year' | 'fill-month'
}

export const Route = createFileRoute('/')({
  validateSearch: (raw: Record<string, unknown>): IndexSearch => {
    const out: IndexSearch = {}
    if (raw.sheet === 'advanced') out.sheet = 'advanced'
    if (raw.settings === 1 || raw.settings === '1') out.settings = 1
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
