import { createFileRoute } from '@tanstack/react-router'
import { Calendar } from '~/pages/Calendar'
import { useProfile } from '~/context/ProfileContext'

export const Route = createFileRoute('/calendar')({
  component: CalendarRoute,
})

function CalendarRoute() {
  const { profile } = useProfile()
  return <Calendar profile={profile} />
}
