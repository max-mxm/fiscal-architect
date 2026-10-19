import { createFileRoute, redirect } from '@tanstack/react-router'
import { SettingsScreen } from '~/screens/SettingsScreen'
import { isSettingsSection } from '~/shell/nav'

export const Route = createFileRoute('/reglages/$section')({
  beforeLoad: ({ params }) => {
    if (!isSettingsSection(params.section)) throw redirect({ to: '/reglages' })
  },
  component: SettingsRoute,
})

function SettingsRoute() {
  const { section } = Route.useParams()
  return <SettingsScreen section={isSettingsSection(section) ? section : null} />
}
