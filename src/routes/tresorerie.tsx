import { createFileRoute } from '@tanstack/react-router'
import { TreasuryScreen } from '~/screens/TreasuryScreen'

export const Route = createFileRoute('/tresorerie')({
  component: TreasuryScreen,
})
