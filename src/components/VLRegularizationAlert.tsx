import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { calcVLEligibility, monthHasRevenue } from '~/lib/fiscal';
import { calcVLRegularization } from '~/lib/vlRegularization';
import { formatEuro } from '~/lib/format';
import type { CalendarMonth, UserProfile } from '~/types';

interface VLRegularizationAlertProps {
  profile: UserProfile;
  months: CalendarMonth[];
}

export const VLRegularizationAlert: React.FC<VLRegularizationAlertProps> = ({ profile, months }) => {
  const eligibility = calcVLEligibility(profile.rfrN2, profile.partsFiscales);
  const fallbackMonths = useMemo(
    () => months.filter(monthHasRevenue).map((month) => month.month),
    [months],
  );
  const selectedMonths = profile.vlRegularizationMonths ?? fallbackMonths;
  const estimate = useMemo(
    () => calcVLRegularization(months, profile, selectedMonths),
    [months, profile, selectedMonths],
  );

  if (!profile.versementLiberatoire || eligibility.motif !== 'rfr-too-high') return null;

  return (
    <section
      aria-labelledby="vl-regularization-alert-title"
      className="rounded-3xl border border-red-200/80 bg-red-50/90 p-4 sm:p-5 dark:border-red-500/30 dark:bg-red-500/10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="vl-regularization-alert-title" className="font-headline text-sm font-bold text-red-900 dark:text-red-200">
              Versement libératoire potentiellement appliqué à tort
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-red-800 dark:text-red-300">
              Le RFR N-2 renseigné dépasse le plafond. Estimation actuelle à provisionner :{' '}
              <strong className="font-mono tabular-nums">{formatEuro(Math.round(estimate.amountToProvision))} €</strong>.
            </p>
          </div>
        </div>
        <Link
          to="/regularisation-vl"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 dark:bg-red-300 dark:text-red-950 dark:hover:bg-red-200 transition-colors"
        >
          Vérifier les mois
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
