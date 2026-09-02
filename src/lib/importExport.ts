import pkg from '../../package.json';

export const BACKUP_FORMAT = 'fiscal-architect-backup';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_EXTENSION = 'fiscal-architect-backup';
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024;

interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface FiscalArchitectBackup {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  appVersion: string;
  exportedAt: string;
  data: Record<string, string>;
}

export interface BackupSummary {
  exportedAt: string;
  appVersion: string;
  keyCount: number;
  years: number[];
  activeYear: number | null;
  profileName: string | null;
}

export interface ParsedBackup {
  backup: FiscalArchitectBackup;
  summary: BackupSummary;
}

export class BackupImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupImportError';
  }
}

export function isFiscalStorageKey(key: string): boolean {
  return key.startsWith('fiscal-');
}

export function createBackupFromStorage(
  storage: StorageLike,
  now: Date = new Date(),
): FiscalArchitectBackup {
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !isFiscalStorageKey(key)) continue;
    const value = storage.getItem(key);
    if (value != null) data[key] = value;
  }

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: pkg.version,
    exportedAt: now.toISOString(),
    data,
  };
}

export function serializeBackup(backup: FiscalArchitectBackup): string {
  return JSON.stringify(backup);
}

export function buildBackupFilename(now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  return `fiscal-architect-backup-${date}.${BACKUP_EXTENSION}`;
}

export function parseBackupText(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupImportError('Fichier de sauvegarde illisible.');
  }

  const backup = parsed as Partial<FiscalArchitectBackup>;
  if (backup.format !== BACKUP_FORMAT) {
    throw new BackupImportError("Ce fichier n'est pas une sauvegarde Fiscal Architect.");
  }
  if (backup.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupImportError('Version de sauvegarde non supportee par cette application.');
  }
  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    throw new BackupImportError('La sauvegarde ne contient aucune donnee restaurable.');
  }

  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(backup.data)) {
    if (!isFiscalStorageKey(key)) continue;
    if (typeof value !== 'string') {
      throw new BackupImportError(`La cle ${key} contient une valeur invalide.`);
    }
    data[key] = value;
  }

  if (Object.keys(data).length === 0) {
    throw new BackupImportError('La sauvegarde ne contient aucune donnee Fiscal Architect.');
  }

  const normalized: FiscalArchitectBackup = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: typeof backup.appVersion === 'string' ? backup.appVersion : 'inconnue',
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : '',
    data,
  };

  return {
    backup: normalized,
    summary: summarizeBackup(normalized),
  };
}

export function summarizeBackup(backup: FiscalArchitectBackup): BackupSummary {
  const yearsIndex = readJson<{ years?: unknown; activeYear?: unknown }>(backup.data['fiscal-years-index']);
  const profile = readJson<{ name?: unknown }>(backup.data['fiscal-profile']);
  const years = Array.isArray(yearsIndex?.years)
    ? yearsIndex.years.filter((year): year is number => Number.isInteger(year)).sort((a, b) => a - b)
    : extractYearsFromKeys(Object.keys(backup.data));
  const activeYear = yearsIndex && Number.isInteger(yearsIndex.activeYear)
    ? yearsIndex.activeYear as number
    : null;

  return {
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    keyCount: Object.keys(backup.data).length,
    years,
    activeYear,
    profileName: typeof profile?.name === 'string' && profile.name.trim() ? profile.name : null,
  };
}

export function restoreBackupToStorage(backup: FiscalArchitectBackup, storage: StorageLike): void {
  const keys = listStorageKeys(storage).filter(isFiscalStorageKey);
  for (const key of keys) storage.removeItem(key);
  for (const [key, value] of Object.entries(backup.data)) {
    if (isFiscalStorageKey(key)) storage.setItem(key, value);
  }
}

function listStorageKeys(storage: StorageLike): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

function extractYearsFromKeys(keys: string[]): number[] {
  const years = new Set<number>();
  for (const key of keys) {
    const match = key.match(/^fiscal-(?:year-config|calendar)-(\d{4})$/);
    if (match) years.add(Number(match[1]));
  }
  return [...years].sort((a, b) => a - b);
}

function readJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
