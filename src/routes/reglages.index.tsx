import { createFileRoute } from '@tanstack/react-router'
import { SettingsScreen } from '~/screens/SettingsScreen'

export const Route = createFileRoute('/reglages/')({
  component: () => <SettingsScreen section={null} />,
})
