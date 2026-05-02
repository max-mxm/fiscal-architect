import React from 'react';
import { AlertTriangle, CalendarClock, Pencil } from 'lucide-react';
import { cn } from '~/utils';
import { formatEuro } from '~/lib/format';
import { formatDateFR, formatDaysFR } from '~/lib/calendar';

interface KeyMetricsProps {
  caCumule: number;
  caRealise: number;
  seuilMicro: number;
  /** Nom du mois sélectionné (ex. "Mai"). */
  monthName: string;
  /** CA brut du mois sélectionné (basé sur les jours cochés × TJM). */
  caMensuel: number;
  /** Net après URSSAF + charges + IR du mois sélectionné. */
  netMensuel: number;
  /** Nombre équivalent de jours travaillés du mois sélectionné (demi inclus). */
  joursTravailes: number;
  missionStart: string;
  /** Date de franchissement projetée du seuil micro, ou null si pas dépassé. */
  seuilDate: Date | null;
  onEditMissionStart: () => void;
}

export const KeyMetrics: React.FC<KeyMetricsProps> = ({
  caCumule,
  caRealise,
  seuilMicro,
  monthName,
  caMensuel,
  netMensuel,
  joursTravailes,
  missionStart,
  seuilDate,
  onEditMissionStart,
}) => {
  const realisedPct = Math.min(100, (caRealise / seuilMicro) * 100);
  const projectedPct = Math.min(100, (caCumule / seuilMicro) * 100);
  const overflow = caCumule >= seuilMicro;
  const margeRestante = Math.max(0, seuilMicro - caCumule);
  const tauxNet = caMensuel > 0 ? Math.round((netMensuel / caMensuel) * 100) : 0;

  // La date renvoyée par calcSeuilDate peut être passée (dépassement déjà acté)
  // ou future (projection à venir). On distingue les deux cas.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seuilDateIsPast = seuilDate ? seuilDate.getTime() < today.getTime() : false;

  const seuilTone: 'overflow' | 'projected' | 'safe' = seuilDate
    ? seuilDateIsPast
      ? 'overflow'
      : 'projected'
    : 'safe';

  const seuilLabel = (() => {
    if (!seuilDate) return `Marge restante · ${formatEuro(margeRestante)} €`;
    const { day, monthName, year } = formatDateFR(seuilDate);
    const dateStr = `${day} ${monthName.toLowerCase()} ${year}`;
    return seuilDateIsPast
      ? `Seuil dépassé le ${dateStr}`
      : `Franchissement projeté le ${dateStr}`;
  })();

  const startLabel = (() => {
    try {
      const d = new Date(missionStart);
      if (isNaN(d.getTime())) return missionStart;
      const { day, monthName } = formatDateFR(d);
      return `${day} ${monthName.toLowerCase()}`;
    } catch {
      return missionStart;
    }
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
      {/* Hero sombre — CA cumulé / seuil */}
      <section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-2xl lg:col-span-7"
        aria-labelledby="kpi-ca-label"
      >
        <div className="relative z-10">
          <span
            id="kpi-ca-label"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-container/85"
          >
            CA cumulé · seuil micro
          </span>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <span className="font-headline font-black text-2xl sm:text-3xl font-mono tabular-nums truncate">
              {formatEuro(caCumule)}<span className="text-secondary-container">€</span>
            </span>
            <span className="text-xs text-secondary-container/85 font-mono tabular-nums shrink-0">
              / {formatEuro(seuilMicro)}€
            </span>
          </div>
          <div className="text-[11px] text-secondary-container/85 font-mono tabular-nums mt-1 flex items-center gap-1.5 flex-wrap">
            <span>
              Réalisé <span className="text-white">{formatEuro(caRealise)}€</span>
              <span className="mx-1">·</span>
              Projeté <span className="text-white">{formatEuro(caCumule)}€</span>
            </span>
            <button
              type="button"
              onClick={onEditMissionStart}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              aria-label="Modifier la date de début de mission"
              title="Modifier la date de début de mission"
            >
              depuis le {startLabel}
              <Pencil className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Double progress bar — Réalisé (plein) + Projeté (fantôme overlay) */}
          <div className="mt-4 relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-secondary-container/30"
              style={{ width: `${projectedPct}%` }}
              aria-hidden="true"
            />
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all',
                overflow ? 'bg-red-400' : 'bg-secondary-container',
              )}
              style={{ width: `${realisedPct}%` }}
              role="progressbar"
              aria-label="Progression CA réalisé vs seuil micro"
              aria-valuenow={Math.round(realisedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-secondary-container/70 font-bold">
            <span>{Math.round(realisedPct)}% réalisé</span>
            <span>{Math.round(projectedPct)}% projeté</span>
          </div>

          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
              seuilTone === 'overflow' && 'bg-red-500/15 text-red-200',
              seuilTone === 'projected' && 'bg-amber-400/10 text-amber-200',
              seuilTone === 'safe' && 'bg-secondary-container/15 text-secondary-container',
            )}
          >
            {seuilTone === 'overflow' ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <CalendarClock className="w-3 h-3" />
            )}
            <span className="tracking-tight">{seuilLabel}</span>
          </div>
        </div>
        <div
          className="hidden md:block motion-reduce:hidden absolute -right-12 -bottom-12 w-32 h-32 bg-secondary-container/20 blur-[60px] rounded-full"
          aria-hidden="true"
        />
      </section>

      {/* Card claire — récap du mois sélectionné (alignée avec SlidersBlock en dessous) */}
      <section
        className="bg-surface-lowest rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-3 lg:col-span-5"
        aria-labelledby="kpi-net-label"
      >
        <div className="space-y-3">
          <span
            id="kpi-net-label"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant block"
          >
            {monthName}
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-on-surface-variant">CA brut</span>
            <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
              {formatEuro(caMensuel)} €
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-outline-variant/15">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Net après IR
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-headline font-black text-2xl sm:text-3xl font-mono tabular-nums text-secondary leading-none">
                {formatEuro(netMensuel)} €
              </span>
              {joursTravailes > 0 && (
                <span
                  className={cn(
                    'text-xs font-bold font-mono tabular-nums',
                    tauxNet >= 60
                      ? 'text-secondary'
                      : tauxNet >= 40
                        ? 'text-amber-700'
                        : 'text-red-600',
                  )}
                  title="Taux de rétention (net / brut)"
                >
                  · {tauxNet}%
                </span>
              )}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          {joursTravailes > 0
            ? `${formatDaysFR(joursTravailes)} jour${joursTravailes > 1 ? 's' : ''} travaillé${joursTravailes > 1 ? 's' : ''}`
            : 'Aucun jour sélectionné'}
        </p>
      </section>
    </div>
  );
};
