import { useEffect, useMemo, useState } from 'react';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { usePwaInstall } from '~/hooks/usePwaInstall';
import { InstallPromptToast } from '~/components/InstallPromptToast';

export function PwaInstallController() {
  const { fiscalYear } = useFiscalYearCtx();
  const { canPrompt, isIos, isInstalled, isDismissed, prompt, dismiss } = usePwaInstall();
  const [open, setOpen] = useState(false);

  const hasInteracted = useMemo(
    () =>
      fiscalYear.months.some(
        (m) => m.workedDays.length > 0 || (m.halfDays?.length ?? 0) > 0,
      ),
    [fiscalYear.months],
  );

  const eligible = !isInstalled && !isDismissed && hasInteracted && (canPrompt || isIos);

  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  const handleInstall = async () => {
    const outcome = await prompt();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setOpen(false);
  };

  return (
    <InstallPromptToast
      open={open}
      mode={isIos ? 'ios' : 'native'}
      onInstall={handleInstall}
      onDismiss={handleDismiss}
    />
  );
}
