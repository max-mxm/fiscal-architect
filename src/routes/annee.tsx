import { createFileRoute } from '@tanstack/react-router'
import { YearScreen } from '~/screens/YearScreen'

export const Route = createFileRoute('/annee')({
  component: YearScreen,
})
