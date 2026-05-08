import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useVersionedStorage } from '~/hooks/useLocalStorage';
import { useYearsIndex } from '~/hooks/useYearsIndex';
import { useYearConfig } from '~/hooks/useYearConfig';
import { DEFAULT_IDENTITY } from '~/constants';
import { generateChartData } from '~/lib/fiscal';
import {
  IDENTITY_KEYS,
  type IdentityProfile,
  type UserProfile,
  type YearConfig,
} from '~/types';

interface ProfileContextValue {
  /** Vue composite (identité + yearConfig de l'année active) — c'est ce que voient les composants. */
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile>>;

  // Accès bas niveau si besoin
  identity: IdentityProfile;
  setIdentity: Dispatch<SetStateAction<IdentityProfile>>;
  yearConfig: YearConfig;
  setYearConfig: Dispatch<SetStateAction<YearConfig>>;

  // Index des années
  years: number[];
  activeYear: number;
  setActiveYear: (year: number) => void;
  addYear: (year: number) => void;
  removeYear: (year: number) => void;

  handleExportGlobal: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Compose `IdentityProfile` + `YearConfig` en `UserProfile` à plat. */
function compose(identity: IdentityProfile, config: YearConfig): UserProfile {
  // schemaVersion vit dans chaque source mais ne fait pas partie du composite.
  const { schemaVersion: _i, ...identityRest } = identity;
  const { schemaVersion: _c, ...configRest } = config;
  return { ...identityRest, ...configRest } as UserProfile;
}

/**
 * Découpe un patch `Partial<UserProfile>` en deux patches typés :
 * - les clés d'identité vont dans le patch identity
 * - le reste va dans le patch yearConfig
 */
function splitPatch(patch: Partial<UserProfile>): {
  identityPatch: Partial<IdentityProfile>;
  configPatch: Partial<YearConfig>;
} {
  const identityPatch: Record<string, unknown> = {};
  const configPatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if ((IDENTITY_KEYS as ReadonlyArray<string>).includes(key)) {
      identityPatch[key] = value;
    } else {
      configPatch[key] = value;
    }
  }
  return {
    identityPatch: identityPatch as Partial<IdentityProfile>,
    configPatch: configPatch as Partial<YearConfig>,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useVersionedStorage<IdentityProfile>(
    'fiscal-profile',
    DEFAULT_IDENTITY,
  );
  const yearsApi = useYearsIndex();
  const [yearConfig, setYearConfig] = useYearConfig(yearsApi.activeYear);

  const profile = useMemo(() => compose(identity, yearConfig), [identity, yearConfig]);

  const setProfile = useCallback<Dispatch<SetStateAction<UserProfile>>>(
    (updater) => {
      const next = typeof updater === 'function'
        ? (updater as (p: UserProfile) => UserProfile)(compose(identity, yearConfig))
        : updater;

      // Détermine ce qui a changé par rapport au composite courant pour ne router que les diffs.
      const current = compose(identity, yearConfig);
      const patch: Partial<UserProfile> = {};
      for (const key of Object.keys(next) as (keyof UserProfile)[]) {
        if (next[key] !== current[key]) {
          (patch as Record<string, unknown>)[key as string] = next[key];
        }
      }
      const { identityPatch, configPatch } = splitPatch(patch);

      if (Object.keys(identityPatch).length > 0) {
        setIdentity((prev) => ({ ...prev, ...identityPatch }));
      }
      if (Object.keys(configPatch).length > 0) {
        setYearConfig((prev) => ({ ...prev, ...configPatch }));
      }
    },
    [identity, yearConfig, setIdentity, setYearConfig],
  );

  const handleExportGlobal = useCallback(() => {
    const chartData = generateChartData(profile);
    const header = 'Mois,CA Brut (€),Bénéfice Net (€)\n';
    const rows = chartData.map((d) => `${d.month},${d.brut},${d.net}`).join('\n');
    const totalFixed = profile.fixedCosts.reduce((s, c) => s + c.amount, 0);
    const summary = [
      '',
      `Profil,${profile.name}`,
      `Année,${profile.year}`,
      `TJM,${profile.tjm}€`,
      `Jours/mois,${profile.workingDays}`,
      `Taux URSSAF,${profile.urssafRate}%`,
      `Charges fixes mensuelles,${totalFixed}€`,
    ].join('\n');
    const csv = header + rows + '\n' + summary;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiscal-architect-${profile.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  const value: ProfileContextValue = {
    profile,
    setProfile,
    identity,
    setIdentity,
    yearConfig,
    setYearConfig,
    years: yearsApi.years,
    activeYear: yearsApi.activeYear,
    setActiveYear: yearsApi.setActiveYear,
    addYear: yearsApi.addYear,
    removeYear: yearsApi.removeYear,
    handleExportGlobal,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
