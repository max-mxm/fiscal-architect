import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { X, RotateCcw, User, Calculator, Receipt } from 'lucide-react';
import type { UserProfile } from '~/types';
import { MissionStartInput } from '~/components/fiscal/MissionStartInput';
import { ActivitySelector } from '~/components/fiscal/ActivitySelector';
import { VLToggle } from '~/components/fiscal/VLToggle';
import { SeuilInput } from '~/components/fiscal/SeuilInput';
import { FixedCostsList } from '~/components/fiscal/FixedCostsList';
import { SettingsTabs, type SettingsTabId, type TabDef } from '~/components/settings/SettingsTabs';
import { ACTIVITY_PARAMS } from '~/lib/fiscal';
import type { Activity } from '~/types';

interface SettingsDrawerProps {
  open: boolean;
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  onClose: () => void;
  year: number;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  missionStart: string;
  onMissionStartChange: (next: string) => void;
  onResetAll: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const TABS: TabDef[] = [
  { id: 'profile', label: 'Profil', Icon: User },
  { id: 'fiscal', label: 'Fiscal', Icon: Calculator },
  { id: 'costs', label: 'Charges', Icon: Receipt },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  activeTab,
  onTabChange,
  onClose,
  year,
  profile,
  setProfile,
  missionStart,
  onMissionStartChange,
  onResetAll,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
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
  }, [open]);

  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 80) onCloseRef.current();
  };

  const panelId = (id: SettingsTabId) => `settings-panel-${id}`;
  const tabId = (id: SettingsTabId) => `settings-tab-${id}`;

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
          <motion.aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Réglages"
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
            className="relative w-full max-w-full md:max-w-[440px] xl:max-w-[480px] bg-white rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl max-h-[92vh] md:max-h-screen md:h-screen overflow-hidden flex flex-col"
          >
            {/* Drag handle (mobile only) */}
            <div className="md:hidden pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-3 md:pt-6 flex items-start justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900">Réglages</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Profil, paramètres fiscaux et charges fixes.
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer les réglages"
                className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="pb-3 border-b border-outline-variant/15">
              <SettingsTabs
                tabs={TABS}
                active={activeTab}
                onChange={onTabChange}
                panelIdPrefix="settings"
              />
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {activeTab === 'profile' && (
                <section
                  role="tabpanel"
                  id={panelId('profile')}
                  aria-labelledby={tabId('profile')}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="settings-name"
                      className="block text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-2"
                    >
                      Nom
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                      autoComplete="name"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settings-role"
                      className="block text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-2"
                    >
                      Rôle
                    </label>
                    <input
                      id="settings-role"
                      type="text"
                      value={profile.role}
                      onChange={(e) => updateProfile({ role: e.target.value })}
                      autoComplete="organization-title"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
                    />
                  </div>

                  <div className="pt-2 border-t border-outline-variant/15 space-y-3">
                    <button
                      type="button"
                      onClick={onResetAll}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                      <RotateCcw className="w-4 h-4" /> Tout réinitialiser
                    </button>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Les données sont stockées localement dans votre navigateur (localStorage). Aucune information n'est envoyée à un serveur.
                    </p>
                  </div>
                </section>
              )}

              {activeTab === 'fiscal' && (
                <section
                  role="tabpanel"
                  id={panelId('fiscal')}
                  aria-labelledby={tabId('fiscal')}
                  className="space-y-7"
                >
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                      Période
                    </h3>
                    <MissionStartInput
                      value={missionStart}
                      onChange={onMissionStartChange}
                      year={year}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      Activité
                    </h3>
                    <ActivitySelector
                      value={profile.activity}
                      onChange={(next: Activity) => {
                        const params = ACTIVITY_PARAMS[next];
                        updateProfile({
                          activity: next,
                          urssafRate: params.urssafRate,
                          seuilMicro: params.plafond,
                        });
                      }}
                    />
                    <VLToggle
                      value={profile.versementLiberatoire}
                      onChange={(v) => updateProfile({ versementLiberatoire: v })}
                      tauxVL={ACTIVITY_PARAMS[profile.activity].tauxVL}
                    />
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
                      Seuil micro-entreprise
                    </h3>
                    <SeuilInput
                      value={profile.seuilMicro}
                      onChange={(v) => updateProfile({ seuilMicro: v })}
                      defaultValue={ACTIVITY_PARAMS[profile.activity].plafond}
                    />
                  </div>
                </section>
              )}

              {activeTab === 'costs' && (
                <section
                  role="tabpanel"
                  id={panelId('costs')}
                  aria-labelledby={tabId('costs')}
                  className="space-y-3"
                >
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Vos charges fixes mensuelles sont déduites du net pour estimer votre revenu réel.
                  </p>
                  <FixedCostsList
                    costs={profile.fixedCosts}
                    onChange={(next) => updateProfile({ fixedCosts: next })}
                  />
                </section>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
