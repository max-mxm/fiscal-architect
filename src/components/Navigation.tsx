import React from 'react';
import {
  LayoutDashboard,
  Scale,
  CalendarDays,
  UserCircle,
  TrendingUp,
  Wallet,
  Calendar,
  Settings,
  Bell,
  Download,
  Plus,
  ArrowRight,
  Info,
  Laptop,
  Users,
  Shield,
  History,
  Quote
} from 'lucide-react';
import { cn } from '../utils';
import { Page, UserProfile } from '../types';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  profile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, profile }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'comparison', label: 'Comparaison', icon: Scale },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
    { id: 'profile', label: 'Profil', icon: UserCircle },
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col z-40 bg-surface-low border-r border-outline-variant/10">
      <div className="px-8 py-10">
        <h1 className="text-xl font-black font-headline text-slate-900">Fiscal Architect</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 mt-1 font-bold">Simulation fiscale</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as Page)}
              className={cn(
                "w-full flex items-center space-x-3 px-6 py-4 transition-all rounded-xl font-headline font-semibold tracking-tight",
                isActive
                  ? "text-secondary font-bold border-r-4 border-secondary bg-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-secondary/10")} />
              <span>{item.label}</span>
            </button>
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
            <p className="text-[10px] text-on-surface-variant">{profile.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const TopBar: React.FC = () => {
  return (
    <header className="h-16 w-full fixed top-0 z-30 bg-surface/80 backdrop-blur-xl flex justify-end items-center px-12 lg:pl-84 shadow-[0_48px_48px_-12px_rgba(25,28,30,0.04)]">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-slate-600 hover:text-secondary cursor-pointer transition-colors">
          <Wallet className="w-5 h-5" />
          <span className="text-sm font-medium">Objectifs CA</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-600 hover:text-secondary cursor-pointer transition-colors">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">Année fiscale</span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <Settings className="w-5 h-5 text-slate-600" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </header>
  );
};

export const MobileNav: React.FC<{ activePage: Page; setActivePage: (page: Page) => void }> = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
    { id: 'profile', label: 'Profil', icon: UserCircle },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-4px_24px_0_rgba(15,23,42,0.04)] border-t border-slate-200/20">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as Page)}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-2 transition-transform duration-200",
              isActive ? "text-secondary scale-110" : "text-slate-400"
            )}
          >
            <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-secondary/10")} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
