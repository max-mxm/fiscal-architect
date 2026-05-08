import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Check } from 'lucide-react';
import type { ActivityEntry, RevenueEntry } from '~/types';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';
import { ActivityChip } from '~/components/fiscal/ActivityChip';

interface ForfaitListProps {
  /** Toutes les entries du mois — on filtre les `forfait` ici. */
  entries: RevenueEntry[];
  year: number;
  /** 0-11 */
  monthIndex: number;
  monthName: string;
  onChange: (next: RevenueEntry[]) => void;
  /** Liste des activités du profil — affiche un sélecteur si > 1. */
  activities: ActivityEntry[];
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatForfaitDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export const ForfaitList: React.FC<ForfaitListProps> = ({ entries, year, monthIndex, monthName, onChange, activities }) => {
  const multi = activities.length > 1;
  const primaryId = activities.find((a) => a.isPrimary)?.id ?? activities[0]?.id ?? '';
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({
    date: `${year}-${pad2(monthIndex + 1)}-01`,
    amount: '',
    label: '',
    activityId: primaryId,
  });

  const forfaits = entries.filter((e): e is Extract<RevenueEntry, { kind: 'forfait' }> => e.kind === 'forfait');
  const total = forfaits.reduce((s, f) => s + f.amount, 0);
  const monthMin = `${year}-${pad2(monthIndex + 1)}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthMax = `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`;

  const handleAdd = useCallback(() => {
    const amount = parseFloat(draft.amount);
    if (isNaN(amount) || amount <= 0 || !draft.date) return;
    const next: RevenueEntry = {
      kind: 'forfait',
      id: Date.now().toString(),
      date: draft.date,
      amount,
      label: draft.label.trim() || undefined,
      activityId: multi ? draft.activityId : undefined,
    };
    onChange([...entries, next]);
    setDraft({ date: monthMin, amount: '', label: '', activityId: primaryId });
    setShowAdd(false);
  }, [draft, entries, onChange, monthMin, multi, primaryId]);

  const handleDelete = useCallback(
    (id: string) => {
      onChange(entries.filter((e) => e.id !== id));
    },
    [entries, onChange],
  );

  return (
    <section className="bg-surface-lowest rounded-3xl shadow-sm p-5">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="font-headline text-lg font-bold text-slate-900">{monthName}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
            {forfaits.length === 0
              ? 'Aucune prestation'
              : `${forfaits.length} prestation${forfaits.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
          className="text-secondary text-xs font-bold flex items-center gap-1 hover:opacity-70 transition-opacity min-h-[36px] px-2"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-surface-highest/20 p-3 rounded-xl space-y-2">
              <input
                type="text"
                placeholder="Libellé (optionnel — ex. Site web Acme)"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                aria-label="Libellé de la prestation"
                className="w-full bg-white border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={draft.date}
                  min={monthMin}
                  max={monthMax}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  aria-label="Date de la prestation"
                  className="flex-1 bg-white border-none rounded-lg py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  placeholder="Montant (€)"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  aria-label="Montant en euros"
                  className="w-32 bg-white border-none rounded-lg py-2 px-3 text-sm font-mono font-bold focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
                />
              </div>
              {multi && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Activité
                  </span>
                  <ActivityChip
                    activities={activities}
                    value={draft.activityId}
                    onChange={(id) => setDraft({ ...draft, activityId: id })}
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setDraft({ date: monthMin, amount: '', label: '', activityId: primaryId });
                  }}
                  className="px-3 min-h-[36px] text-xs font-bold text-on-surface-variant hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 min-h-[36px] bg-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="space-y-1">
        {forfaits.length === 0 && !showAdd && (
          <li className="text-xs text-slate-500 italic py-4 text-center">
            Aucune prestation pour {monthName}. Cliquez sur « Ajouter » pour saisir un devis ou une facture.
          </li>
        )}
        {forfaits
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((f) => (
            <li
              key={f.id}
              className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-highest/20 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-[11px] font-mono tabular-nums text-on-surface-variant w-14 shrink-0">
                  {formatForfaitDate(f.date)}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {f.label ?? 'Prestation'}
                  </span>
                  {multi && (() => {
                    const act = activities.find((a) => a.id === f.activityId) ?? activities.find((a) => a.isPrimary);
                    if (!act) return null;
                    const display = act.label?.trim() || ACTIVITY_PARAMS[act.type].label;
                    return (
                      <span className="text-[10px] text-on-surface-variant truncate">
                        {display}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                  {formatEuro(f.amount)}€
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(f.id)}
                  aria-label={`Supprimer ${f.label ?? 'la prestation'}`}
                  className="text-on-surface-variant hover:text-red-500 p-1.5 min-h-[32px] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
      </ul>

      <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-between items-center">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Total mois
        </span>
        <span className="font-headline font-black text-lg text-secondary font-mono tabular-nums">
          {formatEuro(total)}€
        </span>
      </div>
    </section>
  );
};
