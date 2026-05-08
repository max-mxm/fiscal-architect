import React, { useMemo } from 'react';
import { AlertTriangle, Download, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '~/utils';
import type { UserProfile } from '~/types';
import { calcCAannuel } from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';

interface TopBarProps {
  profile: UserProfile;
  caCumule: number;
  onExport: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ profile, caCumule, onExport, onOpenSettings }) => {
  const seuil = profile.seuilMicro;
  const caProjete = useMemo(
    () => calcCAannuel(profile.tjm, profile.workingDays),
    [profile.tjm, profile.workingDays],
  );

  const pctReal = Math.min(100, (caCumule / seuil) * 100);
  const pctProj = Math.min(100, (caProjete / seuil) * 100);
  const showAlert = pctProj >= 80;
  const isOver = caCumule >= seuil;

  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
        {/* Brand + identité */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center font-headline font-black text-sm shadow-md shrink-0"
          >
            FA
          </div>
          <div className="min-w-0">
            <h1 className="font-headline font-black text-sm sm:text-base text-slate-900 leading-tight truncate">
              Fiscal Architect
            </h1>
            <p className="text-[11px] text-on-surface-variant leading-tight truncate max-w-[180px] sm:max-w-[280px] md:max-w-none">
              <span className="font-semibold">{profile.name}</span>
              <span className="hidden sm:inline"> · {profile.role}</span>
            </p>
          </div>
        </div>

        {/* KPI inline (md+) */}
        <div className="hidden md:flex items-center gap-3 min-w-0 flex-1 max-w-md mx-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>CA / seuil</span>
              <span className="font-mono tabular-nums text-slate-700">
                {formatEuro(caCumule)}€
                <span className="text-slate-500 font-normal"> / {formatEuro(seuil)}€</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-surface-highest/60 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', isOver ? 'bg-red-500' : 'bg-secondary')}
                style={{ width: `${pctReal}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onExport}
            aria-label="Exporter en CSV"
            title="Exporter en CSV"
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Ouvrir les réglages"
            title="Réglages"
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showAlert && (
        <div
          className={cn(
            'w-full px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium border-t',
            isOver
              ? 'bg-red-50 text-red-700 border-red-200/60'
              : 'bg-amber-50 text-amber-700 border-amber-200/60',
          )}
          role="status"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isOver
              ? `Seuil micro dépassé — ${formatEuro(caCumule)}€ / ${formatEuro(seuil)}€`
              : `${pctProj.toFixed(0)}% du seuil micro projeté — ${formatEuro(caProjete)}€ / ${formatEuro(seuil)}€`}
          </span>
        </div>
      )}
    </header>
  );
};
