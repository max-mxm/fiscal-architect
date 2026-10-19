import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ActivityEntry, RevenueEntry } from '~/types';
import { ACTIVITY_PARAMS, calcInvoiceTotals } from '~/lib/fiscal';
import { Button, IconButton } from '~/ui/Button';
import { Field, NumberInput, SelectInput, TextInput } from '~/ui/Field';
import { Money, eur } from '~/ui/Money';

type Forfait = Extract<RevenueEntry, { kind: 'forfait' }>;
type Flat = Extract<RevenueEntry, { kind: 'flat' }>;

const pad = (n: number) => String(n).padStart(2, '0');
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

function activityName(activities: ActivityEntry[], id?: string): string | null {
  if (activities.length < 2) return null;
  const a = activities.find((x) => x.id === id) ?? activities.find((x) => x.isPrimary) ?? activities[0];
  return a ? a.label || ACTIVITY_PARAMS[a.type].label : null;
}

interface CommonProps {
  entries: RevenueEntry[];
  onChange: (next: RevenueEntry[]) => void;
  activities: ActivityEntry[];
  tvaApplies: boolean;
  tvaRate: number;
}

interface ForfaitProps extends CommonProps {
  year: number;
  monthIndex: number;
  monthName: string;
}

/** Prestations datées à montant fixe (devis, factures). */
export function ForfaitEntries({ entries, onChange, activities, tvaApplies, tvaRate, year, monthIndex, monthName }: ForfaitProps) {
  const multi = activities.length > 1;
  const primaryId = activities.find((a) => a.isPrimary)?.id ?? activities[0]?.id ?? '';
  const min = `${year}-${pad(monthIndex + 1)}-01`;
  const max = `${year}-${pad(monthIndex + 1)}-${pad(new Date(year, monthIndex + 1, 0).getDate())}`;
  const empty = { id: '', date: min, amount: '', label: '', activityId: primaryId };
  const [draft, setDraft] = useState<typeof empty | null>(null);
  const [error, setError] = useState<string | null>(null);

  const forfaits = entries
    .filter((e): e is Forfait => e.kind === 'forfait')
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = forfaits.reduce((s, f) => s + f.amount, 0);
  const invoice = calcInvoiceTotals(total, tvaApplies, tvaRate);

  useEffect(() => setDraft(null), [monthIndex, year]);

  const submit = () => {
    if (!draft) return;
    const amount = parseFloat(String(draft.amount).replace(',', '.'));
    if (!draft.date || draft.date < min || draft.date > max) return setError(`Choisissez une date en ${monthName.toLowerCase()}.`);
    if (!Number.isFinite(amount) || amount <= 0) return setError('Le montant hors taxes doit être supérieur à 0 €.');
    const next: Forfait = {
      kind: 'forfait',
      id: draft.id || Date.now().toString(),
      date: draft.date,
      amount,
      label: draft.label.trim() || undefined,
      activityId: multi ? draft.activityId : undefined,
    };
    onChange([...entries.filter((e) => e.id !== next.id), next]);
    setDraft(null);
    setError(null);
  };

  return (
    <div>
      {forfaits.length === 0 && !draft ? (
        <p className="py-2 text-[14px] text-ink-2">Aucune prestation en {monthName.toLowerCase()}.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {forfaits.map((f) => (
            <li key={f.id} className="flex min-h-12 items-center gap-3 py-1.5">
              <span className="w-14 shrink-0 text-[14px] text-ink-2 tnum">{shortDate(f.date)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-ink">{f.label || 'Prestation'}</span>
                {activityName(activities, f.activityId) && (
                  <span className="block truncate text-[13px] text-ink-3">{activityName(activities, f.activityId)}</span>
                )}
              </span>
              <span className="text-right">
                <Money value={f.amount} className="block text-[16px] font-medium text-ink" />
                {tvaApplies && (
                  <span className="block text-[12px] font-semibold text-tva-ink tnum">{eur(calcInvoiceTotals(f.amount, true, tvaRate).ttc)} TTC</span>
                )}
              </span>
              <IconButton
                label={`Modifier ${f.label || 'la prestation'}`}
                size="sm"
                onClick={() => {
                  setDraft({ id: f.id, date: f.date, amount: String(f.amount), label: f.label ?? '', activityId: f.activityId ?? primaryId });
                  setError(null);
                }}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
              <IconButton label={`Supprimer ${f.label || 'la prestation'}`} size="sm" onClick={() => onChange(entries.filter((e) => e.id !== f.id))}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <form
          className="mt-3 grid gap-3 rounded-[var(--radius-card)] border border-line bg-card-2/50 p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Libellé" className="sm:col-span-2">
            {({ inputId }) => (
              <TextInput
                id={inputId}
                autoFocus
                placeholder="ex. Refonte du site Atelier Nord"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            )}
          </Field>
          <Field label="Date">
            {({ inputId }) => (
              <TextInput id={inputId} type="date" min={min} max={max} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            )}
          </Field>
          <Field label="Montant hors taxes">
            {({ inputId }) => (
              <NumberInput id={inputId} min={0} step={10} suffix="€" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
            )}
          </Field>
          {multi && (
            <Field label="Activité" className="sm:col-span-2">
              {({ inputId }) => (
                <SelectInput id={inputId} value={draft.activityId} onChange={(e) => setDraft({ ...draft, activityId: e.target.value })}>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || ACTIVITY_PARAMS[a.type].label}
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
          )}
          {error && (
            <p role="alert" className="text-[13px] text-alert-ink sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" size="sm" onClick={() => { setDraft(null); setError(null); }}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {draft.id ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          icon={<Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          onClick={() => setDraft(empty)}
        >
          Ajouter une prestation
        </Button>
      )}

      {forfaits.length > 0 && (
        <dl className="mt-4 space-y-1 rounded-[var(--radius-ctl)] bg-card-2 px-3 py-2.5 text-[14px]">
          <div className="flex justify-between">
            <dt className="font-medium text-ink">Total hors taxes</dt>
            <dd className="text-[17px] font-semibold text-ink tnum">{eur(invoice.ht)}</dd>
          </div>
          {tvaApplies && (
            <div className="flex justify-between font-semibold text-tva-ink">
              <dt>TVA {Math.round(tvaRate * 1000) / 10} % · facturé TTC</dt>
              <dd className="tnum">
                {eur(invoice.tva)} · {eur(invoice.ttc)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

/** Un montant de chiffre d'affaires pour le mois (vente en ligne, VTC, location). */
export function FlatEntry({ entries, onChange, activities, tvaApplies, tvaRate, monthName }: CommonProps & { monthName: string }) {
  const multi = activities.length > 1;
  const flat = entries.find((e): e is Flat => e.kind === 'flat');
  const [draft, setDraft] = useState(flat ? String(flat.amount) : '');
  useEffect(() => setDraft(flat ? String(flat.amount) : ''), [flat?.amount, flat?.id]);
  const invoice = calcInvoiceTotals(flat?.amount ?? 0, tvaApplies, tvaRate);

  const apply = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const others = entries.filter((e) => e.kind !== 'flat');
    if (amount === 0) return onChange(others);
    onChange([...others, { kind: 'flat', id: flat?.id ?? `flat-${Date.now()}`, amount, label: flat?.label, activityId: flat?.activityId }]);
  };

  return (
    <div className="space-y-3">
      <Field
        label={`Chiffre d’affaires hors taxes de ${monthName.toLowerCase()}`}
        help="Le total encaissé sur le mois, toutes sources confondues. Enregistré en quittant le champ."
      >
        {({ inputId, describedBy }) => (
          <NumberInput
            id={inputId}
            aria-describedby={describedBy}
            min={0}
            step={10}
            suffix="€"
            placeholder="0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => apply(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply(draft);
              }
            }}
            className="sm:max-w-xs"
            inputClassName="h-12 text-[22px]"
          />
        )}
      </Field>
      {multi && flat && (
        <Field label="Activité">
          {({ inputId }) => (
            <SelectInput
              id={inputId}
              value={flat.activityId ?? activities.find((a) => a.isPrimary)?.id}
              onChange={(e) => onChange([...entries.filter((x) => x.kind !== 'flat'), { ...flat, activityId: e.target.value }])}
              className="sm:max-w-xs"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || ACTIVITY_PARAMS[a.type].label}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      )}
      {tvaApplies && (flat?.amount ?? 0) > 0 && (
        <p className="rounded-[var(--radius-ctl)] bg-tva-soft px-3 py-2 text-[14px] font-semibold text-tva-ink tnum">
          TVA collectée {eur(invoice.tva)} · encaissement TTC {eur(invoice.ttc)}
        </p>
      )}
    </div>
  );
}
