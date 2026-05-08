import React from 'react';
import { Pencil, Wallet } from 'lucide-react';
import { cn } from '~/utils';
import { formatEuro } from '~/lib/format';
import { formatDateFR, formatDaysFR } from '~/lib/calendar';
import { ThresholdGauge, type GaugeStatusKind } from '~/components/ThresholdGauge';
import type { TVAStatus } from '~/types';

interface KeyMetricsProps {
  caCumule: number;
  caRealise: number;
  /** Net cumulé estimé : CA cumulé − URSSAF − charges fixes (× mois actifs) − IR. */
  netCumule: number;
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
  /** Seuil basique de franchise en base TVA pour l'activité courante. */
  seuilTVA: number;
  /** Statut TVA dérivé du CA cumulé. */
  tvaStatus: TVAStatus;
  /** Date projetée de bascule TVA, ou null si non dépassé. */
  tvaSeuilDate: Date | null;
  /** True si l'utilisateur facture déjà la TVA → masque la jauge, affiche un badge. */
  tvaAssujetti: boolean;
}

export const KeyMetrics: React.FC<KeyMetricsProps> = ({
  caCumule,
  caRealise,
  netCumule,
  seuilMicro,
  monthName,
  caMensuel,
  netMensuel,
  joursTravailes,
  missionStart,
  seuilDate,
  onEditMissionStart,
  seuilTVA,
  tvaStatus,
  tvaSeuilDate,
  tvaAssujetti,
}) => {
  const realisedPct = Math.min(100, (caRealise / seuilMicro) * 100);
  const projectedPct = Math.min(100, (caCumule / seuilMicro) * 100);
  const margeRestante = Math.max(0, seuilMicro - caCumule);
  const tauxNet = caMensuel > 0 ? Math.round((netMensuel / caMensuel) * 100) : 0;
  const tauxRetentionAnnuel = caCumule > 0 ? Math.round((netCumule / caCumule) * 100) : 0;

  // La date renvoyée par calcSeuilDate peut être passée (dépassement déjà acté)
  // ou future (projection à venir). On distingue les deux cas.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seuilDateIsPast = seuilDate ? seuilDate.getTime() < today.getTime() : false;

  const seuilTone: GaugeStatusKind = seuilDate
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

  // --- Bloc TVA ---
  const tvaRealisedPct = Math.min(100, (caRealise / seuilTVA) * 100);
  const tvaProjectedPct = Math.min(100, (caCumule / seuilTVA) * 100);
  const tvaMargeRestante = Math.max(0, seuilTVA - caCumule);
  const tvaSeuilDateIsPast = tvaSeuilDate ? tvaSeuilDate.getTime() < today.getTime() : false;

  const tvaTone: GaugeStatusKind =
    tvaStatus === 'breach' ? 'overflow' : tvaStatus === 'warning' ? 'projected' : 'safe';

  const tvaLabel = (() => {
    if (tvaStatus === 'safe') return `TVA non applicable · marge ${formatEuro(tvaMargeRestante)} €`;
    if (!tvaSeuilDate) {
      return tvaStatus === 'breach'
        ? 'Seuil TVA dépassé — bascule obligatoire'
        : 'Seuil TVA atteint — vigilance';
    }
    const { day, monthName, year } = formatDateFR(tvaSeuilDate);
    const dateStr = `${day} ${monthName.toLowerCase()} ${year}`;
    return tvaSeuilDateIsPast
      ? `Seuil TVA dépassé le ${dateStr} — bascule obligatoire`
      : `Bascule TVA projetée le ${dateStr}`;
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
          {tvaAssujetti && (
            <div className="absolute top-0 right-0 z-10">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-amber-400/15 text-amber-200">
                TVA assujettie
              </span>
            </div>
          )}

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

          {/* Net cumulé estimé — sous-info juste sous le CA */}
          {netCumule > 0 && (
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-secondary-container/85 font-bold">
                <Wallet className="w-3 h-3" aria-hidden="true" />
                Net cumulé estimé
              </span>
              <span className="inline-flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-secondary-container">
                  {formatEuro(netCumule)} €
                </span>
                <span
                  className={cn(
                    'text-[11px] font-bold font-mono tabular-nums',
                    tauxRetentionAnnuel >= 60
                      ? 'text-secondary-container'
                      : tauxRetentionAnnuel >= 40
                        ? 'text-amber-300'
                        : 'text-red-300',
                  )}
                  title="Taux de rétention annuel (net cumulé / CA cumulé)"
                >
                  · {tauxRetentionAnnuel}%
                </span>
              </span>
            </div>
          )}

          <div className="text-[11px] text-secondary-container/85 font-mono tabular-nums mt-2 flex items-center gap-1.5 flex-wrap">
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

          <ThresholdGauge
            realizedPct={realisedPct}
            projectedPct={projectedPct}
            tone="mint"
            status={{ kind: seuilTone, label: seuilLabel }}
            ariaLabel="Progression CA réalisé vs seuil micro"
          />

          {/* Sous-bloc Seuil TVA (caché si déjà assujetti) */}
          {!tvaAssujetti && (
            <div className="mt-5 pt-5 border-t border-white/8">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/85">
                Seuil TVA · franchise en base
              </span>
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <span className="font-mono tabular-nums text-lg sm:text-xl font-bold truncate">
                  {formatEuro(caCumule)}<span className="text-amber-200">€</span>
                </span>
                <span className="text-xs text-amber-200/85 font-mono tabular-nums shrink-0">
                  / {formatEuro(seuilTVA)}€
                </span>
              </div>
              <ThresholdGauge
                realizedPct={tvaRealisedPct}
                projectedPct={tvaProjectedPct}
                tone="amber"
                status={{ kind: tvaTone, label: tvaLabel }}
                ariaLabel="Progression CA réalisé vs seuil TVA"
              />
            </div>
          )}
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
