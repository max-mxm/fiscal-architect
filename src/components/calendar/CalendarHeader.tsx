import React from 'react';
import { Sparkles, Trash2, Share2, CalendarDays, RotateCcw } from 'lucide-react';
import { formatEuro } from '~/lib/format';

interface CalendarHeaderProps {
  year: number;
  missionStart: string;
  onMissionStartChange: (value: string) => void;
  caRealise: number;
  caCumule: number;
  selectedMonthShort: string;
  onFillMonth: () => void;
  onFillAll: () => void;
  onClearMonth: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onReset: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  year,
  missionStart,
  onMissionStartChange,
  caRealise,
  caCumule,
  selectedMonthShort,
  onFillMonth,
  onFillAll,
  onClearMonth,
  onClearAll,
  onExport,
  onReset,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-on-surface-variant text-xs font-medium tracking-widest uppercase">Année fiscale {year}</h2>
        <div className="flex items-center gap-1.5 bg-surface-lowest rounded-lg px-2.5 py-1.5 shadow-sm">
          <CalendarDays className="w-3.5 h-3.5 text-on-surface-variant" />
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:inline">Début</label>
          <input
            type="date"
            value={missionStart}
            onChange={(e) => onMissionStartChange(e.target.value)}
            min={`${year}-01-01`}
            max={`${year}-12-31`}
            className="bg-transparent text-xs font-bold text-secondary border-none p-0 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-baseline gap-4 flex-wrap">
        <h1 className="font-headline font-extrabold text-3xl leading-none tracking-tighter text-slate-900">
          {formatEuro(caRealise)}€ <span className="text-slate-400 text-lg font-bold ml-1">Réalisé</span>
        </h1>
        <span className="font-headline font-bold text-xl leading-none tracking-tighter text-on-surface-variant/40">
          {formatEuro(caCumule)}€ <span className="text-secondary text-sm font-bold ml-0.5">Projeté</span>
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 bg-surface-lowest rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={onFillMonth}
          title={`Remplir ${selectedMonthShort}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-secondary bg-secondary/5 hover:bg-secondary/15 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mois</span>
        </button>
        <button
          onClick={onFillAll}
          title="Remplir toute l'année"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Année</span>
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <button
          onClick={onClearMonth}
          title={`Effacer ${selectedMonthShort}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mois</span>
        </button>
        <button
          onClick={onClearAll}
          title="Effacer toute l'année"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Année</span>
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <button
          onClick={onExport}
          title="Exporter CSV"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          onClick={onReset}
          title="Tout réinitialiser"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
};
