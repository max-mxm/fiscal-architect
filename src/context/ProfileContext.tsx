import { createContext, useContext, useCallback, type ReactNode, type Dispatch, type SetStateAction } from 'react';
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

  const handleExportGlobal = useCallback(() => {
    const chartData = generateChartData(profile);
    const header = 'Mois,CA Brut (€),Bénéfice Net (€)\n';
    const rows = chartData.map((d) => `${d.month},${d.brut},${d.net}`).join('\n');
    const summary = [
      '',
      `Profil,${profile.name}`,
      `Statut,${profile.status}`,
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
