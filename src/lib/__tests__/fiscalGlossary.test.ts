import { describe, expect, it } from 'vitest';
import { FISCAL_GLOSSARY } from '~/lib/fiscalGlossary';

describe('glossaire ACRE', () => {
  it('mentionne les deux taux appliqués par le moteur (50 % avant le 1er mai 2024, 25 % ensuite)', () => {
    const { body } = FISCAL_GLOSSARY.acre;
    expect(body).toMatch(/50\s?%/);
    expect(body).toMatch(/25\s?%/);
    expect(body).toMatch(/1er mai 2024/);
    expect(body).toMatch(/12 premiers mois/);
  });

  it('ne présente plus la réduction de moitié comme règle générale', () => {
    expect(FISCAL_GLOSSARY.acre.body).not.toMatch(/^.*Réduction de moitié des cotisations/);
  });
});
