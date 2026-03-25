import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Scale,
  CalendarDays,
  UserCircle,
  Wallet,
  Calendar,
  Settings,
  Bell,
  AlertTriangle,
  X,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '~/utils';
import type { UserProfile } from '~/types';
import { SEUIL_MICRO, calcCAannuel } from '~/lib/fiscal';

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/' as const },
  { id: 'comparison', label: 'Comparaison', icon: Scale, path: '/comparison' as const },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays, path: '/calendar' as const },
  { id: 'profile', label: 'Profil', icon: UserCircle, path: '/profile' as const },
];

interface SidebarProps {
  profile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ profile }) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col z-40 bg-surface-low border-r border-outline-variant/10">
      <div className="px-8 py-10">
        <h1 className="text-xl font-black font-headline text-slate-900">Fiscal Architect</h1>
        <p className="text-xs uppercase tracking-[0.15em] text-on-surface-variant/60 mt-1 font-bold">Simulation fiscale</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "w-full flex items-center space-x-3 px-6 py-4 transition-all rounded-xl font-headline font-semibold tracking-tight",
                isActive
                  ? "text-secondary font-bold border-r-4 border-secondary bg-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-secondary/10")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-8 mt-auto border-t border-outline-variant/10">
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-lowest shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{profile.name}</p>
            <p className="text-[11px] text-on-surface-variant">{profile.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

// --- TRANS-01 : Alerte seuil micro-entreprise ---

export const ThresholdAlert: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [dismissed, setDismissed] = useState(false);

  const caAnnuel = useMemo(
    () => calcCAannuel(profile.tjm, profile.workingDays),
    [profile.tjm, profile.workingDays],
  );

  const percent = useMemo(() => (caAnnuel / SEUIL_MICRO) * 100, [caAnnuel]);

  // N'affiche que si on dépasse 80% du seuil et statut micro
  if (dismissed || profile.status !== 'micro' || percent < 80) return null;

  const isOver = caAnnuel >= SEUIL_MICRO;

  return (
    <div className={cn(
      "fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4 px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4",
      isOver ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200",
    )}>
      <AlertTriangle className={cn("w-5 h-5 shrink-0 mt-0.5", isOver ? "text-red-500" : "text-amber-500")} />
      <div className="flex-1">
        <p className={cn("text-sm font-bold", isOver ? "text-red-800" : "text-amber-800")}>
          {isOver
            ? `Seuil micro-entreprise dépassé (${caAnnuel.toLocaleString()}€ / ${SEUIL_MICRO.toLocaleString()}€)`
            : `Attention : ${percent.toFixed(0)}% du seuil micro-entreprise atteint (${caAnnuel.toLocaleString()}€ / ${SEUIL_MICRO.toLocaleString()}€)`
          }
        </p>
        <p className={cn("text-xs mt-1", isOver ? "text-red-600" : "text-amber-600")}>
          {isOver
            ? "Vous devez envisager un changement de statut (SASU ou EURL)."
            : "Pensez à anticiper un éventuel changement de statut."
          }
        </p>
        <Link
          to="/calendar"
          className={cn("text-xs font-bold mt-2 underline underline-offset-2 inline-block", isOver ? "text-red-700" : "text-amber-700")}
        >
          Voir le calendrier
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- TRANS-02 : TopBar fonctionnelle ---

interface TopBarProps {
  profile: UserProfile;
  onExportGlobal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ profile, onExportGlobal }) => {
  const [showNotif, setShowNotif] = useState(false);

  const caAnnuel = useMemo(
    () => calcCAannuel(profile.tjm, profile.workingDays),
    [profile.tjm, profile.workingDays],
  );

  const percent = Math.min(100, (caAnnuel / SEUIL_MICRO) * 100);
  const hasWarning = profile.status === 'micro' && percent >= 80;

  return (
    <header className="h-16 w-full fixed top-0 z-30 bg-surface/80 backdrop-blur-xl flex justify-end items-center px-12 lg:pl-84 shadow-[0_48px_48px_-12px_rgba(25,28,30,0.04)]">
      <div className="flex items-center space-x-6">
        <Link
          to="/"
          className="flex items-center space-x-2 text-slate-600 hover:text-secondary cursor-pointer transition-colors"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium">
            {caAnnuel.toLocaleString()}€
            <span className="text-xs text-slate-400 ml-1">/ {SEUIL_MICRO.toLocaleString()}€</span>
          </span>
        </Link>
        <Link
          to="/calendar"
          className="flex items-center space-x-2 text-slate-600 hover:text-secondary cursor-pointer transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">{new Date().getFullYear()}</span>
        </Link>
        {onExportGlobal && (
          <button
            onClick={onExportGlobal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20"
            title="Exporter CSV"
            aria-label="Exporter en CSV"
          >
            <Download className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <Link
          to="/profile"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20"
          aria-label="Paramètres du profil"
        >
          <Settings className="w-5 h-5 text-slate-600" />
        </Link>
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20 relative"
          aria-label="Notifications"
          aria-expanded={showNotif}
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {hasWarning && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 right-8 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 p-6 w-80 z-50"
          >
            <h4 className="text-sm font-bold mb-3">Notifications</h4>
            {hasWarning ? (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-on-surface-variant">
                  Votre CA projeté ({caAnnuel.toLocaleString()}€) atteint {percent.toFixed(0)}% du seuil micro-entreprise.
                </p>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">Aucune notification pour le moment.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// --- TRANS-03 : MobileNav complète ---

export const MobileNav: React.FC = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const mobileItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' as const },
    { id: 'comparison', label: 'Comparer', icon: Scale, path: '/comparison' as const },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays, path: '/calendar' as const },
    { id: 'profile', label: 'Profil', icon: UserCircle, path: '/profile' as const },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-4px_24px_0_rgba(15,23,42,0.04)] border-t border-slate-200/20">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-2 transition-transform duration-200",
              isActive ? "text-secondary scale-110" : "text-slate-400"
            )}
          >
            <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-secondary/10")} />
            <span className="text-[11px] font-semibold uppercase tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
