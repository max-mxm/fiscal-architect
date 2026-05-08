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
