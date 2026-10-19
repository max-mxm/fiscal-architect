import React from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { ScreenHead, Sheet } from '~/shell/AppShell';
import type { SettingsSection } from '~/shell/nav';
import { SectionActivite } from './settings/SectionActivite';
import { SectionFacturation } from './settings/SectionFacturation';
import { SectionCharges, SectionDonnees, SectionProfil } from './settings/SectionsSimple';
import { eur } from '~/ui/Money';
import { cn } from '~/utils';
import type { UserProfile } from '~/types';

interface SectionDef {
  id: SettingsSection;
  title: string;
  summary: (p: UserProfile) => string;
}

const SECTIONS: SectionDef[] = [
  {
    id: 'activite',
    title: 'Activité et fiscalité',
    summary: (p) =>
      [
        p.tvaAssujetti ? 'TVA facturée' : 'Franchise de TVA',
        p.versementLiberatoire ? 'versement libératoire' : 'impôt au barème',
        p.acreEnabled ? 'ACRE' : null,
      ]
        .filter(Boolean)
        .join(' · '),
  },
  {
    id: 'facturation',
    title: 'Saisie et paiements',
    summary: (p) =>
      `${{ days: 'Jours travaillés', forfait: 'Forfaits', flat: 'CA mensuel', mixed: 'Mixte' }[p.revenueModel]} · ${
        p.paymentDelayDays === 0
          ? 'paiement comptant'
          : `${p.paymentDelayDays} j ${p.paymentDelayMode === 'net' ? 'nets' : 'fin de mois'}`
      }`,
  },
  {
    id: 'charges',
    title: 'Charges fixes',
    summary: (p) =>
      p.fixedCosts.length === 0
        ? 'Aucune charge'
        : `${eur(p.fixedCosts.reduce((s, c) => s + c.amount, 0))} par mois`,
  },
  { id: 'profil', title: 'Profil et apparence', summary: (p) => p.name || 'Nom, métier, thème' },
  { id: 'donnees', title: 'Données et sauvegarde', summary: () => 'Sauvegarde, export CSV, effacement' },
];

const RENDER: Record<SettingsSection, React.FC> = {
  activite: SectionActivite,
  facturation: SectionFacturation,
  charges: SectionCharges,
  profil: SectionProfil,
  donnees: SectionDonnees,
};

function SectionNav({ active }: { active: SettingsSection | null }) {
  const { profile } = useProfile();
  return (
    <nav aria-label="Sections des réglages">
      <ul className="card divide-y divide-line overflow-hidden">
        {SECTIONS.map((s) => {
          const current = s.id === active;
          // Sur l'index desktop, la première section est affichée à droite.
          const desktopDefault = active == null && s.id === 'activite';
          return (
            <li key={s.id}>
              <Link
                to="/reglages/$section"
                params={{ section: s.id }}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 items-center gap-3 px-4 py-3 transition-colors',
                  current ? 'bg-primary-soft' : 'hover:bg-card-2',
                  desktopDefault && 'lg:bg-primary-soft',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-ink">{s.title}</span>
                  <span className="block truncate text-[13px] text-ink-2">{s.summary(profile)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Index (liste) sur mobile ; liste + section sur desktop. */
export function SettingsScreen({ section }: { section: SettingsSection | null }) {
  const def = SECTIONS.find((s) => s.id === section) ?? null;
  const Content = RENDER[section ?? 'activite'];

  return (
    <>
      <ScreenHead>
        {def ? (
          <Link
            to="/reglages"
            className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-ca-ink lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            Réglages
          </Link>
        ) : null}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em] text-ink lg:text-[30px]">
          <span className={cn(def && 'lg:hidden')}>{def ? def.title : 'Réglages'}</span>
          {def && <span className="hidden lg:inline">Réglages</span>}
        </h1>
        <p className="mt-1 max-w-xl text-[15px] text-ink-2">Enregistrés à chaque modification, sur cet appareil uniquement.</p>
      </ScreenHead>
      <Sheet>
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <div className={cn('lg:sticky lg:top-8', def && 'hidden lg:block')}>
            <SectionNav active={section} />
          </div>
          <div className={cn('min-w-0', !def && 'hidden lg:block')}>
            <h2 className="mb-4 hidden text-[22px] font-extrabold text-ink lg:block">{(def ?? SECTIONS[0]).title}</h2>
            <Content />
          </div>
        </div>
      </Sheet>
    </>
  );
}
