import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '~/pages/Profile'
import { useProfile } from '~/context/ProfileContext'

export const Route = createFileRoute('/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const { profile, setProfile } = useProfile()
  return <Profile profile={profile} setProfile={setProfile} />
}
