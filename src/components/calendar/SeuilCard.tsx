import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { formatEuro } from '~/lib/format';
import { formatDateFR } from '~/lib/calendar';

interface SeuilCardProps {
  seuilDate: Date | null;
  totalWorkedDays: number;
  caCumule: number;
  seuilMicro: number;
  progressPercent: number;
  remainingDays: number;
  joursNonTravailles: number;
}

export const SeuilCard: React.FC<SeuilCardProps> = ({
  seuilDate,
  totalWorkedDays,
  caCumule,
  seuilMicro,
  progressPercent,
  remainingDays,
  joursNonTravailles,
}) => {
  return (
    <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="bg-white/10 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-widest uppercase">
            {seuilDate ? 'Prévision plafond' : 'Statut micro'}
          </span>
        </div>
        <h3 className="font-headline text-lg font-bold mb-1">Seuil micro-entreprise</h3>

        {seuilDate ? (
          <>
            <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
              Franchissement estimé du plafond :
            </p>
            {(() => {
              const { day, monthName, year: y } = formatDateFR(seuilDate);
              return (
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-2xl font-black font-headline tracking-tight">{day} {monthName.toLowerCase()}</span>
                  <span className="text-secondary font-bold text-xs">{y}</span>
                </div>
              );
            })()}
          </>
        ) : totalWorkedDays > 0 ? (
          <div className="mb-4">
            <p className="text-secondary text-xs font-bold mb-2">Vous restez sous le seuil cette année.</p>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Marge restante : {formatEuro(seuilMicro - caCumule)}€
            </p>
          </div>
        ) : (
          <p className="text-slate-400 text-xs mb-4 font-medium leading-relaxed">
            Ajoutez des jours pour estimer votre projection annuelle.
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
            <span>Progression</span>
            <span>{formatEuro(caCumule)}€ / {formatEuro(seuilMicro)}€</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-secondary/80 font-medium">
              {caCumule >= seuilMicro
                ? 'Seuil micro-entreprise atteint.'
                : seuilDate
                  ? `~${remainingDays} jours facturables restants avant passage TVA.`
                  : `${joursNonTravailles} jours ouvrés disponibles restants.`
              }
            </p>
            <Link to="/profile" className="text-[11px] text-slate-500 hover:text-secondary transition-colors underline underline-offset-2">
              Modifier
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-secondary/20 blur-[60px] rounded-full" />
    </div>
  );
};
