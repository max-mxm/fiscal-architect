import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '~/pages/Dashboard'
import { useProfile } from '~/context/ProfileContext'

export const Route = createFileRoute('/')({
  component: DashboardRoute,
})

function DashboardRoute() {
  const { profile } = useProfile()
  return <Dashboard profile={profile} />
}
