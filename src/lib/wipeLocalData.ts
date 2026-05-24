/**
 * Efface intégralement l'état local de l'app : localStorage, sessionStorage,
 * Cache API et Service Workers enregistrés. Chaque étape est encapsulée dans
 * un try/catch silencieux pour qu'une défaillance partielle (ex: storage
 * verrouillé, caches non disponibles) ne bloque pas les suivantes.
 *
 * Utilisé par `BreakingUpdateGate` (mises à jour majeures détectées) et par
 * le bouton de secours de `ErrorPage` (récupération manuelle).
 */
export async function wipeLocalData(): Promise<void> {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
  }
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }
}
