import { type ReactNode } from 'react'
import { Outlet, createRootRoute, HeadContent, Scripts, redirect } from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'
import { ProfileProvider } from '~/context/ProfileContext'
import { FiscalYearProvider, useFiscalYearCtx } from '~/context/FiscalYearContext'
import { NotificationsProvider } from '~/context/NotificationsContext'
import { ThemeProvider } from '~/context/ThemeContext'
import { AppShell } from '~/shell/AppShell'
import { LEGACY_SETTINGS } from '~/shell/nav'
import { PwaInstallController } from '~/components/PwaInstallController'
import { YearTransitionModal } from '~/components/YearTransitionModal'
import { BreakingUpdateGate } from '~/components/BreakingUpdateGate'
import { ErrorPage } from '~/components/ErrorPage'
import { useYearAutoTransition } from '~/hooks/useYearAutoTransition'
import { useProfile } from '~/context/ProfileContext'
import { FiscalViewProvider } from '~/view/useFiscalView'

const THEME_LIGHT = '#ffffff'
const THEME_DARK = '#181b34'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    // Anciens liens : `?settings=fiscal` ouvrait un tiroir, c'est désormais une page.
    const legacy = (location.search as Record<string, unknown> | undefined)?.settings
    if (typeof legacy === 'string' && LEGACY_SETTINGS[legacy]) {
      throw redirect({ to: '/reglages/$section', params: { section: LEGACY_SETTINGS[legacy] } })
    }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Fiscal Architect — votre net de micro-entrepreneur' },
      {
        name: 'description',
        content:
          "Du jour travaillé au net réel : cotisations, impôt, seuils, TVA et encaissements pour micro-entrepreneurs. 100 % local, vos données restent dans votre navigateur.",
      },
      { name: 'theme-color', content: THEME_LIGHT },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Fiscal Architect' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180.png' },
      { rel: 'apple-touch-icon', sizes: '192x192', href: '/icon-192.png' },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <ErrorPage
      kind="error"
      error={error instanceof Error ? error : new Error(String(error))}
      onReload={reset ?? (() => {
        if (typeof window !== 'undefined') window.location.reload()
      })}
    />
  ),
  notFoundComponent: () => <ErrorPage kind="not-found" />,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider>
        <ProfileProvider>
          <FiscalYearProvider>
            <NotificationsProvider>
              <FiscalViewProvider>
                <Shell />
              </FiscalViewProvider>
            </NotificationsProvider>
          </FiscalYearProvider>
        </ProfileProvider>
      </ThemeProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('fiscal-theme');
                  var mode = (raw === 'light' || raw === 'dark' || raw === 'system') ? raw : 'system';
                  var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', isDark ? '${THEME_DARK}' : '${THEME_LIGHT}');
                } catch (e) {}
              })();
            `,
          }}
        />
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

function Shell() {
  const fy = useFiscalYearCtx()
  const { activeYear } = useProfile()
  useYearAutoTransition()

  return (
    <AppShell
      overlays={
        <>
          <YearTransitionModal
            open={fy.transitionRequest != null}
            targetYear={fy.transitionRequest?.targetYear ?? activeYear + 1}
            sourceYear={fy.transitionRequest?.sourceYear ?? null}
            onConfirm={fy.confirmYearTransition}
            onCancel={fy.cancelYearTransition}
          />
          <PwaInstallController />
          <BreakingUpdateGate />
        </>
      }
    >
      <Outlet />
    </AppShell>
  )
}
