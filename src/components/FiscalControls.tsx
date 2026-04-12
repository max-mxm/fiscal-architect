import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { UserProfile } from '~/types';
import { DEFAULT_PROFILE } from '~/constants';
import {
  calcCAMensuel,
  calcTotalChargesFixes,
  calcCAannuel,
  calcMonthlyBreakdown,
  TAUX_VL_BNC,
  TRANCHES_IR,
} from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';
import { cn } from '~/utils';

interface FiscalControlsProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  className?: string;
}

export const FiscalControls: React.FC<FiscalControlsProps> = ({ profile, setProfile, className }) => {
  // CRUD charges fixes state
  const [newCost, setNewCost] = useState({ name: '', amount: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState({ name: '', amount: '' });

  const updateProfile = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  }, [setProfile]);

  // CRUD handlers
  const handleAddCost = useCallback(() => {
    const amount = parseFloat(newCost.amount);
    if (!newCost.name.trim() || isNaN(amount) || amount <= 0) return;
    setProfile((prev) => ({
      ...prev,
      fixedCosts: [
        ...prev.fixedCosts,
        {
          id: Date.now().toString(),
          name: newCost.name.trim(),
          description: '',
          amount,
          icon: 'receipt',
          color: 'bg-violet-100 text-violet-600',
        },
      ],
    }));
    setNewCost({ name: '', amount: '' });
    setShowAddForm(false);
  }, [newCost, setProfile]);

  const handleDeleteCost = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter((c) => c.id !== id),
    }));
  }, [setProfile]);

  const handleStartEdit = useCallback((cost: UserProfile['fixedCosts'][0]) => {
    setEditingId(cost.id);
    setEditCost({ name: cost.name, amount: cost.amount.toString() });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const amount = parseFloat(editCost.amount);
    if (!editCost.name.trim() || isNaN(amount) || amount <= 0) return;
    setProfile((prev) => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map((c) =>
        c.id === editingId
          ? { ...c, name: editCost.name.trim(), amount }
          : c
      ),
    }));
    setEditingId(null);
  }, [editingId, editCost, setProfile]);

  const totalChargesFixes = profile.fixedCosts.reduce((sum, c) => sum + c.amount, 0);

  // Métriques d'impact en temps réel (via moteur fiscal centralisé)
  const impact = useMemo(() => {
    const caMensuel = calcCAMensuel(profile.tjm, profile.workingDays);
    const chargesFixes = calcTotalChargesFixes(profile.fixedCosts);
    const caAnnuel = calcCAannuel(profile.tjm, profile.workingDays);
    const breakdown = calcMonthlyBreakdown(caMensuel, profile.urssafRate, chargesFixes, profile.versementLiberatoire);
    return {
      caMensuel,
      chargesURSSAF: breakdown.urssaf,
      irMensuel: breakdown.ir,
      netMensuel: breakdown.net,
      caAnnuel,
      netAnnuel: breakdown.net * 12,
      tauxRetention: breakdown.tauxNet * 100,
      versementLiberatoire: profile.versementLiberatoire,
    };
  }, [profile.tjm, profile.workingDays, profile.urssafRate, profile.fixedCosts, profile.versementLiberatoire]);

  return (
    <div className={cn('bg-surface-lowest rounded-2xl p-5 shadow-sm space-y-5', className)}>
      {/* TJM */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">TJM</label>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={profile.tjm}
              onChange={(e) => updateProfile({ tjm: parseInt(e.target.value) || 0 })}
              className="font-headline font-black text-lg text-secondary bg-transparent border-b border-secondary/30 w-16 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors"
            />
            <span className="text-secondary font-bold text-xs">€/j</span>
          </div>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="10"
          value={profile.tjm}
          onChange={(e) => updateProfile({ tjm: parseInt(e.target.value) })}
          className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
        />
      </div>

      {/* URSSAF */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">URSSAF</label>
            {profile.urssafRate !== DEFAULT_PROFILE.urssafRate && (
              <button
                type="button"
                title={`Réinitialiser (${DEFAULT_PROFILE.urssafRate}%)`}
                onClick={() => updateProfile({ urssafRate: DEFAULT_PROFILE.urssafRate })}
                className="text-on-surface-variant hover:text-secondary transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-xs font-bold text-secondary">{profile.urssafRate}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={profile.urssafRate}
          onChange={(e) => updateProfile({ urssafRate: parseFloat(e.target.value) })}
          className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
        />
      </div>

      {/* Statut pills */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Statut</label>
          {profile.status !== DEFAULT_PROFILE.status && (
            <button
              type="button"
              title={`Réinitialiser (${DEFAULT_PROFILE.status})`}
              onClick={() => updateProfile({ status: DEFAULT_PROFILE.status })}
              className="text-on-surface-variant hover:text-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['micro', 'sasu', 'eurl'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateProfile({ status: s })}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                profile.status === s
                  ? 'bg-secondary text-white shadow-md'
                  : 'bg-surface-highest/30 text-on-surface-variant hover:bg-surface-highest/50'
              )}
            >
              {s === 'micro' ? 'Micro' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant/20" />

      {/* Tranche IR — calculée automatiquement */}
      <div>
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Tranche IR</label>
        <div className="mt-1 bg-surface-highest/20 rounded-lg py-2 px-3">
          {profile.versementLiberatoire ? (
            <p className="text-xs font-medium text-on-surface-variant">
              VL activé — taux forfaitaire {(TAUX_VL_BNC * 100).toFixed(1)}%
            </p>
          ) : (
            <p className="text-xs font-medium text-on-surface-variant">
              Tranche marginale : <span className="font-bold text-secondary">{(() => {
                const revenu = impact.caAnnuel * 0.66;
                const tranche = [...TRANCHES_IR].reverse().find(t => revenu > t.min);
                return tranche ? `${(tranche.taux * 100).toFixed(0)}%` : '0%';
              })()}</span>
            </p>
          )}
        </div>
      </div>

      {/* Versement libératoire — micro only */}
      {profile.status === 'micro' && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Versement libératoire</label>
              {profile.versementLiberatoire !== DEFAULT_PROFILE.versementLiberatoire && (
                <button
                  type="button"
                  title="Réinitialiser (désactivé)"
                  onClick={() => updateProfile({ versementLiberatoire: DEFAULT_PROFILE.versementLiberatoire })}
                  className="text-on-surface-variant hover:text-secondary transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => updateProfile({ versementLiberatoire: !profile.versementLiberatoire })}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                profile.versementLiberatoire ? 'bg-secondary' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform duration-200 mt-0.5',
                  profile.versementLiberatoire ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          {profile.versementLiberatoire && (
            <div className="mt-2 bg-secondary/5 border border-secondary/20 rounded-lg p-2">
              <p className="text-xs text-secondary font-medium">
                Total : {profile.urssafRate}% + {(TAUX_VL_BNC * 100).toFixed(1)}% = {(profile.urssafRate + TAUX_VL_BNC * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seuil micro-entreprise */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Seuil micro</label>
            {profile.seuilMicro !== DEFAULT_PROFILE.seuilMicro && (
              <button
                type="button"
                title={`Réinitialiser (${DEFAULT_PROFILE.seuilMicro.toLocaleString('fr-FR')}€)`}
                onClick={() => updateProfile({ seuilMicro: DEFAULT_PROFILE.seuilMicro })}
                className="text-on-surface-variant hover:text-secondary transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={profile.seuilMicro}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) updateProfile({ seuilMicro: val });
              }}
              className="font-headline font-black text-lg text-secondary bg-transparent border-b border-secondary/30 w-24 p-0 text-right focus:ring-0 focus:border-secondary appearance-none transition-colors"
            />
            <span className="text-secondary font-bold text-xs">€</span>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/20" />

      {/* Charges fixes */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em]">Charges fixes</label>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-secondary text-xs font-bold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-2"
            >
              <div className="bg-surface-highest/20 p-3 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Nom"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCost()}
                  autoFocus
                  className="w-full bg-white border-none rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-secondary/20"
                />
                <input
                  type="number"
                  placeholder="Montant (€)"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCost()}
                  className="w-full bg-white border-none rounded-lg py-1.5 px-3 text-xs focus:ring-2 focus:ring-secondary/20"
                />
                <div className="flex gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setNewCost({ name: '', amount: '' }); }}
                    className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCost}
                    className="px-3 py-1 bg-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-0.5"
                  >
                    <Check className="w-3 h-3" /> OK
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cost list */}
        <div className="space-y-1">
          {profile.fixedCosts.map((cost) => (
            <div key={cost.id} className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-highest/20 transition-colors">
              {editingId === cost.id ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editCost.name}
                    onChange={(e) => setEditCost({ ...editCost, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="bg-white border-none rounded-md py-1 px-2 text-xs font-bold flex-1 focus:ring-2 focus:ring-secondary/20"
                  />
                  <input
                    type="number"
                    value={editCost.amount}
                    onChange={(e) => setEditCost({ ...editCost, amount: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="bg-white border-none rounded-md py-1 px-2 text-xs font-bold w-16 focus:ring-2 focus:ring-secondary/20"
                  />
                  <button type="button" onClick={handleSaveEdit} className="text-secondary"><Check className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-on-surface-variant"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-medium text-slate-700 truncate">{cost.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900">{cost.amount}€</span>
                    <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => handleStartEdit(cost)} className="text-on-surface-variant hover:text-secondary">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => handleDeleteCost(cost.id)} className="text-on-surface-variant hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex justify-between items-center">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total</span>
          <span className="text-sm font-black font-mono text-slate-900">{totalChargesFixes}€</span>
        </div>
      </div>

      <div className="border-t border-outline-variant/20" />

      {/* Impact en temps réel */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.12em] block">Impact revenus</label>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/5 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Net mensuel</p>
            <p className="font-headline font-black text-lg text-secondary leading-tight">
              {formatEuro(impact.netMensuel)}€
            </p>
          </div>
          <div className="bg-secondary/5 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Net annuel</p>
            <p className="font-headline font-black text-lg text-secondary leading-tight">
              {formatEuro(impact.netAnnuel)}€
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">CA mensuel</span>
            <span className="text-xs font-bold font-mono text-slate-700">{formatEuro(impact.caMensuel)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">URSSAF ({profile.urssafRate}%)</span>
            <span className="text-xs font-bold font-mono text-red-500">−{formatEuro(impact.chargesURSSAF)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">Charges fixes</span>
            <span className="text-xs font-bold font-mono text-red-500">−{formatEuro(totalChargesFixes)}€</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">{impact.versementLiberatoire ? 'IR (VL 2,2%)' : 'IR (barème)'}</span>
            <span className="text-xs font-bold font-mono text-red-500">−{formatEuro(impact.irMensuel)}€</span>
          </div>
          <div className="pt-1.5 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-xs font-bold text-on-surface-variant">Taux de rétention</span>
            <span className={cn(
              'text-xs font-black font-mono',
              impact.tauxRetention >= 60 ? 'text-emerald-600' : impact.tauxRetention >= 40 ? 'text-amber-600' : 'text-red-600'
            )}>
              {impact.tauxRetention.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-on-surface-variant">CA annuel</span>
          <span className="text-xs font-bold font-mono text-slate-900">{formatEuro(impact.caAnnuel)}€</span>
        </div>
      </div>
    </div>
  );
};
