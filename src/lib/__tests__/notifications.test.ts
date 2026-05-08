import { describe, expect, it } from 'vitest';
import { computeNotifications, SEUIL_MICRO_WARNING_PCT } from '~/lib/notifications';
import { COMPTE_PRO_THRESHOLD } from '~/lib/fiscal';

describe('computeNotifications', () => {
  it('CA en dessous des seuils → liste vide', () => {
    const r = computeNotifications({ caCumule: 5_000, caRealise: 5_000, seuilMicro: 83_600 });
    expect(r).toEqual([]);
  });

  it('compte-pro déclenché à partir de 10 001 €', () => {
    const r = computeNotifications({ caCumule: 10_001, caRealise: 10_001, seuilMicro: 83_600 });
    expect(r.map((n) => n.id)).toContain('compte-pro');
  });

  it('compte-pro PAS déclenché à exactement 10 000 €', () => {
    const r = computeNotifications({ caCumule: 10_000, caRealise: 10_000, seuilMicro: 83_600 });
    expect(r.find((n) => n.id === 'compte-pro')).toBeUndefined();
  });

  it('seuil-micro-projected à 80 % de projection', () => {
    const r = computeNotifications({ caCumule: 67_000, caRealise: 30_000, seuilMicro: 83_600 });
    expect(r.find((n) => n.id === 'seuil-micro-projected')).toBeDefined();
  });

  it('seuil-micro-breach prend le pas sur projected quand réalisé ≥ seuil', () => {
    const r = computeNotifications({ caCumule: 90_000, caRealise: 85_000, seuilMicro: 83_600 });
    const ids = r.map((n) => n.id);
    expect(ids).toContain('seuil-micro-breach');
    expect(ids).not.toContain('seuil-micro-projected');
  });

  it('breach + compte-pro coexistent', () => {
    const r = computeNotifications({ caCumule: 90_000, caRealise: 85_000, seuilMicro: 83_600 });
    expect(r.map((n) => n.id).sort()).toEqual(['compte-pro', 'seuil-micro-breach']);
  });

  it('niveaux : compte-pro=warning, projected=warning, breach=critical', () => {
    const compte = computeNotifications({ caCumule: 12_000, caRealise: 12_000, seuilMicro: 83_600 })[0];
    expect(compte.level).toBe('warning');

    const proj = computeNotifications({ caCumule: 70_000, caRealise: 30_000, seuilMicro: 83_600 })
      .find((n) => n.id === 'seuil-micro-projected');
    expect(proj?.level).toBe('warning');

    const breach = computeNotifications({ caCumule: 90_000, caRealise: 85_000, seuilMicro: 83_600 })
      .find((n) => n.id === 'seuil-micro-breach');
    expect(breach?.level).toBe('critical');
  });

  it('seuilMicro = 0 → pas de seuil-micro-* (division par zéro évitée)', () => {
    const r = computeNotifications({ caCumule: 50_000, caRealise: 50_000, seuilMicro: 0 });
    expect(r.find((n) => n.id === 'seuil-micro-projected')).toBeUndefined();
    expect(r.find((n) => n.id === 'seuil-micro-breach')).toBeUndefined();
  });

  it("constantes exposées : COMPTE_PRO_THRESHOLD=10000, WARNING_PCT=0.8", () => {
    expect(COMPTE_PRO_THRESHOLD).toBe(10_000);
    expect(SEUIL_MICRO_WARNING_PCT).toBe(0.8);
  });
});
