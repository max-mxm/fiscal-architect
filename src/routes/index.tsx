import { createFileRoute } from '@tanstack/react-router'
import { Calendar } from '~/pages/Calendar'
import { useProfile } from '~/context/ProfileContext'

export const Route = createFileRoute('/')({
  component: CalendarHomeRoute,
})

function CalendarHomeRoute() {
  const { profile } = useProfile()
  return <Calendar profile={profile} />
}
