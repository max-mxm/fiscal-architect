import React from 'react';
import { ArrowRight, Briefcase, Car, Hammer, Home as HomeIcon, ShoppingBag } from 'lucide-react';
import type { Activity, UserProfile } from '~/types';
import { primaryActivityParamsPatch } from '~/lib/activity';
import { Dialog } from '~/ui/Dialog';
import { cn } from '~/utils';

interface PersonaPickerProps {
  open: boolean;
  year: number;
  onPick: (patch: Partial<UserProfile>) => void;
  onSkip: () => void;
}

interface Persona {
  id: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  revenueModel: UserProfile['revenueModel'];
  activity: Activity;
  activityLabel: string;
}

const PRIMARY: Persona = {
  id: 'freelance',
  label: 'Freelance au TJM',
  hint: 'Conseil, développement, design : vous cochez vos jours, l’app calcule le reste.',
  Icon: Briefcase,
  revenueModel: 'days',
  activity: 'liberalSsi',
  activityLabel: 'Conseil indépendant',
};

const OTHERS: Persona[] = [
  { id: 'artisan', label: 'Prestations au forfait', hint: 'Devis datés : artisan, projets', Icon: Hammer, revenueModel: 'forfait', activity: 'serviceBic', activityLabel: 'Prestations' },
  { id: 'ecommerce', label: 'Vente en ligne', hint: 'Boutique, marketplace', Icon: ShoppingBag, revenueModel: 'flat', activity: 'vente', activityLabel: 'Vente en ligne' },
  { id: 'vtc', label: 'VTC ou livraison', hint: 'Courses agrégées par mois', Icon: Car, revenueModel: 'flat', activity: 'serviceBic', activityLabel: 'Transport, livraison' },
  { id: 'meuble', label: 'Location meublée', hint: 'Revenus saisonniers', Icon: HomeIcon, revenueModel: 'flat', activity: 'vente', activityLabel: 'Location meublée' },
];

function patchFor(p: Persona, year: number): Partial<UserProfile> {
  const activities = [{ id: `act-${p.activity}-${Date.now()}`, type: p.activity, isPrimary: true, label: p.activityLabel }];
  return { onboardingDone: true, revenueModel: p.revenueModel, ...primaryActivityParamsPatch(activities, year), activities };
}

/** Premier lancement : choisir son profil pré-règle le mode de saisie et l'activité. */
export const PersonaPicker: React.FC<PersonaPickerProps> = ({ open, year, onPick, onSkip }) => (
  <Dialog
    open={open}
    onClose={onSkip}
    size="md"
    title="Comment travaillez-vous ?"
    description="Votre choix règle le mode de saisie et l’activité déclarée. Tout reste modifiable dans les réglages."
  >
    <button
      type="button"
      data-autofocus
      onClick={() => onPick(patchFor(PRIMARY, year))}
      className="group flex w-full items-start gap-4 rounded-[14px] bg-ca p-4 text-left text-ca-on transition-colors hover:bg-primary-hover"
    >
      <PRIMARY.Icon className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold">{PRIMARY.label}</span>
        <span className="mt-0.5 block text-[14px] text-on-primary/80">{PRIMARY.hint}</span>
      </span>
      <ArrowRight className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden="true" />
    </button>

    <p className="mb-2 mt-5 text-[14px] font-medium text-ink-2">Autres façons de facturer</p>
    <ul className="grid grid-cols-2 gap-2">
      {OTHERS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onPick(patchFor(p, year))}
            className={cn(
              'flex h-full min-h-20 w-full flex-col items-start gap-1 rounded-[var(--radius-card)] border-2 border-line p-3 text-left transition-colors hover:border-primary',
            )}
          >
            <p.Icon className="h-5 w-5 text-ink-2" strokeWidth={1.5} />
            <span className="text-[15px] font-medium text-ink">{p.label}</span>
            <span className="text-[13px] leading-snug text-ink-2">{p.hint}</span>
          </button>
        </li>
      ))}
    </ul>

    <button
      type="button"
      onClick={onSkip}
      className="mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-ca-ink underline decoration-primary/40 hover:decoration-primary"
    >
      Je règle tout moi-même
    </button>
  </Dialog>
);
