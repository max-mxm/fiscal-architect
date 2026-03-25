import { createFileRoute } from '@tanstack/react-router'
import { Comparison } from '~/pages/Comparison'
import { useProfile } from '~/context/ProfileContext'

export const Route = createFileRoute('/comparison')({
  component: ComparisonRoute,
})

function ComparisonRoute() {
  const { profile } = useProfile()
  return <Comparison profile={profile} />
}
