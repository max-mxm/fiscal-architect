import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import type { UserProfile } from '~/types';
import { MissionStartInput } from '~/components/fiscal/MissionStartInput';
import { StatusPills } from '~/components/fiscal/StatusPills';
import { VLToggle } from '~/components/fiscal/VLToggle';
import { SeuilInput } from '~/components/fiscal/SeuilInput';
import { FixedCostsList } from '~/components/fiscal/FixedCostsList';

interface AdvancedSheetProps {
  open: boolean;
  onClose: () => void;
  year: number;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  missionStart: string;
  onMissionStartChange: (next: string) => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const AdvancedSheet: React.FC<AdvancedSheetProps> = ({
  open,
  onClose,
  year,
  profile,
  setProfile,
  missionStart,
  onMissionStartChange,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 80) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex md:items-stretch md:justify-end items-end justify-center"
          onClick={onClose}
        >
          {/* Bottom sheet mobile / panneau droit desktop */}
          <motion.aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Paramètres avancés"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-full md:max-w-[420px] bg-white rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl max-h-[90vh] md:max-h-screen md:h-screen overflow-hidden flex flex-col"
          >
            {/* Drag handle (mobile only) */}
            <div className="md:hidden pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-4 md:pt-6 flex items-start justify-between border-b border-outline-variant/15">
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900">Paramètres avancés</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Affinez votre simulation fiscale.</p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer le panneau"
                className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-7">
              <section aria-labelledby="adv-period">
                <h3 id="adv-period" className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                  Période
                </h3>
                <MissionStartInput value={missionStart} onChange={onMissionStartChange} year={year} />
              </section>

              <section aria-labelledby="adv-status" className="space-y-4">
                <h3 id="adv-status" className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Statut juridique
                </h3>
                <StatusPills value={profile.status} onChange={(s) => updateProfile({ status: s })} />
                {profile.status === 'micro' && (
                  <VLToggle
                    value={profile.versementLiberatoire}
                    onChange={(v) => updateProfile({ versementLiberatoire: v })}
                  />
                )}
              </section>

              <section aria-labelledby="adv-seuil">
                <h3 id="adv-seuil" className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                  Seuil micro-entreprise
                </h3>
                <SeuilInput
                  value={profile.seuilMicro}
                  onChange={(v) => updateProfile({ seuilMicro: v })}
                />
              </section>

              <section aria-labelledby="adv-costs">
                <h3 id="adv-costs" className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                  Charges fixes
                </h3>
                <FixedCostsList
                  costs={profile.fixedCosts}
                  onChange={(next) => updateProfile({ fixedCosts: next })}
                />
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
