import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
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
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTheme, type ThemeMode } from '~/context/ThemeContext';
import type { UserProfile } from '~/types';
import { ConfirmModal } from '~/components/ConfirmModal';
import { MissionStartInput } from '~/components/fiscal/MissionStartInput';
import { CreationDateInput } from '~/components/fiscal/CreationDateInput';
import { ActivitySelector } from '~/components/fiscal/ActivitySelector';
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
import { SettingsTabs, type SettingsTabId, type TabDef } from '~/components/settings/SettingsTabs';
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
  { id: 'fiscal', label: 'Fiscal', Icon: Calculator },
  { id: 'payments', label: 'Revenus', Icon: CalendarClock },
  { id: 'profile', label: 'Profil', Icon: User },
  { id: 'costs', label: 'Charges', Icon: Receipt },
  { id: 'backup', label: 'Sauvegarde', Icon: DatabaseBackup },
];

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
  const pendingImportRef = useRef(false);
  pendingImportRef.current = pendingImport != null;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

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

  const panelId = (id: SettingsTabId) => `settings-panel-${id}`;
  const tabId = (id: SettingsTabId) => `settings-tab-${id}`;
  const importSummary = pendingImport?.summary ?? null;
  const importDate = formatBackupDate(importSummary?.exportedAt);

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
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-full md:max-w-[440px] xl:max-w-[480px] bg-surface-lowest rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl h-[92dvh] md:h-screen md:max-h-screen overflow-hidden flex flex-col"
          >
            {/* Drag handle (mobile only) */}
            <div className="md:hidden pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-outline-variant" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-3 md:pt-6 flex items-start justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">Réglages</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Profil, fiscalité, revenus et charges.
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
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="settings-name"
                      className="block text-xs font-bold uppercase tracking-wider text-secondary mb-3"
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
                      className="block text-xs font-bold uppercase tracking-wider text-secondary mb-3"
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

                  <div>
                    <h3 className="block text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                      Apparence
                    </h3>
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
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        );
                      })}
                    </fieldset>
                    <p className="mt-2 text-[11px] text-on-surface-variant leading-relaxed">
                      Suit le thème système si activé.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/15 space-y-3">
                    <button
                      type="button"
                      onClick={onResetAll}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
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
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Activités
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed -mt-1">
                      Vous pouvez en cumuler plusieurs (ex. dev + vente de templates).
                      L'activité primaire pilote URSSAF, abattement et seuil.
                    </p>
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
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Régime fiscal
                    </h3>
                    <CreationDateInput
                      value={profile.creationDate}
                      onChange={(v) => updateProfile({ creationDate: v })}
                    />
                    <ACREToggle
                      value={profile.acreEnabled}
                      onChange={(v) => updateProfile({ acreEnabled: v })}
                      creationDate={profile.creationDate}
                    />
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
                    <TVAToggle
                      value={profile.tvaAssujetti}
                      rate={profile.tvaRate}
                      onChange={(v) => updateProfile({ tvaAssujetti: v })}
                      onRateChange={(v) => updateProfile({ tvaRate: v })}
                    />
                    <IJToggle
                      value={profile.ijOption}
                      onChange={(v) => updateProfile({ ijOption: v })}
                      activities={getActivities(profile)}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Déclaration URSSAF
                    </h3>
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                      Seuil micro-entreprise
                    </h3>
                    <SeuilInput
                      value={profile.seuilMicro}
                      onChange={(v) => updateProfile({ seuilMicro: v })}
                      defaultValue={ACTIVITY_PARAMS[getPrimaryActivity(profile).type].plafond}
                    />
                  </div>
                </section>
              )}

              {activeTab === 'payments' && (
                <section
                  role="tabpanel"
                  id={panelId('payments')}
                  aria-labelledby={tabId('payments')}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Mission et facturation
                    </h3>
                    <MissionStartInput
                      value={profile.missionStart}
                      onChange={(v) => updateProfile({ missionStart: v })}
                      year={year}
                    />
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] leading-relaxed text-on-surface-variant">
                        Comment vous facturez votre activité — choisissez ce qui correspond à votre quotidien.
                      </p>
                      <RevenueModeSelector
                        value={profile.revenueModel}
                        onChange={(next) => updateProfile({ revenueModel: next })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-outline-variant/15 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Encaissement
                    </h3>
                    <PaymentTermsEditor
                      days={profile.paymentDelayDays}
                      mode={profile.paymentDelayMode}
                      endOfMonthCalculation={profile.endOfMonthCalculation}
                      onChange={updateProfile}
                    />
                  </div>
                </section>
              )}

              {activeTab === 'costs' && (
                <section
                  role="tabpanel"
                  id={panelId('costs')}
                  aria-labelledby={tabId('costs')}
                  className="space-y-4"
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

              {activeTab === 'backup' && (
                <section
                  role="tabpanel"
                  id={panelId('backup')}
                  aria-labelledby={tabId('backup')}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Sauvegarde locale
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Exportez un snapshot complet des données locales pour le restaurer après un reset ou un redéploiement.
                    </p>
                  </div>

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

                  <div className="rounded-2xl border border-outline-variant/25 bg-surface-lowest p-4">
                    <h4 className="text-sm font-bold text-on-surface">Ce qui est inclus</h4>
                    <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
                      Profil, années, calendriers, paramètres fiscaux, thème et état local de l'application. Rien n'est envoyé à un serveur.
                    </p>
                  </div>
                </section>
              )}
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
