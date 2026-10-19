import { createFileRoute, redirect } from '@tanstack/react-router'

/** Ancienne route `/profile` : conservée pour les favoris. */
export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    throw redirect({ to: '/reglages/$section', params: { section: 'profil' } })
  },
})
