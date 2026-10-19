import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Monitor, Moon, Sun, Upload } from 'lucide-react';
import { useProfile } from '~/context/ProfileContext';
import { useFiscalYearCtx } from '~/context/FiscalYearContext';
import { useTheme, type ThemeMode } from '~/context/ThemeContext';
import { FixedCostsEditor } from '~/components/fiscal/FixedCostsEditor';
import { Field, TextInput } from '~/ui/Field';
import { Segmented } from '~/ui/Segmented';
import { Button } from '~/ui/Button';
import { Dialog } from '~/ui/Dialog';
import {
  BACKUP_MAX_BYTES,
  buildBackupFilename,
  createBackupFromStorage,
  parseBackupText,
  restoreBackupToStorage,
  serializeBackup,
  type ParsedBackup,
} from '~/lib/importExport';
import { SettingsBlock, SettingsRow, StatusNote } from './parts';
import type { UserProfile } from '~/types';

export function SectionCharges() {
  const { profile, setProfile } = useProfile();
  return (
    <SettingsBlock
      id="charges"
      title="Charges fixes mensuelles"
      description="Abonnements et frais récurrents, déduits chaque mois de votre net."
    >
      <SettingsRow>
        <FixedCostsEditor costs={profile.fixedCosts} onChange={(next) => setProfile((p) => ({ ...p, fixedCosts: next }))} />
      </SettingsRow>
    </SettingsBlock>
  );
}

export function SectionProfil() {
  const { profile, setProfile } = useProfile();
  const { mode, setMode } = useTheme();
  const update = (patch: Partial<UserProfile>) => setProfile((p) => ({ ...p, ...patch }));
  return (
    <div className="space-y-5">
      <SettingsBlock id="identite" title="Identité" description="Affichée dans l’application et dans les exports.">
        <SettingsRow className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom">
            {({ inputId }) => (
              <TextInput id={inputId} value={profile.name} autoComplete="name" onChange={(e) => update({ name: e.target.value })} />
            )}
          </Field>
          <Field label="Activité ou métier">
            {({ inputId }) => (
              <TextInput
                id={inputId}
                value={profile.role}
                autoComplete="organization-title"
                onChange={(e) => update({ role: e.target.value })}
              />
            )}
          </Field>
        </SettingsRow>
      </SettingsBlock>
      <SettingsBlock id="apparence" title="Apparence" description="Le plan s’imprime en bleu sur calque le jour, en traits clairs sur bleu de Prusse la nuit.">
        <SettingsRow>
          <Segmented<ThemeMode>
            label="Thème de l'interface"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'system', label: 'Système', icon: <Monitor className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> },
              { value: 'light', label: 'Clair', icon: <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> },
              { value: 'dark', label: 'Sombre', icon: <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> },
            ]}
          />
        </SettingsRow>
      </SettingsBlock>
    </div>
  );
}

const formatBackupDate = (value: string | null | undefined): string => {
  if (!value) return 'date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'date inconnue';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export function SectionDonnees() {
  const { handleExportGlobal } = useProfile();
  const fy = useFiscalYearCtx();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'alert'; text: string } | null>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportBackup = () => {
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
      setNotice({ tone: 'ok', text: 'Sauvegarde téléchargée. Gardez ce fichier en lieu sûr.' });
    } catch {
      setNotice({ tone: 'alert', text: 'Impossible d’exporter les données de cet appareil.' });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setNotice(null);
    if (!file) return;
    if (file.size > BACKUP_MAX_BYTES) {
      setNotice({ tone: 'alert', text: 'Ce fichier est trop volumineux pour être une sauvegarde Fiscal Architect.' });
      return;
    }
    try {
      setPending(parseBackupText(await file.text()));
    } catch (err) {
      setNotice({ tone: 'alert', text: err instanceof Error ? err.message : 'Ce fichier n’est pas une sauvegarde valide.' });
    }
  };

  const restore = () => {
    if (!pending) return;
    try {
      restoreBackupToStorage(pending.backup, window.localStorage);
      setPending(null);
      window.location.replace(window.location.pathname);
    } catch {
      setPending(null);
      setNotice({ tone: 'alert', text: 'La restauration a échoué ; vos données actuelles sont intactes.' });
    }
  };

  const s = pending?.summary;

  return (
    <div className="space-y-5">
      <SettingsBlock
        id="sauvegarde"
        title="Sauvegarde"
        description="Tout vit dans ce navigateur. Une sauvegarde permet de changer d’appareil ou de repartir d’un état connu."
      >
        <SettingsRow className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" icon={<Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />} onClick={exportBackup}>
              Télécharger une sauvegarde
            </Button>
            <Button
              variant="secondary"
              icon={<Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
              onClick={() => fileRef.current?.click()}
            >
              Restaurer une sauvegarde
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".fiscal-architect-backup,application/json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={onFile}
            />
          </div>
          {notice && <StatusNote tone={notice.tone}>{notice.text}</StatusNote>}
          <p className="text-[13px] text-ink-2">
            Inclus : profil, toutes les années (paramètres et calendrier), alertes masquées et thème.
          </p>
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock id="export" title="Export tableur" description={`Un fichier CSV de l’année ${fy.year}, mois par mois : jours, CA, TVA, cotisations, impôt et net.`}>
        <SettingsRow>
          <Button variant="secondary" icon={<FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />} onClick={handleExportGlobal}>
            Exporter {fy.year} en CSV
          </Button>
        </SettingsRow>
      </SettingsBlock>

      <SettingsBlock id="reinitialiser" title="Tout effacer" tone="danger" description="Supprime profil, années, calendriers et réglages de cet appareil.">
        <SettingsRow>
          <div className="pt-2">
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Effacer toutes les données
            </Button>
          </div>
        </SettingsRow>
      </SettingsBlock>

      <Dialog
        open={pending != null}
        onClose={() => setPending(null)}
        role="alertdialog"
        title="Restaurer cette sauvegarde ?"
        description="Les données actuelles de cet appareil seront remplacées."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)} data-autofocus>
              Annuler
            </Button>
            <Button variant="primary" onClick={restore}>
              Restaurer
            </Button>
          </>
        }
      >
        {s && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[14px]">
            <dt className="text-ink-2">Exportée le</dt>
            <dd className="text-ink">{formatBackupDate(s.exportedAt)}</dd>
            <dt className="text-ink-2">Profil</dt>
            <dd className="text-ink">{s.profileName || 'sans nom'}</dd>
            <dt className="text-ink-2">Années</dt>
            <dd className="text-ink tnum">{s.years.length ? s.years.join(', ') : 'aucune'}</dd>
            <dt className="text-ink-2">Éléments</dt>
            <dd className="text-ink tnum">{s.keyCount}</dd>
          </dl>
        )}
      </Dialog>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        role="alertdialog"
        title="Effacer toutes les données ?"
        description="Calendriers, années, profil et réglages disparaîtront de cet appareil. Sans sauvegarde, c’est définitif."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)} data-autofocus>
              Annuler
            </Button>
            <Button variant="danger" onClick={() => fy.resetEverything()}>
              Tout effacer
            </Button>
          </>
        }
      />
    </div>
  );
}
