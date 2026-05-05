import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Route legacy `/profile` — redirige vers la single-page avec l'onglet Profil ouvert.
 * Préserve les bookmarks existants après la fusion Calendar + Profile.
 */
export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    throw redirect({ to: '/', search: { settings: 'profile' } })
  },
})
