import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Initialize with defaultValue for SSR hydration compatibility
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // After hydration, read from localStorage
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
