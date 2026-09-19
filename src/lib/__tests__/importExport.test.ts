import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BackupImportError,
  buildBackupFilename,
  createBackupFromStorage,
  parseBackupText,
  restoreBackupToStorage,
  serializeBackup,
} from '~/lib/importExport';

class MemoryStorage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe('importExport', () => {
  it('exporte uniquement les cles fiscal-*', () => {
    const storage = new MemoryStorage();
    storage.setItem('fiscal-profile', '{"name":"Maxime"}');
    storage.setItem('fiscal-calendar-2026', '{"year":2026}');
    storage.setItem('other-app', 'ignore');

    const backup = createBackupFromStorage(storage, new Date('2026-09-02T10:00:00.000Z'));

    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.exportedAt).toBe('2026-09-02T10:00:00.000Z');
    expect(Object.keys(backup.data)).toEqual(['fiscal-profile', 'fiscal-calendar-2026']);
  });

  it('parse une sauvegarde et produit un resume utile', () => {
    const text = serializeBackup({
      format: BACKUP_FORMAT,
      formatVersion: 1,
      appVersion: '1.2.0',
      exportedAt: '2026-09-02T10:00:00.000Z',
      data: {
        'fiscal-profile': '{"name":"Maxime"}',
        'fiscal-years-index': '{"years":[2025,2026],"activeYear":2026}',
        'fiscal-year-config-2025': '{}',
        'fiscal-calendar-2026': '{}',
      },
    });

    const parsed = parseBackupText(text);

    expect(parsed.summary).toMatchObject({
      profileName: 'Maxime',
      years: [2025, 2026],
      activeYear: 2026,
      keyCount: 4,
    });
  });

  it('restaure en remplacant les donnees fiscales locales', () => {
    const storage = new MemoryStorage();
    storage.setItem('fiscal-profile', '{"name":"Old"}');
    storage.setItem('fiscal-calendar-2024', '{}');
    storage.setItem('unrelated', 'kept');

    restoreBackupToStorage({
      format: BACKUP_FORMAT,
      formatVersion: 1,
      appVersion: '1.2.0',
      exportedAt: '2026-09-02T10:00:00.000Z',
      data: {
        'fiscal-profile': '{"name":"New"}',
        'fiscal-calendar-2026': '{}',
        ignored: 'nope',
      },
    }, storage);

    expect(storage.getItem('fiscal-profile')).toBe('{"name":"New"}');
    expect(storage.getItem('fiscal-calendar-2024')).toBeNull();
    expect(storage.getItem('fiscal-calendar-2026')).toBe('{}');
    expect(storage.getItem('unrelated')).toBe('kept');
    expect(storage.getItem('ignored')).toBeNull();
  });

  it('preserve les parametres de TVA a l’export et a la restauration', () => {
    const source = new MemoryStorage();
    source.setItem('fiscal-year-config-2026', JSON.stringify({
      year: 2026,
      tvaAssujetti: true,
      tvaRate: 0.2,
      tvaEffectiveDate: '2026-05-01',
    }));

    const backup = createBackupFromStorage(source, new Date('2026-09-02T10:00:00.000Z'));
    const target = new MemoryStorage();
    restoreBackupToStorage(backup, target);

    expect(JSON.parse(target.getItem('fiscal-year-config-2026') ?? '{}')).toMatchObject({
      tvaAssujetti: true,
      tvaRate: 0.2,
      tvaEffectiveDate: '2026-05-01',
    });
  });

  it('refuse les fichiers invalides', () => {
    expect(() => parseBackupText('{bad')).toThrow(BackupImportError);
    expect(() => parseBackupText('{"format":"wrong","formatVersion":1,"data":{}}')).toThrow(BackupImportError);
    expect(() => parseBackupText('{"format":"fiscal-architect-backup","formatVersion":99,"data":{}}')).toThrow(BackupImportError);
  });

  it('genere un nom de fichier date', () => {
    expect(buildBackupFilename(new Date('2026-09-02T10:00:00.000Z')))
      .toBe('fiscal-architect-backup-2026-09-02.fiscal-architect-backup');
  });
});
