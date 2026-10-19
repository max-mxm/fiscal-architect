/** « d'octobre », « d'avril », « de mars » : élision devant voyelle ou h muet. */
export function deMois(name: string): string {
  const lower = name.toLowerCase();
  return /^[aeiouyhàâéèêîôûœ]/.test(lower) ? `d’${lower}` : `de ${lower}`;
}

/** « 1er mars 2024 », « 12 mars 2024 » : date longue avec l'ordinal du premier du mois. */
export function dateLongue(d: Date): string {
  const s = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.getDate() === 1 ? s.replace(/^1 /, '1er ') : s;
}

/** Espaces insécables dans une date courte (« 30 oct. 2026 ») pour éviter les coupures. */
export function nbsp(text: string): string {
  return text.replace(/ /g, ' ');
}
