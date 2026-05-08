import React from 'react';
import { Building2 } from 'lucide-react';
import { COMPTE_PRO_THRESHOLD } from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';

interface CompteProAlerteProps {
  caCumule: number;
}

export const CompteProAlerte: React.FC<CompteProAlerteProps> = ({ caCumule }) => {
  if (caCumule <= COMPTE_PRO_THRESHOLD) return null;

  return (
    <div
      role="status"
      className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
      >
        <Building2 className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">
          Compte bancaire dédié obligatoire
        </p>
        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
          Votre CA cumulé ({formatEuro(caCumule)}€) dépasse {formatEuro(COMPTE_PRO_THRESHOLD)}€.
          Au-delà de ce seuil sur 2 années consécutives, un compte bancaire dédié à l'activité
          est requis (article L.123-24 du Code de commerce).
        </p>
      </div>
    </div>
  );
};
