import React, { useEffect, useState } from 'react';
import type { ActivityEntry, RevenueEntry } from '~/types';
import { formatEuro } from '~/lib/format';
import { calcInvoiceTotals } from '~/lib/fiscal';
import { ActivityChip } from '~/components/fiscal/ActivityChip';

interface FlatRevenueInputProps {
  entries: RevenueEntry[];
  monthName: string;
  onChange: (next: RevenueEntry[]) => void;
  activities: ActivityEntry[];
  tvaAssujetti: boolean;
  tvaRate: number;
}

export const FlatRevenueInput: React.FC<FlatRevenueInputProps> = ({ entries, monthName, onChange, activities, tvaAssujetti, tvaRate }) => {
  const multi = activities.length > 1;
  const flat = entries.find((e): e is Extract<RevenueEntry, { kind: 'flat' }> => e.kind === 'flat');
  const invoice = calcInvoiceTotals(flat?.amount ?? 0, tvaAssujetti, tvaRate);
  const [draft, setDraft] = useState<string>(flat ? String(flat.amount) : '');

  useEffect(() => {
    setDraft(flat ? String(flat.amount) : '');
  }, [flat?.amount, flat?.id]);

  const apply = (raw: string) => {
    const parsed = parseFloat(raw);
    const amount = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    const others = entries.filter((e) => e.kind !== 'flat');
    if (amount === 0) {
      onChange(others);
      return;
    }
    const next: RevenueEntry = {
      kind: 'flat',
      id: flat?.id ?? `flat-${Date.now()}`,
      amount,
      label: flat?.label,
      activityId: flat?.activityId,
    };
    onChange([...others, next]);
  };

  const setActivity = (id: string) => {
    const others = entries.filter((e) => e.kind !== 'flat');
    if (!flat) return;
    onChange([...others, { ...flat, activityId: id }]);
  };

  return (
    <section className="bg-surface-lowest rounded-3xl shadow-sm p-5 space-y-4">
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface">{monthName}</h2>
        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
          Montant de facture / encaissement, hors taxes
        </p>
      </div>

      <div className="bg-surface-highest/20 rounded-2xl p-5">
        <label
          htmlFor="flat-revenue-input"
          className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2"
        >
          Chiffre d'affaires HT
        </label>
        <div className="flex items-baseline gap-2">
          <input
            id="flat-revenue-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            placeholder="0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => apply(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply(draft);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="font-headline font-black text-3xl text-on-surface bg-transparent border-b-2 border-secondary/30 focus:border-secondary focus:ring-0 outline-none flex-1 min-w-0 tabular-nums appearance-none"
          />
          <span className="font-headline font-black text-2xl text-secondary">€</span>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-3 leading-relaxed">
          Saisissez le total HT encaissé ce mois-ci (toutes sources confondues).
          {flat && flat.amount > 0 && (
            <span className="block mt-1 font-mono tabular-nums">
              Enregistré : {formatEuro(flat.amount)}€
            </span>
          )}
        </p>
        {tvaAssujetti && flat && flat.amount > 0 && (
          <div className="mt-3 rounded-xl bg-tax-container/70 px-3 py-2.5 text-xs">
            <div className="flex justify-between gap-3 text-on-surface-variant"><span>TVA collectée ({Math.round(tvaRate * 10000) / 100} %)</span><span className="font-mono font-bold tabular-nums text-tax">{formatEuro(invoice.tva)} €</span></div>
            <div className="mt-1 flex justify-between gap-3 font-bold text-tax"><span>Encaissement TTC</span><span className="font-mono tabular-nums">{formatEuro(invoice.ttc)} €</span></div>
          </div>
        )}
      </div>

      {multi && flat && flat.amount > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Activité
          </span>
          <ActivityChip activities={activities} value={flat.activityId} onChange={setActivity} />
        </div>
      )}
    </section>
  );
};
