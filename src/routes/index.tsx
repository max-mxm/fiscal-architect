import { createFileRoute } from '@tanstack/react-router'
import { MonthScreen } from '~/screens/MonthScreen'

interface IndexSearch {
  /** Mois affiché (0-11), pour les liens depuis l'écran Année. */
  mois?: number
}

export const Route = createFileRoute('/')({
  validateSearch: (raw: Record<string, unknown>): IndexSearch => {
    const m = Number(raw.mois)
    return Number.isInteger(m) && m >= 0 && m <= 11 ? { mois: m } : {}
  },
  component: MonthScreen,
})
