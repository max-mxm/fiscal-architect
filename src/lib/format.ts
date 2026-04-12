/**
 * Formatage des nombres pour l'affichage — locale fr-FR explicite
 * pour éviter les hydration mismatches SSR/client.
 */

export function formatEuro(value: number): string {
  return Math.round(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}
