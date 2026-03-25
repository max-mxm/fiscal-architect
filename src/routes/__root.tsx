import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'
import { Sidebar, TopBar, MobileNav, ThresholdAlert } from '~/components/Navigation'
import { ProfileProvider, useProfile } from '~/context/ProfileContext'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Fiscal Architect — Simulation fiscale' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ProfileProvider>
        <AppShell />
      </ProfileProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function AppShell() {
  const { profile, setProfile, handleExportGlobal } = useProfile()

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar profile={profile} />
      <TopBar profile={profile} onExportGlobal={handleExportGlobal} />
      <div className="lg:ml-72 pt-16">
        <ThresholdAlert profile={profile} />
      </div>
      <main className="lg:ml-72 pt-24 px-6 lg:px-12 pb-32 lg:pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
