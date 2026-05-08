import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Initialize with defaultValue for SSR hydration compatibility
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // After hydration, read from localStorage. On exclut volontairement `defaultValue`
  // des deps : si l'appelant le reconstruit à chaque render (ex. `buildDefault(year)`),
  // l'effet refire et écrase tous les setValue() avec la valeur lue, ce qui rend
  // l'état inerte côté UI.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setValue(JSON.parse(saved));
      }
    } catch {
      // localStorage unavailable
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist changes to localStorage (only after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}

/**
 * Variante "versionnée" de useLocalStorage pour les objets de schéma.
 *
 * - L'objet stocké DOIT exposer un champ `schemaVersion: number`.
 * - À l'hydration, si la version stockée est inférieure à la version courante (`defaultValue.schemaVersion`),
 *   les migrations correspondantes sont appliquées séquentiellement, puis la valeur migrée est persistée.
 * - Si aucune migration n'est trouvée pour une version, on retombe sur `defaultValue` (failsafe).
 *
 * `migrations[N]` reçoit la valeur en version `N` et retourne la valeur en version `N + 1`.
 */
export function useVersionedStorage<T extends { schemaVersion: number }>(
  key: string,
  defaultValue: T,
  migrations: Record<number, (old: any) => any> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);
  // Refs pour éviter de mettre `defaultValue` / `migrations` dans les deps de l'effet
  // d'hydration : ces objets sont souvent reconstruits à chaque render (ex.
  // `buildDefaultYearConfig(year)`), donc les inclure ferait refire l'effet en boucle
  // et écraserait chaque setValue() par la lecture localStorage.
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const migrationsRef = useRef(migrations);
  migrationsRef.current = migrations;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const targetVersion = defaultRef.current.schemaVersion;
        let current = parsed;
        let safety = 0;
        while (
          current
          && typeof current.schemaVersion === 'number'
          && current.schemaVersion < targetVersion
          && safety < 32
        ) {
          const migrate = migrationsRef.current[current.schemaVersion];
          if (!migrate) {
            // Pas de migration → reset au default. Failsafe pour ne pas faire planter l'app.
            current = defaultRef.current;
            break;
          }
          current = migrate(current);
          safety++;
        }
        setValue(current as T);
      }
    } catch {
      // localStorage unavailable / JSON invalide
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
