import { CalendarDays, SlidersHorizontal, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: '/' | '/annee' | '/tresorerie' | '/reglages';
  label: string;
  icon: LucideIcon;
  /** Tuile pleine de l'onglet actif. */
  tile: string;
  /** Couleur de l'icône quand l'onglet n'est pas actif. */
  ink: string;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Mois', icon: CalendarDays, tile: 'bg-ca text-ca-on', ink: 'text-ca-ink', match: (p) => p === '/' },
  { to: '/annee', label: 'Année', icon: TrendingUp, tile: 'bg-net text-net-on', ink: 'text-net-ink', match: (p) => p.startsWith('/annee') },
  {
    to: '/tresorerie',
    label: 'Trésorerie',
    icon: Wallet,
    tile: 'bg-cot text-cot-on',
    ink: 'text-cot-ink',
    match: (p) => p.startsWith('/tresorerie') || p.startsWith('/regularisation-vl'),
  },
  { to: '/reglages', label: 'Réglages', icon: SlidersHorizontal, tile: 'bg-charges text-charges-on', ink: 'text-ink-2', match: (p) => p.startsWith('/reglages') },
];

/** Sections des réglages et correspondance avec les anciens paramètres `?settings=`. */
export const SETTINGS_SECTIONS = ['activite', 'facturation', 'charges', 'profil', 'donnees'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const LEGACY_SETTINGS: Record<string, SettingsSection> = {
  fiscal: 'activite',
  payments: 'facturation',
  costs: 'charges',
  profile: 'profil',
  backup: 'donnees',
};

export function isSettingsSection(value: unknown): value is SettingsSection {
  return typeof value === 'string' && (SETTINGS_SECTIONS as readonly string[]).includes(value);
}
