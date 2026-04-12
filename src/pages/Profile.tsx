import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Info,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '~/types';
import { DEFAULT_PROFILE } from '~/constants';
import { FiscalControls } from '~/components/FiscalControls';

interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  // PROF-03: Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toast after 2s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateProfile = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  }, [setProfile]);

  // PROF-03: Annuler — reset au profil par défaut
  const handleCancel = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setToast('Profil réinitialisé aux valeurs par défaut');
  }, [setProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 max-w-3xl mx-auto"
    >
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            role="status"
            aria-live="polite"
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header>
        <span className="text-secondary font-bold tracking-widest text-xs uppercase mb-4 block">Mon profil</span>
        <h2 className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Configuration du profil</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
          Renseignez votre identité et configurez vos paramètres fiscaux. Les modifications sont appliquées en temps réel sur toutes les pages.
        </p>
      </header>

      <div className="space-y-8">
        <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm">
          <h3 className="font-headline text-xl font-bold mb-6">Identité</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="profile-name" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Nom</label>
              <input
                id="profile-name"
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Votre nom"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="profile-role" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Rôle</label>
              <input
                id="profile-role"
                type="text"
                value={profile.role}
                onChange={(e) => updateProfile({ role: e.target.value })}
                placeholder="Votre rôle"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Paramètres fiscaux */}
        <div>
          <h3 className="font-headline text-xl font-bold mb-4">Paramètres fiscaux</h3>
          <FiscalControls profile={profile} setProfile={setProfile} />
        </div>

        {/* Footer Actions */}
        <div className="pt-8 flex items-center justify-between">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Info className="w-5 h-5" />
            <p className="text-sm">Vos données sont stockées localement et utilisées uniquement à des fins de simulation.</p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Guide */}
      <footer className="mt-32 pt-16 border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h4 className="font-headline text-sm font-bold text-secondary mb-4 uppercase">Le guide de l'architecte</h4>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Comprendre la différence entre votre chiffre d'affaires brut et votre bénéfice net est essentiel.
            Pour les micro-entrepreneurs, le taux réel d'imposition moyen (cotisations sociales et impôt inclus)
            se situe généralement entre 25% et 30%. En SASU, les dividendes sont taxés au Prélèvement Forfaitaire Unique (PFU) de 30%,
            mais les cotisations sociales sur les salaires sont nettement plus élevées.
          </p>
        </div>
        <div className="bg-surface-highest/20 p-8 rounded-3xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
            <Sparkles className="text-secondary w-8 h-8" />
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Suggestions intelligentes</h5>
            <p className="text-xs text-on-surface-variant">
              Avec un TJM de {profile.tjm}€, nous vous recommandons d'explorer la structure SASU une fois
              que votre CA dépasse {profile.seuilMicro.toLocaleString('fr-FR')}€ pour optimiser votre stratégie fiscale.
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
