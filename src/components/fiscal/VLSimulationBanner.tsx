import React from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { eur } from '~/ui/Money';
import { cn } from '~/utils';

/** Vrai quand le versement libératoire est activé alors que le RFR le rend indisponible. */
export function useVLSimulation(): { active: boolean; rfrYear: number; threshold: number } {
  const { profile } = useProfile();
  const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, profile.year);
  return {
    active: profile.versementLiberatoire && elig.motif === 'rfr-too-high',
    rfrYear: elig.rfrYear,
    threshold: elig.threshold,
  };
}

/**
 * Bandeau très visible tant que le versement libératoire est simulé hors droits :
 * les montants affichés supposent le VL, mais l'impôt réel sera calculé au barème.
 */
export function VLSimulationBanner({ className }: { className?: string }) {
  const { profile, setProfile } = useProfile();
  const sim = useVLSimulation();
  if (!sim.active) return null;
  return (
    <section
      role="alert"
      aria-label="Simulation du versement libératoire hors droits"
      className={cn('flex flex-col gap-2 rounded-[14px] bg-alert-strong px-4 py-3 text-alert-on shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-4', className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
          <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold leading-snug">Simulation : versement libératoire sans y avoir droit</p>
          <p className="mt-0.5 text-[13px] leading-snug text-alert-on">
            <span className="sm:hidden">L’impôt réel de {profile.year} sera calculé au barème.</span>
            <span className="hidden sm:inline">
              Revenu fiscal de référence {sim.rfrYear} au-dessus du plafond de {eur(sim.threshold)} : en {profile.year}, l’impôt réel sera calculé au
              barème. Les montants affichés supposent le VL.
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Link
          to="/regularisation-vl"
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[14px] font-bold underline decoration-white/50 underline-offset-2 hover:decoration-white focus-visible:outline-white"
        >
          Rattrapage <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setProfile((p) => ({ ...p, versementLiberatoire: false }))}
          className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-[14px] font-extrabold text-alert-strong transition-colors hover:bg-white/90 focus-visible:outline-white"
        >
          Désactiver
        </button>
      </div>
    </section>
  );
}
