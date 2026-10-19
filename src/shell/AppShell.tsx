import React, { type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { BrandMark } from '~/shell/BrandMark';
import { YearSwitcher } from '~/shell/YearSwitcher';
import { NotificationBell } from '~/shell/Notifications';
import { NAV_ITEMS } from '~/shell/nav';
import { cn } from '~/utils';

/** Largeur et gouttières communes. */
export const FRAME = 'mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-10';

/** En-tête d'écran : titre et contenu de tête, sur le fond. */
export function ScreenHead({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn(FRAME, 'pt-3 lg:pt-8', className)}>{children}</section>;
}

/** Corps d'écran. */
export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(FRAME, 'py-5 lg:py-8', className)}>{children}</div>;
}

function NavLinks({ variant }: { variant: 'rail' | 'tabs' }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center transition-colors',
              variant === 'rail'
                ? cn(
                    'h-11 gap-3 rounded-[var(--radius-ctl)] px-2 text-[15px]',
                    active ? 'bg-primary-soft font-bold text-ink' : 'font-medium text-ink-2 hover:bg-card-2 hover:text-ink',
                  )
                : cn('h-16 flex-1 flex-col justify-center gap-1 text-[12px]', active ? 'font-bold text-ink' : 'font-medium text-ink-3'),
            )}
          >
            <span
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-[8px] transition-colors duration-150',
                variant === 'rail' ? 'h-7 w-7' : 'h-7 w-11',
                variant === 'tabs' && !active ? item.ink : item.tile,
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function YearControl() {
  const { years, activeYear, setActiveYear } = useProfile();
  const fy = useFiscalYearCtx();
  return <YearSwitcher years={years} activeYear={activeYear} onSelectYear={setActiveYear} onRequestTransition={fy.requestYearTransition} />;
}

function Rail() {
  const { profile } = useProfile();
  return (
    <aside className="hidden border-r border-line bg-card lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold leading-tight text-ink">Fiscal Architect</p>
            <Link to="/reglages/$section" params={{ section: 'profil' }} className="block truncate text-[13px] text-ink-3 hover:text-ink-2">
              {profile.name || 'Votre profil'}
            </Link>
          </div>
        </div>
        <div className="mx-3 flex items-center justify-between rounded-[var(--radius-card)] bg-card-2 px-1.5 py-1">
          <YearControl />
          <NotificationBell />
        </div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-3 py-4">
          <NavLinks variant="rail" />
        </nav>
        <p className="mt-auto flex items-start gap-2 px-5 pb-6 text-[13px] leading-snug text-ink-3">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Vos données restent sur cet appareil. Rien n’est envoyé.
        </p>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur safe-top lg:hidden">
      <div className="flex h-14 items-center gap-1 px-3">
        <Link to="/" aria-label="Fiscal Architect, écran du mois" className="inline-flex h-11 w-11 items-center justify-center">
          <BrandMark className="h-8 w-8" />
        </Link>
        <YearControl />
        <div className="flex-1" />
        <NotificationBell />
      </div>
    </header>
  );
}

function TabBar() {
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-xl">
        <NavLinks variant="tabs" />
      </div>
    </nav>
  );
}

export function AppShell({ children, overlays }: { children: ReactNode; overlays?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <Rail />
      <div className="flex min-w-0 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <MobileHeader />
        <main id="contenu" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      <TabBar />
      {overlays}
    </div>
  );
}
