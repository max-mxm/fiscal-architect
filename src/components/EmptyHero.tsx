import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatEuro } from '~/lib/format';

interface EmptyHeroProps {
  seuilMicro: number;
}

export const EmptyHero: React.FC<EmptyHeroProps> = ({ seuilMicro }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-8 shadow-2xl">
      <div className="relative z-10 flex flex-col gap-3">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-secondary-container" />
          Premier pas
        </span>
        <h2 className="font-headline text-2xl md:text-3xl font-black leading-tight">
          Commencez par cocher vos premiers jours travaillés
        </h2>
        <p className="text-secondary-container/85 text-sm md:text-base max-w-md leading-relaxed">
          Cliquez sur un jour du calendrier pour le marquer comme travaillé. Votre CA cumulé et la projection vers le seuil micro ({formatEuro(seuilMicro)} €) s'afficheront ici.
        </p>
      </div>
      <div className="motion-safe:hidden md:motion-safe:block absolute -right-12 -bottom-12 w-32 h-32 bg-secondary-container/20 blur-[60px] rounded-full" aria-hidden="true" />
    </div>
  );
};
