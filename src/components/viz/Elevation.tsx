import React, { useEffect, useMemo, useRef, useState } from 'react';
import { eur } from '~/ui/Money';
import { FAMILY, type Family } from '~/ui/families';
import { cn } from '~/utils';

/** Série cumulée : une valeur par point de l'axe (null = pas de trait à cet endroit). */
export interface ElevationSeries {
  key: string;
  label: string;
  values: Array<number | null>;
  /** Continu = réalisé, pointillé = projeté. */
  line: 'solid' | 'dashed';
  /** Marches (encaissements) plutôt que segments droits. */
  step?: boolean;
  weight?: 'strong' | 'normal';
  family?: Family;
  /** Remplit l'aire sous la courbe avec la teinte de la famille. */
  area?: boolean;
}

export interface ElevationDatum {
  key: string;
  label: string;
  value: number;
  /** Couleur du seuil : TVA en violet, plafond en jaune ou rouge… */
  family?: Family;
  /** Date de franchissement à repérer sur l'axe. */
  crossing?: { position: number; label: string } | null;
}

interface ElevationProps {
  /** Libellés de l'axe horizontal (un par point, le premier est l'origine). */
  ticks: string[];
  series: ElevationSeries[];
  datums?: ElevationDatum[];
  /** Position (index fractionnaire) du jour. */
  today?: number | null;
  height?: number;
  ariaLabel: string;
  className?: string;
}

const PAD = { top: 26, right: 8, bottom: 26, left: 8 };

let measureCtx: CanvasRenderingContext2D | null = null;
/** Largeur réelle d'un libellé, pour dimensionner sa pastille. */
function measure(text: string, font: string): number {
  if (typeof document === 'undefined') return text.length * 6.3;
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * 6.3;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

/**
 * Courbe cumulée et seuils : chaque seuil est une ligne pointillée de sa
 * couleur, avec son étiquette et la date de franchissement repérée sur l'axe.
 */
export function Elevation({ ticks, series, datums = [], today, height = 220, ariaLabel, className }: ElevationProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const n = ticks.length - 1;
  const max = useMemo(() => {
    const vals = series.flatMap((s) => s.values.filter((v): v is number => v != null));
    return Math.max(1, ...vals, ...datums.map((d) => d.value)) * 1.1;
  }, [series, datums]);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n > 0 ? (i / n) * innerW : 0);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const path = (s: ElevationSeries) => {
    let d = '';
    let started = false;
    s.values.forEach((v, i) => {
      if (v == null) {
        started = false;
        return;
      }
      if (!started) d += `M${x(i)},${y(v)}`;
      else if (s.step) d += `H${x(i)}V${y(v)}`;
      else d += `L${x(i)},${y(v)}`;
      started = true;
    });
    return d;
  };

  const font = (weight: number, size: number) => ({ font: `${weight} ${size}px var(--font-sans)` });

  return (
    <div ref={ref} className={cn('relative w-full', className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--color-line-2)" strokeWidth={1} />
          {ticks.map((t, i) =>
            t ? (
              <text
                key={i}
                x={i === 0 ? x(i) : x(i) - (x(1) - x(0)) / 2}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : 'middle'}
                fill="var(--color-ink-3)"
                style={font(600, 11)}
              >
                {t}
              </text>
            ) : null,
          )}

          {series
            .filter((s) => s.area)
            .map((s) => {
              const idx = s.values.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0);
              if (idx.length === 0) return null;
              return (
                <path
                  key={`${s.key}-aire`}
                  d={`${path(s)}L${x(idx[idx.length - 1])},${y(0)}L${x(idx[0])},${y(0)}Z`}
                  fill={FAMILY[s.family ?? 'ca'].color}
                  opacity={0.12}
                />
              );
            })}

          {datums.map((d) => {
            const fam = FAMILY[d.family ?? 'charges'];
            const color = fam.color;
            const yy = y(d.value);
            const text = `${d.label} · ${eur(d.value)}`;
            const textW = measure(text, '700 11px Figtree, sans-serif');
            return (
              <g key={d.key}>
                <line x1={PAD.left} x2={width - PAD.right} y1={yy} y2={yy} stroke={color} strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />
                <g transform={`translate(${PAD.left} ${yy - 23})`}>
                  <rect width={textW + 18} height={19} rx={9.5} fill={color} />
                  <text x={9} y={13.5} fill={fam.onColor} style={font(700, 11)}>
                    {text}
                  </text>
                </g>
                {d.crossing && (
                  <g>
                    <line x1={x(d.crossing.position)} x2={x(d.crossing.position)} y1={yy} y2={y(0)} stroke={color} strokeWidth={1.5} strokeDasharray="2 4" />
                    <text
                      x={Math.min(Math.max(x(d.crossing.position), PAD.left + 24), width - PAD.right - 24)}
                      y={y(0) - 7}
                      textAnchor="middle"
                      fill={fam.inkColor}
                      stroke="var(--color-card)"
                      strokeWidth={4}
                      paintOrder="stroke"
                      style={font(800, 11)}
                    >
                      {d.crossing.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {series.map((s) => (
            <path
              key={s.key}
              d={path(s)}
              fill="none"
              stroke={FAMILY[s.family ?? 'ca'].color}
              strokeWidth={s.weight === 'strong' ? 3 : 2}
              strokeDasharray={s.line === 'dashed' ? '1 6' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={s.weight === 'strong' ? 1 : 0.8}
            />
          ))}

          {datums
            .filter((d) => d.crossing)
            .map((d) => (
              <circle
                key={`${d.key}-point`}
                cx={x(d.crossing!.position)}
                cy={y(d.value)}
                r={6}
                fill={FAMILY[d.family ?? 'charges'].color}
                stroke="var(--color-card)"
                strokeWidth={2.5}
              />
            ))}

          {today != null && today >= 0 && today <= n && (
            <g>
              <line x1={x(today)} x2={x(today)} y1={PAD.top - 8} y2={y(0)} stroke="var(--color-ink)" strokeWidth={1} strokeDasharray="1 3" />
              <text x={x(today)} y={PAD.top - 12} textAnchor="middle" fill="var(--color-ink)" style={font(700, 11)}>
                aujourd’hui
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
