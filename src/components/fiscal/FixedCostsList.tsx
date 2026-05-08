import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { UserProfile } from '~/types';
import { formatEuro } from '~/lib/format';

type FixedCost = UserProfile['fixedCosts'][number];

interface FixedCostsListProps {
  costs: FixedCost[];
  onChange: (next: FixedCost[]) => void;
}

export const FixedCostsList: React.FC<FixedCostsListProps> = ({ costs, onChange }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', amount: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', amount: '' });

  const total = costs.reduce((s, c) => s + c.amount, 0);

  const handleAdd = useCallback(() => {
    const amount = parseFloat(draft.amount);
    if (!draft.name.trim() || isNaN(amount) || amount <= 0) return;
    onChange([
      ...costs,
      {
        id: Date.now().toString(),
        name: draft.name.trim(),
        description: '',
        amount,
        icon: 'receipt',
        color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
      },
    ]);
    setDraft({ name: '', amount: '' });
    setShowAdd(false);
  }, [draft, costs, onChange]);

  const handleDelete = useCallback((id: string) => {
    onChange(costs.filter((c) => c.id !== id));
  }, [costs, onChange]);

  const handleStartEdit = useCallback((cost: FixedCost) => {
    setEditingId(cost.id);
    setEditDraft({ name: cost.name, amount: cost.amount.toString() });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const amount = parseFloat(editDraft.amount);
    if (!editDraft.name.trim() || isNaN(amount) || amount <= 0) return;
    onChange(
      costs.map((c) =>
        c.id === editingId ? { ...c, name: editDraft.name.trim(), amount } : c,
      ),
    );
    setEditingId(null);
  }, [editingId, editDraft, costs, onChange]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">
          Charges fixes mensuelles
        </span>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
          className="text-secondary text-xs font-bold flex items-center gap-1 hover:opacity-70 transition-opacity min-h-[28px] px-2"
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
                placeholder="Libellé (ex. Espace coworking)"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
                aria-label="Libellé de la charge"
                className="w-full bg-surface-lowest border-none rounded-lg py-2 px-3 text-sm text-on-surface focus:ring-2 focus:ring-secondary/20 min-h-[40px]"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Montant (€)"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                aria-label="Montant en euros"
                className="w-full bg-surface-lowest border-none rounded-lg py-2 px-3 text-sm font-mono text-on-surface focus:ring-2 focus:ring-secondary/20 min-h-[40px]"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setDraft({ name: '', amount: '' }); }}
                  className="px-3 min-h-[36px] text-xs font-bold text-on-surface-variant hover:bg-surface-highest/40 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 min-h-[36px] bg-secondary text-on-secondary text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="space-y-1">
        {costs.length === 0 && (
          <li className="text-xs text-on-surface-variant italic py-2">
            Aucune charge fixe — ajoutez vos abonnements et frais récurrents.
          </li>
        )}
        {costs.map((cost) => (
          <li
            key={cost.id}
            className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-highest/20 transition-colors min-h-[40px]"
          >
            {editingId === cost.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  aria-label="Libellé"
                  className="bg-surface-lowest border-none rounded-md py-1.5 px-2 text-xs font-bold text-on-surface flex-1 focus:ring-2 focus:ring-secondary/20 min-h-[32px]"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={editDraft.amount}
                  onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  aria-label="Montant"
                  className="bg-surface-lowest border-none rounded-md py-1.5 px-2 text-xs font-bold font-mono text-on-surface w-20 focus:ring-2 focus:ring-secondary/20 min-h-[32px]"
                />
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  aria-label="Enregistrer"
                  className="text-secondary p-1 min-h-[32px]"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Annuler"
                  className="text-on-surface-variant p-1 min-h-[32px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs font-medium text-on-surface truncate">{cost.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-on-surface tabular-nums">
                    {formatEuro(cost.amount)}€
                  </span>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cost)}
                      aria-label={`Modifier ${cost.name}`}
                      className="text-on-surface-variant hover:text-secondary p-1.5 min-h-[28px]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cost.id)}
                      aria-label={`Supprimer ${cost.name}`}
                      className="text-on-surface-variant hover:text-red-500 p-1.5 min-h-[28px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 pt-2 border-t border-outline-variant/20 flex justify-between items-center">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</span>
        <span className="text-sm font-black font-mono text-on-surface tabular-nums">
          {formatEuro(total)}€
        </span>
      </div>
    </div>
  );
};
