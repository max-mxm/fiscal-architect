import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { FixedCost } from '~/types';
import { Button, IconButton } from '~/ui/Button';
import { NumberInput, TextInput } from '~/ui/Field';
import { Money } from '~/ui/Money';

interface FixedCostsEditorProps {
  costs: FixedCost[];
  onChange: (next: FixedCost[]) => void;
}

type Draft = { name: string; amount: string };

function parseDraft(d: Draft): { name: string; amount: number } | string {
  const name = d.name.trim();
  const amount = parseFloat(d.amount.replace(',', '.'));
  if (!name) return 'Donnez un libellé à cette charge.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Le montant doit être supérieur à 0 €.';
  return { name, amount };
}

/** Abonnements et frais récurrents, déduits chaque mois du net. Enregistrés à chaque changement. */
export function FixedCostsEditor({ costs, onChange }: FixedCostsEditorProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: '', amount: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ name: '', amount: '' });
  const [error, setError] = useState<string | null>(null);
  const total = costs.reduce((s, c) => s + c.amount, 0);

  const add = () => {
    const parsed = parseDraft(draft);
    if (typeof parsed === 'string') return setError(parsed);
    onChange([
      ...costs,
      { id: Date.now().toString(), name: parsed.name, description: '', amount: parsed.amount, icon: 'receipt', color: '' },
    ]);
    setDraft({ name: '', amount: '' });
    setAdding(false);
    setError(null);
  };

  const save = () => {
    if (!editing) return;
    const parsed = parseDraft(editDraft);
    if (typeof parsed === 'string') return setError(parsed);
    onChange(costs.map((c) => (c.id === editing ? { ...c, name: parsed.name, amount: parsed.amount } : c)));
    setEditing(null);
    setError(null);
  };

  const onKey = (e: React.KeyboardEvent, submit: () => void, cancel: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div>
      {costs.length === 0 && !adding ? (
        <p className="py-2 text-[14px] text-ink-2">Aucune charge fixe. Ajoutez vos abonnements, assurance ou loyer de bureau.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {costs.map((c) =>
            editing === c.id ? (
              <li key={c.id} className="grid grid-cols-[1fr_7.5rem_auto] items-center gap-2 py-2">
                <TextInput
                  autoFocus
                  aria-label="Libellé"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  onKeyDown={(e) => onKey(e, save, () => setEditing(null))}
                />
                <NumberInput
                  aria-label="Montant mensuel"
                  suffix="€"
                  min={0}
                  value={editDraft.amount}
                  onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                  onKeyDown={(e) => onKey(e, save, () => setEditing(null))}
                />
                <div className="flex">
                  <IconButton label="Enregistrer" size="sm" onClick={save}>
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </IconButton>
                  <IconButton label="Annuler" size="sm" onClick={() => setEditing(null)}>
                    <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </IconButton>
                </div>
              </li>
            ) : (
              <li key={c.id} className="flex min-h-12 items-center gap-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{c.name}</span>
                <Money value={c.amount} className="text-[16px] font-medium text-ink" />
                <span className="text-[13px] text-ink-3">/mois</span>
                <IconButton
                  label={`Modifier ${c.name}`}
                  size="sm"
                  onClick={() => {
                    setEditing(c.id);
                    setEditDraft({ name: c.name, amount: String(c.amount) });
                    setError(null);
                  }}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </IconButton>
                <IconButton label={`Supprimer ${c.name}`} size="sm" onClick={() => onChange(costs.filter((x) => x.id !== c.id))}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </IconButton>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <div className="mt-3 grid grid-cols-[1fr_7.5rem] gap-2">
          <TextInput
            autoFocus
            aria-label="Libellé de la charge"
            placeholder="ex. Espace de coworking"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => onKey(e, add, () => setAdding(false))}
          />
          <NumberInput
            aria-label="Montant mensuel"
            suffix="€"
            min={0}
            placeholder="0"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
            onKeyDown={(e) => onKey(e, add, () => setAdding(false))}
          />
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setError(null); }}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={add}>
              Ajouter
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          icon={<Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
        >
          Ajouter une charge
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-alert-ink">
          {error}
        </p>
      )}

      {costs.length > 0 && (
        <p className="mt-4 flex items-baseline justify-between rounded-[var(--radius-ctl)] bg-charges-soft px-3 py-2.5">
          <span className="text-[14px] font-medium text-ink">Total mensuel</span>
          <Money value={total} className="text-[17px] font-semibold text-ink" />
        </p>
      )}
    </div>
  );
}
