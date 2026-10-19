import { createFileRoute, redirect } from '@tanstack/react-router'

/** Ancienne route : la trésorerie regroupe désormais encaissements et provisions. */
export const Route = createFileRoute('/encaissements')({
  beforeLoad: () => {
    throw redirect({ to: '/tresorerie' })
  },
})
