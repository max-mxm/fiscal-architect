import React, { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Hammer, ShoppingBag, Car, Home as HomeIcon, Settings, X } from 'lucide-react';
import type { UserProfile, Activity } from '~/types';
import { cn } from '~/utils';

interface PersonaPickerProps {
  open: boolean;
  onPick: (patch: Partial<UserProfile>) => void;
  onSkip: () => void;
}

interface Persona {
  id: string;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  patch: Partial<UserProfile>;
}

function activityFor(type: Activity, label?: string): UserProfile['activities'] {
  return [{ id: `act-${type}-${Date.now()}`, type, isPrimary: true, label }];
}

const PERSONAS: Persona[] = [
  {
    id: 'freelance',
    label: 'Freelance / consultant',
    hint: 'TJM × jours travaillés (dev, design, conseil)',
    Icon: Briefcase,
    patch: {
      revenueModel: 'days',
      activities: activityFor('liberalSsi', 'Conseil indépendant'),
      activity: 'liberalSsi',
      cfpEnabled: true,
      taxeConsulaireEnabled: false,
    },
  },
  {
    id: 'artisan',
    label: 'Artisan / prestataire forfait',
    hint: 'Devis ponctuels datés (BTP, plomberie, dev web)',
    Icon: Hammer,
    patch: {
      revenueModel: 'forfait',
      activities: activityFor('serviceBic', 'Prestations'),
      activity: 'serviceBic',
      cfpEnabled: true,
      taxeConsulaireEnabled: true,
    },
  },
  {
    id: 'ecommerce',
    label: 'E-commerce / marketplace',
    hint: 'Vente en ligne (Shopify, Etsy, Vinted)',
    Icon: ShoppingBag,
    patch: {
      revenueModel: 'flat',
      activities: activityFor('vente', 'Vente en ligne'),
      activity: 'vente',
      cfpEnabled: true,
      taxeConsulaireEnabled: true,
    },
  },
  {
    id: 'vtc',
    label: 'VTC / livreur',
    hint: 'Courses agrégées (Uber, Deliveroo, taxi)',
    Icon: Car,
    patch: {
      revenueModel: 'flat',
      activities: activityFor('serviceBic', 'Transport / livraison'),
      activity: 'serviceBic',
      cfpEnabled: true,
      taxeConsulaireEnabled: false,
    },
  },
  {
    id: 'meuble',
    label: 'Loueur meublé / hôte',
    hint: 'Saisonnalité (Airbnb, gîte, chambre d\'hôte)',
    Icon: HomeIcon,
    patch: {
      revenueModel: 'flat',
      activities: activityFor('vente', 'Location meublée'),
      activity: 'vente',
      cfpEnabled: false,
      taxeConsulaireEnabled: false,
    },
  },
  {
    id: 'libre',
    label: 'Configuration libre',
    hint: 'Je règle tout moi-même dans les paramètres',
    Icon: Settings,
    patch: {},
  },
];

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const PersonaPicker: React.FC<PersonaPickerProps> = ({ open, onPick, onSkip }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    // Focus le premier persona button
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkipRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previousFocus?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={onSkip}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onSkip}
              aria-label="Fermer (configurer plus tard)"
              className="absolute top-4 right-4 w-9 h-9 rounded-xl text-on-surface-variant hover:bg-surface-highest/40 inline-flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id={titleId} className="font-headline text-xl font-black text-slate-900 pr-8">
              Bienvenue
            </h2>
            <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed pr-8">
              Quel profil correspond à votre activité ? Cela pré-remplit le mode de saisie et les options fiscales — vous pourrez tout ajuster ensuite.
            </p>

            <ul className="mt-5 space-y-2">
              {PERSONAS.map((p) => {
                const Icon = p.Icon;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onPick({ ...p.patch, onboardingDone: true })}
                      className={cn(
                        'flex w-full items-center gap-3 min-h-[64px] rounded-2xl border border-outline-variant/30 p-3 text-left transition-colors',
                        'hover:border-secondary hover:bg-secondary/5',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold text-slate-900">{p.label}</span>
                        <span className="text-[11px] text-on-surface-variant">{p.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
