import { createContext, useContext, useCallback, useEffect, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { DEFAULT_PROFILE } from '~/constants';
import { generateChartData } from '~/lib/fiscal';
import type { UserProfile } from '~/types';

interface ProfileContextType {
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;
  handleExportGlobal: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useLocalStorage('fiscal-profile', DEFAULT_PROFILE);

  // Migration silencieuse pour les profils localStorage antérieurs aux ajouts de champs.
  // Comble tous les champs absents avec les valeurs par défaut, en une seule passe.
  useEffect(() => {
    setProfile((p) => {
      const next = { ...p };
      let dirty = false;
      if (!next.activity) { next.activity = DEFAULT_PROFILE.activity; dirty = true; }
      if (next.acreEnabled === undefined) { next.acreEnabled = DEFAULT_PROFILE.acreEnabled; dirty = true; }
      if (next.tvaAssujetti === undefined) { next.tvaAssujetti = DEFAULT_PROFILE.tvaAssujetti; dirty = true; }
      if (next.cfpEnabled === undefined) { next.cfpEnabled = DEFAULT_PROFILE.cfpEnabled; dirty = true; }
      if (next.taxeConsulaireEnabled === undefined) { next.taxeConsulaireEnabled = DEFAULT_PROFILE.taxeConsulaireEnabled; dirty = true; }
      if (next.revenueModel === undefined) { next.revenueModel = DEFAULT_PROFILE.revenueModel; dirty = true; }
      if (!next.activities || next.activities.length === 0) {
        next.activities = [{
          id: `act-${Date.now()}`,
          type: next.activity,
          isPrimary: true,
        }];
        dirty = true;
      }
      if (next.partsFiscales === undefined) { next.partsFiscales = DEFAULT_PROFILE.partsFiscales; dirty = true; }
      if (next.declarationPeriod === undefined) { next.declarationPeriod = DEFAULT_PROFILE.declarationPeriod; dirty = true; }
      if (next.ijOption === undefined) { next.ijOption = DEFAULT_PROFILE.ijOption; dirty = true; }
      // onboardingDone : on ne réinitialise PAS sur les profils existants —
      // si tu as déjà des données, c'est que tu n'as pas besoin de l'onboarding.
      if (next.onboardingDone === undefined) { next.onboardingDone = true; dirty = true; }

      // Migration dark theme : append les variantes dark: aux classes color des charges fixes
      // si elles ne sont pas déjà présentes. Idempotent.
      if (Array.isArray(next.fixedCosts)) {
        const migrated = next.fixedCosts.map((c) => {
          if (!c.color || c.color.includes('dark:')) return c;
          const tone = (() => {
            if (c.color.includes('blue-')) return 'dark:bg-blue-500/20 dark:text-blue-300';
            if (c.color.includes('emerald-')) return 'dark:bg-emerald-500/20 dark:text-emerald-300';
            if (c.color.includes('amber-')) return 'dark:bg-amber-500/20 dark:text-amber-300';
            if (c.color.includes('violet-')) return 'dark:bg-violet-500/20 dark:text-violet-300';
            if (c.color.includes('red-')) return 'dark:bg-red-500/20 dark:text-red-300';
            if (c.color.includes('slate-')) return 'dark:bg-slate-500/20 dark:text-slate-300';
            return 'dark:bg-secondary/15 dark:text-secondary';
          })();
          return { ...c, color: `${c.color} ${tone}` };
        });
        const changed = migrated.some((c, i) => c.color !== next.fixedCosts[i].color);
        if (changed) {
          next.fixedCosts = migrated;
          dirty = true;
        }
      }

      return dirty ? next : p;
    });
  }, [setProfile]);

  const handleExportGlobal = useCallback(() => {
    const chartData = generateChartData(profile);
    const header = 'Mois,CA Brut (€),Bénéfice Net (€)\n';
    const rows = chartData.map((d) => `${d.month},${d.brut},${d.net}`).join('\n');
    const summary = [
      '',
      `Profil,${profile.name}`,
      `TJM,${profile.tjm}€`,
      `Jours/mois,${profile.workingDays}`,
      `Taux URSSAF,${profile.urssafRate}%`,
      `Charges fixes mensuelles,${profile.fixedCosts.reduce((s, c) => s + c.amount, 0)}€`,
    ].join('\n');
    const csv = header + rows + '\n' + summary;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiscal-architect-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, handleExportGlobal }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
