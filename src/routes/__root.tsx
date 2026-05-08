import { useMemo, type ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'
import { TopBar } from '~/components/Navigation'
import { ProfileProvider, useProfile } from '~/context/ProfileContext'
import { FiscalYearProvider, useFiscalYearCtx } from '~/context/FiscalYearContext'
import { SettingsDrawer } from '~/components/SettingsDrawer'
import { FiscalContextBar } from '~/components/FiscalContextBar'
import { ConfirmModal } from '~/components/ConfirmModal'
import { PwaInstallController } from '~/components/PwaInstallController'
import { calcEquivDays } from '~/lib/fiscal'
import type { SettingsTabId } from '~/components/settings/SettingsTabs'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Fiscal Architect — Simulation fiscale' },
      {
        name: 'description',
        content:
          "Suivi et simulation fiscale pour micro-entrepreneurs. 100% local — vos données restent dans votre navigateur.",
      },
      { name: 'theme-color', content: '#006c49' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Fiscal Architect' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180.png' },
      { rel: 'apple-touch-icon', sizes: '192x192', href: '/icon-192.png' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ProfileProvider>
        <FiscalYearProvider>
          <AppShell />
        </FiscalYearProvider>
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
        <script
          dangerouslySetInnerHTML={{
            __html: import.meta.env.PROD
              ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
              : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
                });
                if (window.caches) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(k) { caches.delete(k); });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

function AppShell() {
  const { profile, setProfile, handleExportGlobal } = useProfile()
  const fy = useFiscalYearCtx()
  const navigate = useNavigate()
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>
  const settingsParam = search?.settings as SettingsTabId | undefined
  const isValidTab = settingsParam === 'profile' || settingsParam === 'fiscal' || settingsParam === 'costs'
  const settingsOpen = isValidTab
  const activeTab: SettingsTabId = isValidTab ? settingsParam : 'profile'
  const resetConfirmOpen = search?.confirm === 'reset-all'

  const caCumule = useMemo(() => {
    const totalDays = fy.fiscalYear.months.reduce((sum, m) => sum + calcEquivDays(m), 0)
    return totalDays * profile.tjm
  }, [fy.fiscalYear.months, profile.tjm])

  const openSettings = (tab: SettingsTabId) => navigate({ to: '/', search: { settings: tab } })
  const closeSettings = () => navigate({ to: '/', search: {} })
  const askResetAll = () => navigate({ to: '/', search: { confirm: 'reset-all' } })
  const confirmResetAll = () => {
    fy.resetEverything()
    navigate({ to: '/', search: {} })
  }
  const cancelReset = () =>
    navigate({ to: '/', search: settingsOpen ? { settings: activeTab } : {} })

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar
        profile={profile}
        caCumule={caCumule}
        onExport={handleExportGlobal}
        onOpenSettings={() => openSettings('profile')}
      />
      <FiscalContextBar
        profile={profile}
        missionStart={fy.missionStart}
        onOpenTab={openSettings}
      />
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <SettingsDrawer
        open={settingsOpen}
        activeTab={activeTab}
        onTabChange={openSettings}
        onClose={closeSettings}
        year={fy.year}
        profile={profile}
        setProfile={setProfile}
        missionStart={fy.missionStart}
        onMissionStartChange={fy.setMissionStart}
        onResetAll={askResetAll}
      />
      <ConfirmModal
        open={resetConfirmOpen}
        title="Tout réinitialiser ?"
        message="Calendrier, profil, charges et sliders reviendront à leurs valeurs par défaut. Action irréversible."
        confirmLabel="Tout réinitialiser"
        destructive
        onConfirm={confirmResetAll}
        onCancel={cancelReset}
      />
      <PwaInstallController />
    </div>
  )
}
