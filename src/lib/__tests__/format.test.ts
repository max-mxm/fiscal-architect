import { describe, expect, it } from 'vitest';
import { formatEuro, formatPercent } from '~/lib/format';

describe('formatEuro', () => {
  it('formate un entier sans décimale', () => {
    expect(formatEuro(1234)).toBe('1 234');
  });

  it('formate avec un séparateur de millier (espace insécable fine)', () => {
    expect(formatEuro(1_234_567)).toBe('1 234 567');
  });

  it('arrondit les décimales', () => {
    expect(formatEuro(1234.6)).toBe('1 235');
    expect(formatEuro(1234.4)).toBe('1 234');
  });

  it('formate 0', () => {
    expect(formatEuro(0)).toBe('0');
  });

  it('gère les montants négatifs', () => {
    expect(formatEuro(-1234)).toBe('-1 234');
  });
});

describe('formatPercent', () => {
  it('formate avec 1 décimale par défaut', () => {
    expect(formatPercent(12.345)).toBe('12.3');
  });

  it('respecte le nombre de décimales custom', () => {
    expect(formatPercent(12.345, 2)).toBe('12.35');
    expect(formatPercent(12.345, 0)).toBe('12');
  });

  it('formate 0', () => {
    expect(formatPercent(0)).toBe('0.0');
  });
});
