import React, { useEffect, useState } from 'react';
import { Download, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '~/utils';
import type { UserProfile } from '~/types';
import { formatEuro } from '~/lib/format';
import { NotificationBell } from '~/components/notifications/NotificationBell';
import { EditableField } from '~/components/ui/EditableField';
import { QuickEditModal } from '~/components/ui/QuickEditModal';

interface TopBarProps {
  profile: UserProfile;
  caCumule: number;
  onExport: () => void;
  onOpenSettings: () => void;
  onProfileChange: (patch: Partial<UserProfile>) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ profile, caCumule, onExport, onOpenSettings, onProfileChange }) => {
  const seuil = profile.seuilMicro;
  const pctReal = Math.min(100, (caCumule / seuil) * 100);
  const isOver = caCumule >= seuil;
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftRole, setDraftRole] = useState(profile.role);

  // Resynchronise le draft à l'ouverture (au cas où le profile a changé entre-temps)
  useEffect(() => {
    if (editingIdentity) {
      setDraftName(profile.name);
      setDraftRole(profile.role);
    }
  }, [editingIdentity, profile.name, profile.role]);

  const saveIdentity = () => {
    onProfileChange({ name: draftName.trim() || profile.name, role: draftRole.trim() });
    setEditingIdentity(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
        {/* Brand + identité */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-headline font-black text-sm shadow-md shrink-0"
          >
            FA
          </div>
          <div className="min-w-0">
            <h1 className="font-headline font-black text-sm sm:text-base text-on-surface leading-tight truncate">
              Fiscal Architect
            </h1>
            <EditableField
              ariaLabel="Modifier le nom et le rôle"
              onClick={() => setEditingIdentity(true)}
              className="px-1 py-0.5 -mx-1"
            >
              <p className="text-[11px] text-on-surface-variant leading-tight truncate max-w-[180px] sm:max-w-[280px] md:max-w-none">
                <span className="font-semibold">{profile.name}</span>
                <span className="hidden sm:inline"> · {profile.role}</span>
              </p>
            </EditableField>
          </div>
        </div>

        {/* KPI inline (md+) */}
        <div className="hidden md:flex items-center gap-3 min-w-0 flex-1 max-w-md mx-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>CA / seuil</span>
              <span className="font-mono tabular-nums text-on-surface">
                {formatEuro(caCumule)}€
                <span className="text-on-surface-variant font-normal"> / {formatEuro(seuil)}€</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-surface-highest/60 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', isOver ? 'bg-red-500' : 'bg-secondary')}
                style={{ width: `${pctReal}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onExport}
            aria-label="Exporter en CSV"
            title="Exporter en CSV"
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <Download className="w-5 h-5" />
          </button>
          <NotificationBell />
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Ouvrir les réglages"
            title="Réglages"
            className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-highest/40 hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <QuickEditModal
        open={editingIdentity}
        onClose={() => setEditingIdentity(false)}
        title="Identité"
        description="Affiché dans l'en-tête et utilisé dans les exports."
        primaryAction={{ label: 'Enregistrer', onClick: saveIdentity, disabled: !draftName.trim() }}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="navbar-name"
              className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2"
            >
              Nom
            </label>
            <input
              id="navbar-name"
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draftName.trim()) saveIdentity();
              }}
              autoComplete="name"
              className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 px-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
            />
          </div>
          <div>
            <label
              htmlFor="navbar-role"
              className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2"
            >
              Rôle
            </label>
            <input
              id="navbar-role"
              type="text"
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draftName.trim()) saveIdentity();
              }}
              autoComplete="organization-title"
              className="w-full bg-surface-lowest border border-outline-variant rounded-xl py-2.5 px-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[44px]"
            />
          </div>
        </div>
      </QuickEditModal>
    </header>
  );
};
