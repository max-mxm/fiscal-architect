import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '~/hooks/useLocalStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallApi {
  canPrompt: boolean;
  isIos: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  prompt: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  dismiss: () => void;
}

export function usePwaInstall(): PwaInstallApi {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissedFlag, setDismissedFlag] = useLocalStorage<boolean>(
    'fiscal-pwa-install-dismissed',
    false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua) && !standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'dismissed') setDismissedFlag(true);
    return outcome;
  }, [deferred, setDismissedFlag]);

  const dismiss = useCallback(() => {
    setDismissedFlag(true);
  }, [setDismissedFlag]);

  return {
    canPrompt: deferred !== null,
    isIos,
    isInstalled,
    isDismissed: dismissedFlag,
    prompt,
    dismiss,
  };
}
