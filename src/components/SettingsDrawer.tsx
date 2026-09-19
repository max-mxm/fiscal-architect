import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'motion/react';
import {
  X,
  RotateCcw,
  User,
  Calculator,
  Receipt,
  Monitor,
  Sun,
  Moon,
  CalendarClock,
  DatabaseBackup,
  Download,
  Upload,
  Landmark,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTheme, type ThemeMode } from '~/context/ThemeContext';
import type { UserProfile } from '~/types';
import { ConfirmModal } from '~/components/ConfirmModal';
import { MissionStartInput } from '~/components/fiscal/MissionStartInput';
import { CreationDateInput } from '~/components/fiscal/CreationDateInput';
import { ActivityManager } from '~/components/fiscal/ActivityManager';
import { RevenueModeSelector } from '~/components/fiscal/RevenueModeSelector';
import { AutoChargesInfo } from '~/components/fiscal/AutoChargesInfo';
import { VLToggle } from '~/components/fiscal/VLToggle';
import { ACREToggle } from '~/components/fiscal/ACREToggle';
import { TVAToggle } from '~/components/fiscal/TVAToggle';
import { IJToggle } from '~/components/fiscal/IJToggle';
import { RFRInput } from '~/components/fiscal/RFRInput';
import { SeuilInput } from '~/components/fiscal/SeuilInput';
import { FixedCostsList } from '~/components/fiscal/FixedCostsList';
import { PaymentTermsEditor } from '~/components/fiscal/PaymentTermsEditor';
import { SettingsMobileMenu, SettingsTabs, type SettingsTabId, type TabDef } from '~/components/settings/SettingsTabs';
import { ACTIVITY_PARAMS, getActivities, getPrimaryActivity } from '~/lib/fiscal';
import { calcVLEligibilityForYear } from '~/lib/vlEligibility';
import { formatEuro } from '~/lib/format';
import {
  BACKUP_MAX_BYTES,
  buildBackupFilename,
  createBackupFromStorage,
  parseBackupText,
  restoreBackupToStorage,
  serializeBackup,
  type ParsedBackup,
} from '~/lib/importExport';

interface SettingsDrawerProps {
  open: boolean;
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  onClose: () => void;
  year: number;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onResetAll: () => void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const TABS: TabDef[] = [
  { id: 'fiscal', label: 'Activité & fiscalité', description: 'TVA, impôt, ACRE et URSSAF', Icon: Calculator },
  { id: 'payments', label: 'Facturation & encaissement', description: 'Mission, factures et règlements', Icon: CalendarClock },
  { id: 'costs', label: 'Charges fixes', description: 'Dépenses mensuelles déduites du net', Icon: Receipt },
  { id: 'profile', label: 'Profil & apparence', description: 'Identité et thème de l’interface', Icon: User },
  { id: 'backup', label: 'Données & sauvegarde', description: 'Export, import et réinitialisation', Icon: DatabaseBackup },
];

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, children, tone = 'default' }) => (
  <section className={tone === 'danger' ? 'rounded-2xl border border-red-500/25 bg-red-50/60 p-4 dark:bg-red-500/[0.07] sm:p-5' : 'rounded-2xl border border-outline-variant/25 bg-surface-low p-4 sm:p-5'}>
    <div className="mb-4">
      <h3 className={tone === 'danger' ? 'text-sm font-bold text-red-700 dark:text-red-300' : 'font-headline text-sm font-bold text-on-surface'}>{title}</h3>
      {description && <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>}
    </div>
    {children}
  </section>
);

const formatBackupDate = (value: string | null | undefined): string => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  activeTab,
  onTabChange,
  onClose,
  year,
  profile,
  setProfile,
  onResetAll,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ParsedBackup | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const pendingImportRef = useRef(false);
  const dragControls = useDragControls();
  pendingImportRef.current = pendingImport != null;

  useEffect(() => {
    if (!open) return;
    setMobileMenuOpen(true);
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (pendingImportRef.current) return;
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
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  const updateProfile = (patch: Partial<UserProfile>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 80) onCloseRef.current();
  };

  const handleExportBackup = () => {
    try {
      const now = new Date();
      const backup = createBackupFromStorage(window.localStorage, now);
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildBackupFilename(now);
      a.click();
      URL.revokeObjectURL(url);
      setBackupError(null);
      setBackupNotice('Sauvegarde exportée.');
    } catch {
      setBackupNotice(null);
      setBackupError("Impossible d'exporter les données locales.");
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setBackupNotice(null);
    setBackupError(null);
    if (!file) return;
    if (file.size > BACKUP_MAX_BYTES) {
      setBackupError('Fichier trop volumineux pour une sauvegarde Fiscal Architect.');
      return;
    }
    try {
      setPendingImport(parseBackupText(await file.text()));
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : 'Sauvegarde invalide.');
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try {
      restoreBackupToStorage(pendingImport.backup, window.localStorage);
      setPendingImport(null);
      window.location.replace(window.location.pathname);
    } catch {
      setBackupError("Impossible de restaurer cette sauvegarde.");
      setPendingImport(null);
    }
  };

  const importSummary = pendingImport?.summary ?? null;
  const importDate = formatBackupDate(importSummary?.exportedAt);
  const activeTabDef = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const getMobileStatus = (tab: TabDef): string | undefined => {
    if (tab.id === 'fiscal') return profile.tvaAssujetti ? 'TVA active · vos calculs sont mis à jour' : 'Franchise en base de TVA';
    if (tab.id === 'costs') return profile.fixedCosts.length === 0 ? 'Aucune charge fixe enregistrée' : `${profile.fixedCosts.length} charge${profile.fixedCosts.length > 1 ? 's' : ''} mensuelle${profile.fixedCosts.length > 1 ? 's' : ''}`;
    if (tab.id === 'profile') return profile.name ? profile.name : undefined;
    return undefined;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] bg-overlay backdrop-blur-sm flex md:items-stretch md:justify-end items-end justify-center"
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
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[92dvh] w-full max-w-full flex-col overflow-hidden rounded-t-3xl bg-surface-lowest shadow-2xl md:h-screen md:max-h-screen md:max-w-[1040px] md:rounded-l-3xl md:rounded-tr-none xl:max-w-[1120px]"
          >
            {/* Drag handle (mobile only) */}
            <div
              className="flex cursor-grab justify-center pb-1 pt-2 active:cursor-grabbing md:hidden"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="w-10 h-1 rounded-full bg-outline-variant" aria-hidden="true" />
            </div>

            <header className="flex items-center justify-between border-b border-outline-variant/15 px-6 pb-3 pt-3 md:px-8 md:py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {!mobileMenuOpen && (
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      className="-ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 md:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Réglages
                    </button>
                  )}
                  <h2 className="font-headline text-lg font-bold text-on-surface md:text-xl">
                    <span className="md:hidden">{mobileMenuOpen ? 'Réglages' : activeTabDef.label}</span>
                    <span className="hidden md:inline">Réglages</span>
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  <span className="md:hidden">{mobileMenuOpen ? 'Configurez votre simulation.' : activeTabDef.description}</span>
                  <span className="hidden md:inline">Vos préférences sont enregistrées automatiquement sur cet appareil.</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-bold text-secondary md:inline-flex">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Enregistré localement
                </span>
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
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              <aside className="hidden w-[276px] shrink-0 border-r border-outline-variant/15 bg-surface-low/45 p-4 md:block">
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Configurer la simulation</p>
                <SettingsTabs tabs={TABS} active={activeTab} onChange={onTabChange} />
              </aside>

              {mobileMenuOpen && (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:hidden">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-secondary">Configurer la simulation</p>
                  <SettingsMobileMenu
                    tabs={TABS}
                    active={activeTab}
                    getStatus={getMobileStatus}
                    onChange={(tab) => {
                      onTabChange(tab);
                      setMobileMenuOpen(false);
                    }}
                  />
                </div>
              )}

              <div className={(mobileMenuOpen ? 'hidden md:block' : 'block') + ' min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8 md:py-8'}>
              {activeTab === 'profile' && (
                <section aria-labelledby="settings-profile-title" className="mx-auto max-w-2xl space-y-4">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Préférences</p>
                    <h2 id="settings-profile-title" className="mt-1 font-headline text-2xl font-bold tracking-tight text-on-surface">Profil & apparence</h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Personnalisez l’identité affichée et le thème de l’application.</p>
                  </div>
                  <SettingsCard title="Votre profil" description="Ces informations sont affichées dans votre espace de simulation.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                    <label
                      htmlFor="settings-name"
                      className="mb-2 block text-xs font-bold text-on-surface"
                    >
                      Nom
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                      autoComplete="name"
                      className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 px-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="settings-role"
                      className="mb-2 block text-xs font-bold text-on-surface"
                    >
                      Rôle
                    </label>
                    <input
                      id="settings-role"
                      type="text"
                      value={profile.role}
                      onChange={(e) => updateProfile({ role: e.target.value })}
                      autoComplete="organization-title"
                      className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 px-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
                    />
                  </div>
                    </div>
                  </SettingsCard>

                  <SettingsCard title="Apparence" description="Choisissez le thème qui vous convient le mieux.">
                    <fieldset
                      role="radiogroup"
                      aria-label="Thème de l'interface"
                      className="grid grid-cols-3 gap-2 p-0 m-0 border-0"
                    >
                      {(
                        [
                          { id: 'system', label: 'Système', Icon: Monitor },
                          { id: 'light', label: 'Clair', Icon: Sun },
                          { id: 'dark', label: 'Sombre', Icon: Moon },
                        ] as const
                      ).map(({ id, label, Icon }) => {
                        const active = themeMode === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setThemeMode(id as ThemeMode)}
                            className={
                              'min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-sm font-bold transition-colors ' +
                              (active
                                ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20 text-secondary'
                                : 'border-outline-variant/30 bg-surface-lowest text-on-surface hover:bg-surface-highest/30')
                            }
                          >
                            <Icon className="w-4 h-4" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </fieldset>
                    <p className="mt-2 text-[11px] text-on-surface-variant leading-relaxed">
                      Suit le thème système si activé.
                    </p>
                  </SettingsCard>
                </section>
              )}

              {activeTab === 'fiscal' && (
                <section aria-labelledby="settings-fiscal-title" className="mx-auto max-w-2xl space-y-4">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Simulation</p>
                    <h2 id="settings-fiscal-title" className="mt-1 font-headline text-2xl font-bold tracking-tight text-on-surface">Activité & fiscalité</h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Les paramètres qui déterminent vos taux, options et seuils de calcul.</p>
                  </div>

                  <SettingsCard title="Votre activité" description="L’activité principale détermine les taux URSSAF, l’abattement et le seuil micro.">
                    <ActivityManager
                      activities={profile.activities}
                      onChange={(next) => {
                        const primary = next.find((a) => a.isPrimary) ?? next[0];
                        const params = ACTIVITY_PARAMS[primary.type];
                        updateProfile({
                          activities: next,
                          urssafRate: params.urssafRate,
                          seuilMicro: params.plafond,
                          taxeConsulaireEnabled: params.taxeConsulaireRate > 0,
                        });
                      }}
                    />
                    <AutoChargesInfo activity={getPrimaryActivity(profile).type} />
                  </SettingsCard>

                  <TVAToggle
                    value={profile.tvaAssujetti}
                    rate={profile.tvaRate}
                    effectiveDate={profile.tvaEffectiveDate}
                    year={year}
                    onChange={(v) => updateProfile({
                      tvaAssujetti: v,
                      tvaEffectiveDate: v ? profile.tvaEffectiveDate ?? `${year}-01-01` : null,
                    })}
                    onRateChange={(v) => updateProfile({ tvaRate: v })}
                    onEffectiveDateChange={(v) => updateProfile({ tvaEffectiveDate: v })}
                  />

                  <SettingsCard title="Impôt sur le revenu" description="Votre RFR détermine notamment l’éligibilité au versement libératoire.">
                    <div className="space-y-5">
                    <RFRInput
                      rfrN2={profile.rfrN2}
                      partsFiscales={profile.partsFiscales}
                      onRFRChange={(v) => updateProfile({ rfrN2: v })}
                      onPartsChange={(v) => updateProfile({ partsFiscales: v })}
                      year={year}
                    />
                    {(() => {
                      const elig = calcVLEligibilityForYear(profile.rfrN2, profile.partsFiscales, year);
                      const reason = elig.motif === 'rfr-too-high'
                        ? `Revenu fiscal de référence ${elig.rfrYear} supérieur au plafond ${formatEuro(elig.threshold)}€ — versement libératoire ${year} non disponible.`
                        : null;
                      return (
                        <VLToggle
                          value={profile.versementLiberatoire}
                          onChange={(v) => updateProfile({ versementLiberatoire: v })}
                          tauxVL={ACTIVITY_PARAMS[getPrimaryActivity(profile).type].tauxVL}
                          ineligibleReason={reason}
                        />
                      );
                    })()}
                    <Link
                      to="/regularisation-vl"
                      onClick={onClose}
                      className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-low px-3 py-3 text-left transition-colors hover:border-secondary/35 hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
                      >
                        <Landmark className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-on-surface">
                          Préparer une régularisation
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-on-surface-variant">
                          Estimer les fonds à provisionner si le VL a été payé sur des mois non éligibles.
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
                      />
                    </Link>
                    </div>
                  </SettingsCard>

                  <SettingsCard title="ACRE & protection" description="Les droits applicables dépendent de votre date de création et de votre activité.">
                    <div className="space-y-5">
                      <CreationDateInput
                        value={profile.creationDate}
                        onChange={(v) => updateProfile({ creationDate: v })}
                      />
                      <ACREToggle
                        value={profile.acreEnabled}
                        onChange={(v) => updateProfile({ acreEnabled: v })}
                        creationDate={profile.creationDate}
                      />
                    <IJToggle
                      value={profile.ijOption}
                      onChange={(v) => updateProfile({ ijOption: v })}
                      activities={getActivities(profile)}
                    />
                    </div>
                  </SettingsCard>

                  <SettingsCard title="Déclaration & seuils" description="Ces paramètres servent à garder votre simulation alignée avec votre régime.">
                    <div className="space-y-5">
                    <div>
                    <p className="mb-3 text-xs font-bold text-on-surface">Périodicité de déclaration URSSAF</p>
                    <fieldset
                      role="radiogroup"
                      aria-label="Périodicité de déclaration"
                      className="grid grid-cols-2 gap-2 p-0 m-0 border-0"
                    >
                      {(['monthly', 'quarterly'] as const).map((period) => {
                        const active = profile.declarationPeriod === period;
                        return (
                          <button
                            key={period}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => updateProfile({ declarationPeriod: period })}
                            className={
                              'min-h-[44px] rounded-2xl border px-3 py-2 text-sm font-bold text-left transition-colors ' +
                              (active
                                ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20 text-secondary'
                                : 'border-outline-variant/30 bg-surface-lowest text-on-surface hover:bg-surface-highest/30')
                            }
                          >
                            {period === 'monthly' ? 'Mensuelle' : 'Trimestrielle'}
                          </button>
                        );
                      })}
                    </fieldset>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Information uniquement — n'affecte pas les calculs affichés.
                    </p>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-bold text-on-surface">Seuil micro-entreprise</p>
                    <SeuilInput
                      value={profile.seuilMicro}
                      onChange={(v) => updateProfile({ seuilMicro: v })}
                      defaultValue={ACTIVITY_PARAMS[getPrimaryActivity(profile).type].plafond}
                    />
                  </div>
                    </div>
                  </SettingsCard>
                </section>
              )}

              {activeTab === 'payments' && (
                <section aria-labelledby="settings-payments-title" className="mx-auto max-w-2xl space-y-4">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Prévision</p>
                    <h2 id="settings-payments-title" className="mt-1 font-headline text-2xl font-bold tracking-tight text-on-surface">Facturation & encaissement</h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Définissez comment votre chiffre d’affaires est facturé et encaissé.</p>
                  </div>
                  <SettingsCard title="Mission & facturation" description="Ces choix structurent vos projections de revenus.">
                    <div className="space-y-5">
                    <MissionStartInput
                      value={profile.missionStart}
                      onChange={(v) => updateProfile({ missionStart: v })}
                      year={year}
                    />
                    <div className="space-y-3">
                      <p className="text-xs leading-relaxed text-on-surface-variant">Choisissez le modèle qui correspond à votre façon de facturer.</p>
                      <RevenueModeSelector
                        value={profile.revenueModel}
                        onChange={(next) => updateProfile({ revenueModel: next })}
                      />
                    </div>
                    </div>
                  </SettingsCard>

                  <SettingsCard title="Encaissement" description="Indiquez le délai habituel entre une facture et son règlement.">
                    <PaymentTermsEditor
                      days={profile.paymentDelayDays}
                      mode={profile.paymentDelayMode}
                      endOfMonthCalculation={profile.endOfMonthCalculation}
                      onChange={updateProfile}
                    />
                  </SettingsCard>
                </section>
              )}

              {activeTab === 'costs' && (
                <section aria-labelledby="settings-costs-title" className="mx-auto max-w-2xl space-y-4">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Prévision</p>
                    <h2 id="settings-costs-title" className="mt-1 font-headline text-2xl font-bold tracking-tight text-on-surface">Charges fixes</h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Vos dépenses mensuelles sont déduites pour estimer votre revenu réellement disponible.</p>
                  </div>
                  <SettingsCard title="Dépenses mensuelles" description="Ajoutez uniquement les charges récurrentes liées à votre activité.">
                  <FixedCostsList
                    costs={profile.fixedCosts}
                    onChange={(next) => updateProfile({ fixedCosts: next })}
                  />
                  </SettingsCard>
                </section>
              )}

              {activeTab === 'backup' && (
                <section aria-labelledby="settings-backup-title" className="mx-auto max-w-2xl space-y-4">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">Cet appareil</p>
                    <h2 id="settings-backup-title" className="mt-1 font-headline text-2xl font-bold tracking-tight text-on-surface">Données & sauvegarde</h2>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Vos informations restent dans ce navigateur. Exportez-les avant un changement d’appareil ou une réinitialisation.</p>
                  </div>

                  <SettingsCard title="Sauvegarde locale" description="Créez un fichier complet, utilisable pour restaurer vos données plus tard.">
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Exporter mes données
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-outline-variant/40 bg-surface-lowest text-on-surface text-sm font-bold hover:bg-surface-highest/30 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    >
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      Importer une sauvegarde
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".fiscal-architect-backup,application/json"
                      className="sr-only"
                      onChange={handleImportFile}
                      aria-label="Choisir une sauvegarde Fiscal Architect"
                    />
                  </div>

                  {(backupNotice || backupError) && (
                    <div
                      role="status"
                      className={
                        'rounded-xl border px-3 py-2 text-xs leading-relaxed ' +
                        (backupError
                          ? 'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
                          : 'border-secondary/25 bg-secondary/10 text-secondary')
                      }
                    >
                      {backupError ?? backupNotice}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl bg-surface-lowest px-3 py-3">
                    <h4 className="text-sm font-bold text-on-surface">Ce qui est inclus</h4>
                    <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                      Profil, années, calendriers et paramètres fiscaux — dont la TVA (assujettissement, taux et date d’effet). Rien n'est envoyé à un serveur.
                    </p>
                  </div>
                  </SettingsCard>

                  <SettingsCard title="Zone sensible" description="Cette action efface les données stockées dans ce navigateur." tone="danger">
                    <button
                      type="button"
                      onClick={onResetAll}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Tout réinitialiser
                    </button>
                  </SettingsCard>
                </section>
              )}
            </div>
            </div>

            <ConfirmModal
              open={pendingImport != null}
              title="Restaurer cette sauvegarde ?"
              destructive
              confirmLabel="Restaurer"
              cancelLabel="Annuler"
              onConfirm={confirmImport}
              onCancel={() => setPendingImport(null)}
              message={
                importSummary ? (
                  <div className="space-y-2">
                    <p>Les données locales actuelles seront remplacées par cette sauvegarde.</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      <dt className="font-bold text-on-surface">Export</dt>
                      <dd>{importDate}</dd>
                      <dt className="font-bold text-on-surface">Profil</dt>
                      <dd>{importSummary.profileName ?? 'Non renseigné'}</dd>
                      <dt className="font-bold text-on-surface">Années</dt>
                      <dd>{importSummary.years.length > 0 ? importSummary.years.join(', ') : 'Non détectées'}</dd>
                      <dt className="font-bold text-on-surface">Clés</dt>
                      <dd>{importSummary.keyCount}</dd>
                    </dl>
                  </div>
                ) : null
              }
            />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
